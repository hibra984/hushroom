import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'sessions', version: '1' })
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.create(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
  ) {
    return this.sessionsService.findByUser(userId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Post(':id/ready')
  async markReady(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.transitionStatus(id, userId, 'READY');
  }

  @Post(':id/start')
  async start(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.transitionStatus(id, userId, 'IN_PROGRESS');
  }

  @Post(':id/pause')
  async pause(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.transitionStatus(id, userId, 'PAUSED');
  }

  @Post(':id/resume')
  async resume(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.transitionStatus(id, userId, 'IN_PROGRESS');
  }

  @Post(':id/end')
  async end(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.transitionStatus(id, userId, 'COMPLETED');
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CancelSessionDto,
  ) {
    return this.sessionsService.transitionStatus(id, userId, 'CANCELLED', {
      cancellationReason: dto.reason,
    });
  }
}
