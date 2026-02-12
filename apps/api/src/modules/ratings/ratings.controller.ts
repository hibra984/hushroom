import { Controller } from '@nestjs/common';
import { RatingsService } from './ratings.service';

@Controller({ path: 'ratings', version: '1' })
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}
}
