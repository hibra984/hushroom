import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateLanguagesDto } from './dto/update-languages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @Get('me/languages')
  async getLanguages(@CurrentUser('id') userId: string) {
    return this.usersService.getLanguages(userId);
  }

  @Put('me/languages')
  async updateLanguages(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLanguagesDto,
  ) {
    return this.usersService.updateLanguages(userId, dto.languages);
  }

  @Post('me/data-export')
  @HttpCode(HttpStatus.OK)
  async requestDataExport(@CurrentUser('id') userId: string) {
    return this.usersService.requestDataExport(userId);
  }
}
