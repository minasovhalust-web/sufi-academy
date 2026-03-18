import { PrismaService } from '../../../prisma/prisma.service';
import { ChatRoom, ChatMessage } from '../entities/chat-message.entity';
export type ReplyToMessage = {
    id: string;
    content: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
    };
};
export type ChatMessageWithSender = ChatMessage & {
    sender: {
        id: string;
        firstName: string;
        lastName: string;
    };
    replyTo: ReplyToMessage | null;
};
export declare class ChatRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkUserAccess(courseId: string, userId: string): Promise<boolean>;
    findRoomByCourse(courseId: string): Promise<ChatRoom | null>;
    findOrCreateRoom(courseId: string): Promise<ChatRoom>;
    findMessages(roomId: string, options: {
        cursor?: string;
        limit: number;
    }): Promise<ChatMessageWithSender[]>;
    countMessages(roomId: string): Promise<number>;
    createMessage(data: {
        roomId: string;
        senderId: string;
        content: string;
        replyToId?: string;
    }): Promise<ChatMessageWithSender>;
    findMessage(id: string): Promise<ChatMessage | null>;
    softDeleteMessage(id: string): Promise<ChatMessageWithSender>;
}
