import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompanionsModule } from './modules/companions/companions.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MatchingModule } from './modules/matching/matching.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { MediaModule } from './modules/media/media.module';
import { DriftModule } from './modules/drift/drift.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CompanionsModule,
    GoalsModule,
    ContractsModule,
    SessionsModule,
    MatchingModule,
    PaymentsModule,
    RatingsModule,
    AvailabilityModule,
    MediaModule,
    DriftModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
