import { Module } from '@nestjs/common';
import { AdminController, AbuseReportsController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AdminController, AbuseReportsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
