import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionGateway } from './session.gateway';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionGateway],
  exports: [SessionsService],
})
export class SessionsModule {}
