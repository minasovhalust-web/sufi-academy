import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class AnalyticsQueryDto {
  /** Start of date range (ISO 8601). Defaults to 30 days ago. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** End of date range (ISO 8601). Defaults to now. */
  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
