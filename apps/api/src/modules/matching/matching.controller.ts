import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { MatchingService } from './matching.service';
import { FindMatchDto } from './dto/find-match.dto';
import { SelectCompanionDto } from './dto/select-companion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'matching', version: '1' })
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('find')
  async find(
    @CurrentUser('id') userId: string,
    @Body() dto: FindMatchDto,
  ) {
    return this.matchingService.findMatches(userId, dto);
  }

  @Get('results/:sessionId')
  async getResults(@Param('sessionId') sessionId: string) {
    return this.matchingService.getResults(sessionId);
  }

  @Post('select')
  async select(
    @CurrentUser('id') userId: string,
    @Body() dto: SelectCompanionDto,
  ) {
    return this.matchingService.selectCompanion(userId, dto);
  }
}
