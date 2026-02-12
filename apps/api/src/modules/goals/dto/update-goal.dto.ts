import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsBoolean()
  isAchieved?: boolean;

  @IsOptional()
  @IsString()
  achievementNote?: string;
}
