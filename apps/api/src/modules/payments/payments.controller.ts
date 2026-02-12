import { Controller } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
}
