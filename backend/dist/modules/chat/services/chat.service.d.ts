import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatRepository, ChatMessageWithSender } from '../repositories/chat.repository';
import { ChatRoom } from '../entities/chat-message.entity';
import { GetMessagesDto } from '../dto/get-messages.dto';
declare enum Role {
    ADMIN = "ADMIN",
    TEACHER = "TEACHER",
    STUDENT = "STUDENT"
}
export interface PaginatedMessages {
    messages: ChatMessageWithSender[];
    total: number;
    hasMore: boolean;
}
export declare class ChatService {
    private readonly chatRepository;
    private readonly eventEmitter;
    constructor(chatRepository: ChatRepository, eventEmitter: EventEmitter2);
    validateRoomAccess(courseId: string, userId: string, userRole?: string): Promise<void>;
    getOrCreateRoom(courseId: string): Promise<ChatRoom>;
    getRoomMessages(courseId: string, userId: string, userRole: string, query: GetMessagesDto): Promise<PaginatedMessages>;
    sendMessage(courseId: string, content: string, senderId: string, senderRole?: string, replyToId?: string): Promise<ChatMessageWithSender>;
    getRecentMessages(courseId: string, cursor?: string, limit?: number): Promise<ChatMessageWithSender[]>;
    deleteMessage(messageId: string, requesterId: string, requesterRole: Role): Promise<ChatMessageWithSender>;
}
export {};
