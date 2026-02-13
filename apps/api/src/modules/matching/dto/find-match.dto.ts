import { IsUUID, IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class FindMatchDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  expertiseTag?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  onlineOnly?: boolean;
}
