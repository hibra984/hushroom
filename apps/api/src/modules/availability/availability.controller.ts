import { Controller } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller({ path: 'availability', version: '1' })
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}
}
