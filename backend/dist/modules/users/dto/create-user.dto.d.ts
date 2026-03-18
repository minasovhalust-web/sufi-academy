import { Role } from '../../../common/enums/role.enum';
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
}
