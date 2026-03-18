import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { Role } from '../../../common/enums/role.enum';

/**
 * UsersService contains ALL business logic for user management.
 *
 * Rules:
 * - Never imports PrismaService — all DB access goes through UsersRepository.
 * - Handles: uniqueness checks, password hashing, validation logic.
 * - Returns UserEntity objects — never raw Prisma types.
 *
 * The bcrypt salt rounds constant is defined here because it's a
 * business-level security decision, not a data access detail.
 */

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a new user.
   * - Checks for duplicate email.
   * - Hashes password before passing to repository.
   * - Defaults role to STUDENT if not provided.
   */
  async create(dto: CreateUserDto): Promise<UserEntity> {
    const emailExists = await this.usersRepository.existsByEmail(dto.email);

    if (emailExists) {
      throw new ConflictException(
        `A user with email "${dto.email}" already exists.`,
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersRepository.create({
      ...dto,
      role: dto.role ?? Role.STUDENT,
      hashedPassword,
    });

    this.logger.log(`User created: ${user.id} [${user.role}]`);
    return user;
  }

  /**
   * Finds a user by ID. Throws 404 if not found.
   */
  async findById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return user;
  }

  /**
   * Finds a user by email. Returns null if not found.
   * Used by AuthService during login — null is valid (not an error).
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  /**
   * Lists users with optional filtering and pagination.
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    role?: Role;
  }): Promise<{ users: UserEntity[]; total: number }> {
    const { page = 1, limit = 20, role } = params;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.usersRepository.findAll({ skip, take: limit, role }),
      role
        ? this.usersRepository.countByRole(role)
        : // For total count without role filter, count all
          // This is a simplification — a full count query would be added in production
          this.usersRepository.findAll({ skip: 0, take: 10000 }).then((u) => u.length),
    ]);

    return { users, total };
  }

  /**
   * Updates a user's profile data.
   * Throws 404 if the user does not exist.
   * Emits 'admin.teacher.assigned' when a user's role is set to TEACHER.
   */
  async update(
    id: string,
    dto: UpdateUserDto,
    updatedById?: string,
  ): Promise<UserEntity> {
    // Verify user exists before updating
    const existing = await this.findById(id);

    const updated = await this.usersRepository.update(id, {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.email && { email: dto.email }),
      ...(dto.role && { role: dto.role }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    // Emit event when a user is promoted to TEACHER
    if (
      dto.role === Role.TEACHER &&
      existing.role !== Role.TEACHER &&
      updatedById
    ) {
      this.eventEmitter.emit('admin.teacher.assigned', {
        userId: id,
        assignedById: updatedById,
      });
    }

    return updated;
  }

  /**
   * Updates a user's password.
   * Hashes the new password before storage.
   * Verifies the current password before allowing the change.
   */
  async updatePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(id);

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ConflictException('Current password is incorrect.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersRepository.updatePassword(id, hashedPassword);

    this.logger.log(`Password updated for user: ${id}`);
  }

  /**
   * Validates a user's credentials during login.
   * Used exclusively by AuthService.
   * Returns the user if valid, null otherwise.
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
