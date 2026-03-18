import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { LiveService } from '../services/live.service';
import { CreateSessionDto } from '../dto/create-session.dto';

/**
 * LiveController — REST endpoints for live session lifecycle management.
 *
 * All routes protected by the global JwtAuthGuard.
 * Role and ownership checks are enforced inside LiveService.
 *
 * Session lifecycle (REST):
 *   POST   /live/sessions                    create (TEACHER own courses | ADMIN)
 *   PATCH  /live/sessions/:id/start          SCHEDULED → LIVE (host | ADMIN)
 *   PATCH  /live/sessions/:id/end            LIVE → ENDED    (host | ADMIN)
 *
 * Real-time operations (WebSocket /live):
 *   join-session, leave-session, raise-hand,
 *   grant-mic, revoke-mic, webrtc-signal, end-session
 *
 * Read endpoints (any authenticated user):
 *   GET    /live/sessions/course/:courseId   list sessions for a course
 *   GET    /live/sessions/:id               session detail
 *   GET    /live/sessions/:id/participants  active participants
 */
@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  // ── Session lifecycle ───────────────────────────────────────────────────────

  @Post('sessions')
  create(@Body() dto: CreateSessionDto, @Req() req: any) {
    return this.liveService.createSession(dto, req.user.sub, req.user.role);
  }

  @Patch('sessions/:id/start')
  @HttpCode(HttpStatus.OK)
  start(@Param('id') id: string, @Req() req: any) {
    return this.liveService.startSession(id, req.user.sub, req.user.role);
  }

  @Patch('sessions/:id/end')
  @HttpCode(HttpStatus.OK)
  end(@Param('id') id: string, @Req() req: any) {
    return this.liveService.endSession(id, req.user.sub, req.user.role);
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  /**
   * Note: /course/:courseId must be declared BEFORE /:id to avoid
   * "course" being matched as an :id path parameter.
   */
  @Get('sessions/course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.liveService.findSessionsByCourse(courseId);
  }

  @Get('sessions/:id')
  findOne(@Param('id') id: string) {
    return this.liveService.findSessionById(id);
  }

  @Get('sessions/:id/participants')
  getParticipants(@Param('id') id: string) {
    return this.liveService.getActiveParticipants(id);
  }
}
