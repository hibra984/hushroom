import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { BlockDateDto } from './dto/block-date.dto';

const DAY_OF_WEEK_MAP: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyAvailability(userId: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    return this.prisma.availability.findMany({
      where: { companionId: companion.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    await this.prisma.availability.deleteMany({
      where: {
        companionId: companion.id,
        isBlocked: false,
      },
    });

    await this.prisma.availability.createMany({
      data: dto.slots.map((slot) => ({
        companionId: companion.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone: slot.timezone ?? 'UTC',
        isRecurring: slot.isRecurring ?? true,
      })),
    });

    return this.prisma.availability.findMany({
      where: { companionId: companion.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getCompanionAvailability(companionId: string) {
    return this.prisma.availability.findMany({
      where: {
        companionId,
        isBlocked: false,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async blockDate(userId: string, dto: BlockDateDto) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    const date = new Date(dto.date);
    const dayOfWeek = DAY_OF_WEEK_MAP[date.getUTCDay()];

    return this.prisma.availability.create({
      data: {
        companionId: companion.id,
        dayOfWeek: dayOfWeek as any,
        startTime: dto.startTime ?? '00:00',
        endTime: dto.endTime ?? '23:59',
        isBlocked: true,
        isRecurring: false,
        specificDate: date,
      },
    });
  }

  async removeBlock(userId: string, blockId: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    const block = await this.prisma.availability.findFirst({
      where: {
        id: blockId,
        companionId: companion.id,
        isBlocked: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    return this.prisma.availability.delete({
      where: { id: blockId },
    });
  }
}
