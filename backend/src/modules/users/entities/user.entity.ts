import { Role } from '../../../common/enums/role.enum';

export class UserEntity {
  id: string;
  email: string;
  password: string;
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
  constructor(partial: Partial<UserEntity>) { Object.assign(this, partial); }
}
