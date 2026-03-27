import { DirectMessagesService } from '../services/direct-messages.service';
import { GetConversationDto } from '../dto/get-conversation.dto';
import { SendDirectMessageDto } from '../dto/send-direct-message.dto';
export declare class DirectMessagesController {
    private readonly service;
    constructor(service: DirectMessagesService);
    getConversations(req: any): Promise<{
        user: import("../repositories/direct-messages.repository").DirectMessageUser;
        lastMessage: import("../repositories/direct-messages.repository").DirectMessageWithUsers;
    }[]>;
    getMessages(partnerId: string, req: any, query: GetConversationDto): Promise<import("../repositories/direct-messages.repository").DirectMessageWithUsers[]>;
    sendMessage(receiverId: string, req: any, body: SendDirectMessageDto): Promise<import("../repositories/direct-messages.repository").DirectMessageWithUsers>;
}
