import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return new UserResponseDto(await this.usersService.create(dto));
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('role') role?: Role) {
    const { users, total } = await this.usersService.findAll({ page, limit, role });
    return { users: users.map(u => new UserResponseDto(u)), total };
  }

  @Get('me')
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return new UserResponseDto(await this.usersService.findById(user.sub));
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtPayload) {
    if (user.sub !== id && user.role !== Role.ADMIN) throw new Error('Access denied.');
    // Pass updatedById so UsersService can emit admin.teacher.assigned when needed
    return new UserResponseDto(await this.usersService.update(id, dto, user.sub));
  }
}
