import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CompanionsService } from './companions.service';
import { RegisterCompanionDto } from './dto/register-companion.dto';
import { UpdateCompanionDto } from './dto/update-companion.dto';
import { SearchCompanionsDto } from './dto/search-companions.dto';
import { ToggleOnlineDto } from './dto/toggle-online.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller({ path: 'companions', version: '1' })
export class CompanionsController {
  constructor(private readonly companionsService: CompanionsService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async register(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterCompanionDto,
  ) {
    return this.companionsService.register(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANION')
  async getOwnProfile(@CurrentUser('id') userId: string) {
    return this.companionsService.getOwnProfile(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANION')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCompanionDto,
  ) {
    return this.companionsService.updateProfile(userId, dto);
  }

  @Patch('me/online')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANION')
  async toggleOnline(
    @CurrentUser('id') userId: string,
    @Body() dto: ToggleOnlineDto,
  ) {
    return this.companionsService.toggleOnline(userId, dto.isOnline);
  }

  @Get()
  async searchCompanions(@Query() dto: SearchCompanionsDto) {
    return this.companionsService.searchCompanions(dto);
  }

  @Get(':id')
  async getPublicProfile(@Param('id') companionId: string) {
    return this.companionsService.getPublicProfile(companionId);
  }
}
