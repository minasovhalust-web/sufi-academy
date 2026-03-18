import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../../../common/enums/role.enum';

/**
 * UsersRepository is the ONLY layer that communicates with Prisma
 * for user-related data access.
 *
 * Responsibilities:
 * - Translate DTOs / raw data into Prisma operations
 * - Map Prisma result objects back to UserEntity domain objects
 * - Never contain business logic (no role checks, no hashing, etc.)
 *
 * Services depend on this repository — they never import PrismaService.
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Maps a raw Prisma user object to a UserEntity.
   * Centralizes the mapping so changes to Prisma schema
   * only need updating here.
   */
  private mapToEntity(prismaUser: {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity({
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      role: prismaUser.role as Role,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  async create(
    dto: CreateUserDto & { hashedPassword: string },
  ): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          password: dto.hashedPassword,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          role: dto.role ?? Role.STUDENT,
        },
      });
      return this.mapToEntity(user);
    } catch (error: unknown) {
      this.logger.error('Failed to create user', error);
      throw new InternalServerErrorException('Could not create user.');
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    role?: Role;
  }): Promise<UserEntity[]> {
    const { skip = 0, take = 20, role } = params;
    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async update(
    id: string,
    data: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
      isActive: boolean;
    }>,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.mapToEntity(user);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase().trim() },
    });
    return count > 0;
  }

  async countByRole(role: Role): Promise<number> {
    return this.prisma.user.count({ where: { role } });
  }
}
