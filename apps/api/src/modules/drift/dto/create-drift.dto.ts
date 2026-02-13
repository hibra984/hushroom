import { IsUUID, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateDriftDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;
}
