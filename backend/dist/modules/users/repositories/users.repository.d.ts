import { PrismaService } from '../../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../../../common/enums/role.enum';
export declare class UsersRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private mapToEntity;
    create(dto: CreateUserDto & {
        hashedPassword: string;
    }): Promise<UserEntity>;
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findAll(params: {
        skip?: number;
        take?: number;
        role?: Role;
    }): Promise<UserEntity[]>;
    update(id: string, data: Partial<{
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
        isActive: boolean;
    }>): Promise<UserEntity>;
    updatePassword(id: string, hashedPassword: string): Promise<void>;
    existsByEmail(email: string): Promise<boolean>;
    countByRole(role: Role): Promise<number>;
}
