import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DriftService } from './drift.service';
import { DriftGateway } from './drift.gateway';

@Module({
  imports: [PrismaModule],
  providers: [DriftService, DriftGateway],
  exports: [DriftService, DriftGateway],
})
export class DriftModule {}
