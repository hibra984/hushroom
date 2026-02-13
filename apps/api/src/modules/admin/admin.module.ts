import { Module } from '@nestjs/common';
import { AdminController, AbuseReportsController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AbuseReportsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
