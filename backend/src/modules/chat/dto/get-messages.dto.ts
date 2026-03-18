import { IsString, IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GetMessagesDto — query parameters for the REST message history endpoint.
 *
 * Uses cursor-based pagination (cursor = message ID of the oldest item visible).
 * Returning newest-first from DB, then reversing to chronological order.
 */
export class GetMessagesDto {
  /**
   * Message ID of the oldest visible message.
   * Pass this to load the previous page (messages older than the cursor).
   * Omit to load the most recent messages.
   */
  @IsString()
  @IsUUID()
  @IsOptional()
  cursor?: string;

  /** Number of messages to return. Default: 50. Max: 100. */
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
