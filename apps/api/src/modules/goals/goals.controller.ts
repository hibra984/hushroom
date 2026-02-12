import { Controller } from '@nestjs/common';
import { GoalsService } from './goals.service';

@Controller({ path: 'goals', version: '1' })
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}
}
