import { LiveService } from '../services/live.service';
import { CreateSessionDto } from '../dto/create-session.dto';
export declare class LiveController {
    private readonly liveService;
    constructor(liveService: LiveService);
    create(dto: CreateSessionDto, req: any): Promise<import("../repositories/live.repository").LiveSessionWithRelations>;
    start(id: string, req: any): Promise<import("../repositories/live.repository").LiveSessionWithRelations>;
    end(id: string, req: any): Promise<import("../repositories/live.repository").LiveSessionWithRelations>;
    findByCourse(courseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        courseId: string;
        startedAt: Date | null;
        endedAt: Date | null;
        hostId: string;
    }[]>;
    findOne(id: string): Promise<import("../repositories/live.repository").LiveSessionWithRelations>;
    getParticipants(id: string): Promise<import("../repositories/live.repository").LiveParticipantWithUser[]>;
}
