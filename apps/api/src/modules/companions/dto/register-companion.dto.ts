import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsPositive,
} from 'class-validator';
import { ContractMode } from '@hushroom/shared-types';

export class RegisterCompanionDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsNumber()
  @IsPositive()
  baseRate!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertiseTags?: string[];

  @IsOptional()
  @IsEnum(ContractMode)
  driftEnforcement?: ContractMode;
}
