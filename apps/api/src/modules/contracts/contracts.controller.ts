import { Controller } from '@nestjs/common';
import { ContractsService } from './contracts.service';

@Controller({ path: 'contracts', version: '1' })
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}
}
