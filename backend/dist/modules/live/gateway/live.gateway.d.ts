import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { LiveService } from '../services/live.service';
import { SessionActionDto } from '../dto/session-action.dto';
import { MicActionDto } from '../dto/mic-action.dto';
import { WebRtcSignalDto } from '../dto/webrtc-signal.dto';
export declare class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly liveService;
    private readonly jwtService;
    private readonly server;
    private readonly logger;
    private readonly userSockets;
    constructor(liveService: LiveService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinSession(client: Socket, dto: SessionActionDto): Promise<void>;
    handleLeaveSession(client: Socket, dto: SessionActionDto): Promise<void>;
    handleRaiseHand(client: Socket, dto: SessionActionDto): Promise<void>;
    handleGrantMic(client: Socket, dto: MicActionDto): Promise<void>;
    handleRevokeMic(client: Socket, dto: MicActionDto): Promise<void>;
    handleWebRtcSignal(client: Socket, dto: WebRtcSignalDto): void;
    handleEndSession(client: Socket, dto: SessionActionDto): Promise<void>;
    private extractToken;
    private emitException;
}
