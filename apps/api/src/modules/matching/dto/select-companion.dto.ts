import { IsUUID } from 'class-validator';

export class SelectCompanionDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  companionId!: string;
}
