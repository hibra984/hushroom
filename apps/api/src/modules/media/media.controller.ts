import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'media', version: '1' })
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Create a LiveKit room for a session.
   * POST /v1/media/rooms/:sessionId
   */
  @Post('rooms/:sessionId')
  async createRoom(@Param('sessionId') sessionId: string) {
    return this.mediaService.createRoom(sessionId);
  }

  /**
   * Get a participant token for the session's LiveKit room.
   * GET /v1/media/token/:sessionId
   */
  @Get('token/:sessionId')
  async getSessionToken(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mediaService.getSessionToken(sessionId, userId);
  }

  /**
   * Close / clean up the LiveKit room for a session.
   * DELETE /v1/media/rooms/:sessionId
   */
  @Delete('rooms/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async closeRoom(@Param('sessionId') sessionId: string) {
    await this.mediaService.closeRoom(sessionId);
  }
}
