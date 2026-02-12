import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AvailabilityService } from './availability.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { BlockDateDto } from './dto/block-date.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller({ path: 'availability', version: '1' })
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANION')
  async getMyAvailability(@CurrentUser('id') userId: string) {
    return this.availabilityService.getMyAvailability(userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANION')
  async setAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.availabilityService.setAvailability(userId, dto);
  }

  @Get(':companionId')
  async getCompanionAvailability(@Param('companionId') companionId: string) {
    return this.availabilityService.getCompanionAvailability(companionId);
  }

  @Post('me/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANION')
  async blockDate(
    @CurrentUser('id') userId: string,
    @Body() dto: BlockDateDto,
  ) {
    return this.availabilityService.blockDate(userId, dto);
  }

  @Delete('me/block/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANION')
  async removeBlock(
    @CurrentUser('id') userId: string,
    @Param('id') blockId: string,
  ) {
    return this.availabilityService.removeBlock(userId, blockId);
  }
}
