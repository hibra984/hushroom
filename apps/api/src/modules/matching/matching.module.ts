import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../common/redis/redis.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [AuthModule, RedisModule, EmailModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
