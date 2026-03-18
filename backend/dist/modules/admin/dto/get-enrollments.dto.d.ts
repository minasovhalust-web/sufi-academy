import { EnrollmentStatus } from '@prisma/client';
export declare class GetEnrollmentsDto {
    status?: EnrollmentStatus;
    page?: number;
    limit?: number;
}
