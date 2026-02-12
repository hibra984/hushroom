import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'contracts', version: '1' })
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('templates')
  async getTemplates(@Query('sessionType') sessionType?: string) {
    return this.contractsService.getTemplates(sessionType);
  }

  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string) {
    return this.contractsService.getTemplateById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(userId, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.contractsService.findById(id);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async accept(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.accept(id, userId);
  }
}
