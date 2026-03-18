import { ActivityEventType } from '@prisma/client';
export declare class ActivityLogEntity {
    id: string;
    event: ActivityEventType;
    actorId: string | null;
    subjectId: string | null;
    subjectType: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    constructor(partial: Partial<ActivityLogEntity>);
}
