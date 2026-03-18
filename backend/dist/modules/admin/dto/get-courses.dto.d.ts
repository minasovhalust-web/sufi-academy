import { CourseStatus } from '@prisma/client';
export declare class GetCoursesDto {
    status?: CourseStatus;
    teacherId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
