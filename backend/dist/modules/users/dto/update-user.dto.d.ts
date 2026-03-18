import { Role } from '../../../common/enums/role.enum';
export declare class UpdateUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: Role;
    isActive?: boolean;
}
