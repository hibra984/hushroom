import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('db')
  async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'database' };
    } catch {
      return { status: 'error', service: 'database' };
    }
  }

  @Get('redis')
  async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'ok', service: 'redis' };
    } catch {
      return { status: 'error', service: 'redis' };
    }
  }
}
