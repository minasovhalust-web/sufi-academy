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
export declare enum EnrollmentStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
