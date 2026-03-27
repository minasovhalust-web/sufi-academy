import { PrismaService } from '../../../prisma/prisma.service';
export interface DirectMessageUser {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
}
export interface DirectMessageWithUsers {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: Date;
    sender: DirectMessageUser;
    receiver: DirectMessageUser;
}
export declare class DirectMessagesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findConversations(userId: string): Promise<{
        user: DirectMessageUser;
        lastMessage: DirectMessageWithUsers;
    }[]>;
    findMessages(userId: string, otherId: string, limit: number): Promise<DirectMessageWithUsers[]>;
    createMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessageWithUsers>;
    receiverExists(userId: string): Promise<boolean>;
}
