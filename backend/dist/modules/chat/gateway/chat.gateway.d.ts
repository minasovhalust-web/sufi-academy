import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { ChatService } from '../services/chat.service';
import { JoinRoomDto } from '../dto/join-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { DeleteMessageDto } from '../dto/delete-message.dto';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly jwtService;
    private readonly server;
    private readonly logger;
    constructor(chatService: ChatService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, dto: JoinRoomDto): Promise<void>;
    handleLeaveRoom(client: Socket, dto: JoinRoomDto): Promise<void>;
    handleSendMessage(client: Socket, dto: SendMessageDto): Promise<void>;
    handleDeleteMessage(client: Socket, dto: DeleteMessageDto): Promise<void>;
    handleTyping(client: Socket, dto: JoinRoomDto): void;
    private extractToken;
    private emitException;
}
