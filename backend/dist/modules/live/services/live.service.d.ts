import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { LiveRepository, LiveParticipantWithUser, LiveSessionWithRelations } from '../repositories/live.repository';
import { CreateSessionDto } from '../dto/create-session.dto';
export interface SessionState {
    session: LiveSessionWithRelations;
    participants: LiveParticipantWithUser[];
    activeCount: number;
}
export declare class LiveService {
    private readonly liveRepository;
    private readonly eventEmitter;
    constructor(liveRepository: LiveRepository, eventEmitter: EventEmitter2);
    createSession(dto: CreateSessionDto, requesterId: string, requesterRole: Role): Promise<LiveSessionWithRelations>;
    findSessionById(id: string): Promise<LiveSessionWithRelations>;
    findSessionsByCourse(courseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        courseId: string;
        startedAt: Date | null;
        endedAt: Date | null;
        hostId: string;
    }[]>;
    startSession(sessionId: string, requesterId: string, requesterRole: Role): Promise<LiveSessionWithRelations>;
    endSession(sessionId: string, requesterId: string, requesterRole: Role): Promise<LiveSessionWithRelations>;
    joinSession(sessionId: string, userId: string): Promise<LiveParticipantWithUser>;
    leaveSession(sessionId: string, userId: string): Promise<void>;
    raiseHand(sessionId: string, userId: string): Promise<void>;
    grantMic(sessionId: string, targetUserId: string, requesterId: string, requesterRole: Role): Promise<void>;
    revokeMic(sessionId: string, targetUserId: string, requesterId: string, requesterRole: Role): Promise<void>;
    getSessionState(sessionId: string): Promise<SessionState>;
    getActiveParticipants(sessionId: string): Promise<LiveParticipantWithUser[]>;
}
