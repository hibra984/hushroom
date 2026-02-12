import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class BlockDateDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime?: string;
}
