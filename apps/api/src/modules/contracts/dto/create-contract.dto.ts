import { IsUUID, IsOptional, IsIn, IsArray } from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsIn(['STRICT', 'MODERATE', 'FLEXIBLE'])
  mode?: string;

  @IsOptional()
  @IsArray()
  rules?: any[];
}
