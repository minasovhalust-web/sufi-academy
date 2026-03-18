import { EnrollmentStatus } from '@prisma/client';
export declare class UpdateEnrollmentDto {
    status?: EnrollmentStatus;
    progress?: number;
}
