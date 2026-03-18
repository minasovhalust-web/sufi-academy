import { Role } from '@prisma/client';
export declare class GetUsersDto {
    role?: Role;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}
