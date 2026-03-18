import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { Role } from '../../../common/enums/role.enum';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto): Promise<UserResponseDto>;
    findAll(page?: number, limit?: number, role?: Role): Promise<{
        users: UserResponseDto[];
        total: number;
    }>;
    getMyProfile(user: JwtPayload): Promise<UserResponseDto>;
    update(id: string, dto: UpdateUserDto, user: JwtPayload): Promise<UserResponseDto>;
}
