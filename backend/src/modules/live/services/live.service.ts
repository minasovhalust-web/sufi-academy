import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ParticipantRole, Role, SessionStatus } from '@prisma/client';
import {
  LiveRepository,
  LiveParticipantWithUser,
  LiveSessionWithRelations,
} from '../repositories/live.repository';
import { CreateSessionDto } from '../dto/create-session.dto';

export interface SessionState {
  session: LiveSessionWithRelations;
  participants: LiveParticipantWithUser[];
  activeCount: number;
}

/**
 * LiveService — business logic for live sessions.
 *
 * Authorization rules:
 *   createSession : requesterRole === TEACHER (own courses only) | ADMIN (any course)
 *   startSession  : session.hostId === requesterId | ADMIN
 *   endSession    : session.hostId === requesterId | ADMIN
 *   joinSession   : session not ENDED + (host | enrolled student)
 *   leaveSession  : any participant
 *   raiseHand     : existing participant (leftAt === null)
 *   grantMic      : session.hostId === requesterId | ADMIN
 *   revokeMic     : session.hostId === requesterId | ADMIN
 *
 * WebRTC relay (webrtc-signal) has no authorization check beyond
 * "the sender is an authenticated, connected user" — enforced by WsJwtGuard.
 */
@Injectable()
export class LiveService {
  constructor(
    private readonly liveRepository: LiveRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Session lifecycle ───────────────────────────────────────────────────────

  async createSession(
    dto: CreateSessionDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<LiveSessionWithRelations> {
    if (requesterRole !== Role.TEACHER && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only teachers and admins can create live sessions',
      );
    }

    // Teachers may only create sessions for their own courses
    if (requesterRole === Role.TEACHER) {
      const isInstructor = await this.liveRepository.checkIsInstructor(
        dto.courseId,
        requesterId,
      );
      if (!isInstructor) {
        throw new ForbiddenException(
          'You can only create live sessions for courses you teach',
        );
      }
    }

    return this.liveRepository.createSession({
      title: dto.title,
      courseId: dto.courseId,
      hostId: requesterId,
      scheduledAt: dto.scheduledAt,
    });
  }

  async findSessionById(id: string): Promise<LiveSessionWithRelations> {
    const session = await this.liveRepository.findSessionById(id);
    if (!session) throw new NotFoundException(`Session #${id} not found`);
    return session;
  }

  async findSessionsByCourse(courseId: string) {
    return this.liveRepository.findSessionsByCourse(courseId);
  }

  async startSession(
    sessionId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<LiveSessionWithRelations> {
    const session = await this.findSessionById(sessionId);

    if (session.hostId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the session host or an admin can start this session',
      );
    }
    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot start a session with status "${session.status}"`,
      );
    }

    const updatedSession = await this.liveRepository.updateSession(sessionId, {
      status: SessionStatus.LIVE,
      startedAt: new Date(),
    });
    this.eventEmitter.emit('live.session.started', {
      sessionId: updatedSession.id,
      courseId: updatedSession.courseId,
      hostId: updatedSession.hostId,
      title: updatedSession.title,
    });
    return updatedSession;
  }

  async endSession(
    sessionId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<LiveSessionWithRelations> {
    const session = await this.findSessionById(sessionId);

    if (session.hostId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the session host or an admin can end this session',
      );
    }
    if (session.status === SessionStatus.ENDED) {
      throw new BadRequestException('Session has already ended');
    }

    const endedAt = new Date();
    const updatedSession = await this.liveRepository.updateSession(sessionId, {
      status: SessionStatus.ENDED,
      endedAt,
    });
    this.eventEmitter.emit('live.session.ended', {
      sessionId: updatedSession.id,
      courseId: updatedSession.courseId,
      hostId: updatedSession.hostId,
      title: updatedSession.title,
      endedAt,
    });
    return updatedSession;
  }

  // ── Participant management ──────────────────────────────────────────────────

  async joinSession(
    sessionId: string,
    userId: string,
  ): Promise<LiveParticipantWithUser> {
    const session = await this.findSessionById(sessionId);

    if (session.status === SessionStatus.ENDED) {
      throw new BadRequestException('This session has already ended');
    }

    const isHost = session.hostId === userId;

    if (!isHost) {
      const hasAccess = await this.liveRepository.checkCourseAccess(
        session.courseId,
        userId,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You must be enrolled in this course to join the session',
        );
      }
    }

    return this.liveRepository.findOrCreateParticipant(
      sessionId,
      userId,
      isHost ? ParticipantRole.HOST : ParticipantRole.STUDENT,
    );
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    await this.liveRepository.markParticipantLeft(sessionId, userId);
  }

  async raiseHand(sessionId: string, userId: string): Promise<void> {
    const participant = await this.liveRepository.findParticipant(sessionId, userId);
    if (!participant || participant.leftAt !== null) {
      throw new ForbiddenException(
        'You must be an active participant to raise your hand',
      );
    }
    await this.liveRepository.updateParticipant(sessionId, userId, {
      handRaised: true,
    });
  }

  async grantMic(
    sessionId: string,
    targetUserId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const session = await this.findSessionById(sessionId);
    if (session.hostId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the session host can grant microphone access',
      );
    }
    // Automatically lower the hand when mic is granted
    await this.liveRepository.updateParticipant(sessionId, targetUserId, {
      micEnabled: true,
      handRaised: false,
    });
  }

  async revokeMic(
    sessionId: string,
    targetUserId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const session = await this.findSessionById(sessionId);
    if (session.hostId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the session host can revoke microphone access',
      );
    }
    await this.liveRepository.updateParticipant(sessionId, targetUserId, {
      micEnabled: false,
    });
  }

  // ── State queries ───────────────────────────────────────────────────────────

  async getSessionState(sessionId: string): Promise<SessionState> {
    const session = await this.findSessionById(sessionId);
    const participants = await this.liveRepository.findActiveParticipants(sessionId);
    return { session, participants, activeCount: participants.length };
  }

  async getActiveParticipants(sessionId: string): Promise<LiveParticipantWithUser[]> {
    await this.findSessionById(sessionId); // validate existence
    return this.liveRepository.findActiveParticipants(sessionId);
  }
}
