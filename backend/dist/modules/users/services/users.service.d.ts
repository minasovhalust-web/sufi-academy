import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { Role } from '../../../common/enums/role.enum';
export declare class UsersService {
    private readonly usersRepository;
    private readonly eventEmitter;
    private readonly logger;
    constructor(usersRepository: UsersRepository, eventEmitter: EventEmitter2);
    create(dto: CreateUserDto): Promise<UserEntity>;
    findById(id: string): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findAll(params: {
        page?: number;
        limit?: number;
        role?: Role;
    }): Promise<{
        users: UserEntity[];
        total: number;
    }>;
    update(id: string, dto: UpdateUserDto, updatedById?: string): Promise<UserEntity>;
    updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
    validateCredentials(email: string, password: string): Promise<UserEntity | null>;
}
