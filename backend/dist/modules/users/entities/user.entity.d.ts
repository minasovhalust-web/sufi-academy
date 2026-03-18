import { Role } from '../../../common/enums/role.enum';
export declare class UserEntity {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<UserEntity>);
}
