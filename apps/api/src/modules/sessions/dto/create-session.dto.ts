import { IsEnum, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { SessionType } from '@prisma/client';

export class CreateSessionDto {
  @IsEnum(SessionType)
  type!: SessionType;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  plannedDuration?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
