import { Controller } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller({ path: 'sessions', version: '1' })
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}
}
