import { ChatRepository } from '../repositories/chat.repository';
export declare class ChatListener {
    private readonly chatRepository;
    private readonly logger;
    constructor(chatRepository: ChatRepository);
    onCourseCreated(payload: {
        courseId: string;
        instructorId: string;
        title: string;
        slug: string;
    }): Promise<void>;
}
