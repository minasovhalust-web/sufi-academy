import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  /** true = activate the account, false = deactivate (block) the account. */
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
