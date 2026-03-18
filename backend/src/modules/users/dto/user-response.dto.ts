import { Role } from '../../../common/enums/role.enum';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: any) {
    this.id = partial.id;
    this.email = partial.email;
    this.firstName = partial.firstName;
    this.lastName = partial.lastName;
    this.role = partial.role;
    this.isActive = partial.isActive;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}
