import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AuthorizePaymentDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
