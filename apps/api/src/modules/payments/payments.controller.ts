import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthorizePaymentDto } from './dto/authorize-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller({ path: 'payments', version: '1' })
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('authorize')
  async authorize(
    @CurrentUser('id') userId: string,
    @Body() dto: AuthorizePaymentDto,
  ) {
    return this.paymentsService.authorizePayment(userId, dto);
  }

  @Post('capture/:id')
  async capture(@Param('id') id: string) {
    return this.paymentsService.capturePayment(id);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.paymentsService.getPaymentsByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  @Post(':id/refund')
  async refund(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, dto);
  }

  @Post('companion/onboard')
  async onboard(@CurrentUser('id') userId: string) {
    return this.paymentsService.onboardCompanion(userId);
  }

  @Get('companion/earnings')
  async earnings(@CurrentUser('id') userId: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });
    if (!companion) {
      return { totalEarnings: 0, pendingPayouts: 0, completedPayouts: 0, recentPayments: [] };
    }
    return this.paymentsService.getCompanionEarnings(companion.id);
  }
}
