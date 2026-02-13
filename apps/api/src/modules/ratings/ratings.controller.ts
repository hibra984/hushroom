import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'ratings', version: '1' })
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  async createRating(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.createRating(userId, dto);
  }

  @Get('session/:sessionId')
  async getRatingsBySession(@Param('sessionId') sessionId: string) {
    return this.ratingsService.getRatingsBySession(sessionId);
  }

  @Get('companion/:companionId')
  async getCompanionRatings(
    @Param('companionId') companionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ratingsService.getCompanionRatings(
      companionId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('me')
  async getMyRatings(@CurrentUser('sub') userId: string) {
    return this.ratingsService.getMyRatings(userId);
  }
}
