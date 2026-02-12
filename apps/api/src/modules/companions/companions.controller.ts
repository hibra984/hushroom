import { Controller } from '@nestjs/common';
import { CompanionsService } from './companions.service';

@Controller({ path: 'companions', version: '1' })
export class CompanionsController {
  constructor(private readonly companionsService: CompanionsService) {}
}
