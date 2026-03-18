import { IsString, IsUUID, IsObject } from 'class-validator';

/**
 * WebRtcSignalDto — WebRTC signaling relay payload.
 *
 * The gateway acts as a pure relay: it forwards the signal opaquely to
 * the target peer without inspecting or modifying the content.
 *
 * The signal object can be any of:
 *   { type: 'offer',     sdp: string }           — SDP offer
 *   { type: 'answer',    sdp: string }           — SDP answer
 *   { type: 'candidate', candidate: {...} }       — ICE candidate
 *
 * No media data ever flows through the server.
 * Both peers must be in the same session (sessionId is used for logging only).
 */
export class WebRtcSignalDto {
  @IsString()
  @IsUUID()
  sessionId: string;

  /** The userId of the peer this signal should be forwarded to. */
  @IsString()
  @IsUUID()
  targetUserId: string;

  /**
   * Opaque signal payload — the gateway never reads or transforms this.
   * Must be a plain object (offer/answer/candidate from RTCPeerConnection).
   */
  @IsObject()
  signal: Record<string, unknown>;
}
