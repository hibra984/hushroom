import { IsString, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class CreateRatingDto {
  @IsString()
  sessionId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  overallScore!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  goalAchievement?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  presenceQuality?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  contractAdherence?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
