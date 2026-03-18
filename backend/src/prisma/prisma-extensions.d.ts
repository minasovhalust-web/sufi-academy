import { PrismaClient } from '@prisma/client';

declare global {
  namespace PrismaClient {
    interface Prisma$ChatRoomPayload {}
    interface Prisma$ChatMessagePayload {}
  }
}

declare module '@prisma/client' {
  export interface ChatRoom {
    id: string;
    courseId: string;
    createdAt: Date;
  }

  export interface ChatMessage {
    id: string;
    content: string;
    roomId: string;
    senderId: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export enum Role {
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
  }

  export enum EnrollmentStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
  }

  interface PrismaClient {
    chatRoom: PrismaClientChatRoom;
    chatMessage: PrismaClientChatMessage;
  }
}
