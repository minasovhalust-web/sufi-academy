import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * SendMessageRestDto — body for the REST POST endpoint.
 *
 * courseId comes from the URL parameter, so only content is in the body.
 * Content limits match the WebSocket SendMessageDto.
 */
export class SendMessageRestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}
