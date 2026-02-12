import { Controller } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller({ path: 'matching', version: '1' })
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}
}
