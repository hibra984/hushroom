import { Controller } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/register - Phase 2
  // POST /api/v1/auth/login - Phase 2
  // POST /api/v1/auth/refresh - Phase 2
  // POST /api/v1/auth/logout - Phase 2
  // POST /api/v1/auth/verify-email - Phase 2
  // POST /api/v1/auth/forgot-password - Phase 2
  // POST /api/v1/auth/reset-password - Phase 2
  // POST /api/v1/auth/verify-age - Phase 2
}
