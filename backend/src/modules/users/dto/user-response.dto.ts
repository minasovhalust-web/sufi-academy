import { Role } from '../../../common/enums/role.enum';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  specialization?: string | null;
  country?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: any) {
    this.id = partial.id;
    this.email = partial.email;
    this.firstName = partial.firstName;
    this.lastName = partial.lastName;
    this.role = partial.role;
    this.isActive = partial.isActive;
    this.avatarUrl = partial.avatarUrl ?? null;
    this.bio = partial.bio ?? null;
    this.specialization = partial.specialization ?? null;
    this.country = partial.country ?? null;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}
