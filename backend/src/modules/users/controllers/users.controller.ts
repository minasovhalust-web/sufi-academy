import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
import { STORAGE_SERVICE, StorageService } from '../../storage/storage.interface';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

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

  /**
   * POST /users/avatar
   * Accepts a multipart/form-data file in the "file" field.
   * Uploads it to StorageService and updates the user's avatarUrl.
   */
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Send the image in the "file" field.');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: jpeg, png, gif, webp.`);
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File is too large. Maximum size is 5 MB.');
    }

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const key = `avatars/${user.sub}-${Date.now()}.${ext}`;

    const { url } = await this.storageService.upload(file.buffer, key, file.mimetype);
    const updated = await this.usersService.updateAvatar(user.sub, url);

    return new UserResponseDto(updated);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtPayload) {
    if (user.sub !== id && user.role !== Role.ADMIN) throw new Error('Access denied.');
    return new UserResponseDto(await this.usersService.update(id, dto, user.sub));
  }
}
