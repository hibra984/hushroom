import { IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsIn(['TECHNICAL_FAILURE', 'COMPANION_NO_SHOW', 'ADMIN_OVERRIDE'])
  reason?: string;
}
