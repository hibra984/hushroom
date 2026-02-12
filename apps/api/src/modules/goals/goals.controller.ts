import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'goals', version: '1' })
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateGoalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.goalsService.create(userId, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findBySessionId(@Param('id') sessionId: string) {
    return this.goalsService.findBySessionId(sessionId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') goalId: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.goalsService.update(goalId, userId, dto);
  }
}
