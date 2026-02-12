import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    const existingGoal = await this.prisma.goal.findUnique({
      where: { sessionId: dto.sessionId },
    });

    if (existingGoal) {
      throw new ConflictException('A goal already exists for this session');
    }

    return this.prisma.goal.create({
      data: {
        sessionId: dto.sessionId,
        title: dto.title,
        description: dto.description,
        successCriteria: dto.successCriteria,
        keywords: dto.keywords ?? [],
      },
    });
  }

  async findBySessionId(sessionId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { sessionId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async update(goalId: string, userId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { session: true },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.session.userId !== userId) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(dto.isAchieved !== undefined && { isAchieved: dto.isAchieved }),
        ...(dto.achievementNote !== undefined && { achievementNote: dto.achievementNote }),
      },
    });
  }
}
