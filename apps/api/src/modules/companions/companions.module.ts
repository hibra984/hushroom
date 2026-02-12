import { Module } from '@nestjs/common';

import { CompanionsController } from './companions.controller';
import { CompanionsService } from './companions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CompanionsController],
  providers: [CompanionsService],
  exports: [CompanionsService],
})
export class CompanionsModule {}
