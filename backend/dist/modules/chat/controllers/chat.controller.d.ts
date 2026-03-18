import { ChatService } from '../services/chat.service';
import { GetMessagesDto } from '../dto/get-messages.dto';
import { SendMessageRestDto } from '../dto/send-message-rest.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getMessages(courseId: string, query: GetMessagesDto, req: any): Promise<import("../services/chat.service").PaginatedMessages>;
    sendMessage(courseId: string, body: SendMessageRestDto, req: any): Promise<import("../repositories/chat.repository").ChatMessageWithSender>;
}
