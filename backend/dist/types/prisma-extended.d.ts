export { CourseStatus, MaterialType, EnrollmentStatus } from '@prisma/client';
export type Course = {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    status: any;
    instructorId: string;
    createdAt: Date;
    updatedAt: Date;
};
export type CourseModule = {
    id: string;
    title: string;
    order: number;
    courseId: string;
    createdAt: Date;
    updatedAt: Date;
};
export type Lesson = {
    id: string;
    title: string;
    content: string | null;
    order: number;
    duration: number | null;
    moduleId: string;
    createdAt: Date;
    updatedAt: Date;
};
export type Material = {
    id: string;
    title: string;
    type: any;
    url: string;
    lessonId: string;
    createdAt: Date;
};
export type Enrollment = {
    id: string;
    status: any;
    progress: number;
    userId: string;
    courseId: string;
    enrolledAt: Date;
    updatedAt: Date;
};
