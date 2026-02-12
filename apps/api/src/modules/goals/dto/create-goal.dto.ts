import {
  IsUUID,
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateGoalDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  successCriteria!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
