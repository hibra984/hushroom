import { IsString, IsOptional } from 'class-validator';

export class CreateAbuseReportDto {
  @IsString()
  reportedUserId!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsString()
  reason!: string;

  @IsString()
  description!: string;
}
