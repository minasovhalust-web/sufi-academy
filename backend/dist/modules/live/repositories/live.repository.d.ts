import { LiveParticipant, LiveSession, ParticipantRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export type LiveSessionWithRelations = LiveSession & {
    host: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    course: {
        id: string;
        title: string;
        slug: string;
    };
};
export type LiveParticipantWithUser = LiveParticipant & {
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
};
export declare class LiveRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkIsInstructor(courseId: string, userId: string): Promise<boolean>;
    checkCourseAccess(courseId: string, userId: string): Promise<boolean>;
    createSession(data: {
        title: string;
        courseId: string;
        hostId: string;
        scheduledAt?: string;
    }): Promise<LiveSessionWithRelations>;
    findSessionById(id: string): Promise<LiveSessionWithRelations | null>;
    findSessionsByCourse(courseId: string): Promise<LiveSession[]>;
    updateSession(id: string, data: Prisma.LiveSessionUpdateInput): Promise<LiveSessionWithRelations>;
    findOrCreateParticipant(sessionId: string, userId: string, role: ParticipantRole): Promise<LiveParticipantWithUser>;
    findParticipant(sessionId: string, userId: string): Promise<LiveParticipant | null>;
    findActiveParticipants(sessionId: string): Promise<LiveParticipantWithUser[]>;
    updateParticipant(sessionId: string, userId: string, data: Prisma.LiveParticipantUpdateInput): Promise<LiveParticipant>;
    markParticipantLeft(sessionId: string, userId: string): Promise<void>;
}
