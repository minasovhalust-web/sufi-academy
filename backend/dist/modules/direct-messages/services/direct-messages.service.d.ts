import { DirectMessagesRepository, DirectMessageWithUsers, DirectMessageUser } from '../repositories/direct-messages.repository';
import { GetConversationDto } from '../dto/get-conversation.dto';
import { SendDirectMessageDto } from '../dto/send-direct-message.dto';
export declare class DirectMessagesService {
    private readonly repo;
    constructor(repo: DirectMessagesRepository);
    getConversations(userId: string): Promise<{
        user: DirectMessageUser;
        lastMessage: DirectMessageWithUsers;
    }[]>;
    getMessages(requesterId: string, partnerId: string, query: GetConversationDto): Promise<DirectMessageWithUsers[]>;
    sendMessage(senderId: string, receiverId: string, dto: SendDirectMessageDto): Promise<DirectMessageWithUsers>;
}
