import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsInt,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { ContractMode } from '@hushroom/shared-types';

export class UpdateCompanionDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  baseRate?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertiseTags?: string[];

  @IsOptional()
  @IsEnum(ContractMode)
  driftEnforcement?: ContractMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxConcurrent?: number;
}
