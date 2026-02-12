import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplates(sessionType?: string) {
    const where: any = { isActive: true };

    if (sessionType) {
      where.sessionType = sessionType;
    }

    return this.prisma.contractTemplate.findMany({ where });
  }

  async getTemplateById(id: string) {
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Contract template not found');
    }

    return template;
  }

  async create(userId: string, dto: CreateContractDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    const existingContract = await this.prisma.contract.findUnique({
      where: { sessionId: dto.sessionId },
    });

    if (existingContract) {
      throw new ConflictException('A contract already exists for this session');
    }

    let mode: string = dto.mode ?? 'MODERATE';
    let rules = dto.rules ?? [];

    if (dto.templateId) {
      const template = await this.prisma.contractTemplate.findUnique({
        where: { id: dto.templateId },
      });

      if (!template) {
        throw new NotFoundException('Contract template not found');
      }

      if (!dto.rules || dto.rules.length === 0) {
        rules = template.rules as any[];
      }

      if (!dto.mode) {
        mode = template.mode;
      }
    }

    return this.prisma.contract.create({
      data: {
        sessionId: dto.sessionId,
        templateId: dto.templateId ?? null,
        mode: mode as any,
        rules,
      },
    });
  }

  async findById(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async findBySessionId(sessionId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { sessionId },
      include: { session: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found for this session');
    }

    return contract;
  }

  async accept(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        session: {
          include: {
            companion: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isSessionUser = contract.session.userId === userId;
    const isCompanion = contract.session.companion?.userId === userId;

    if (!isSessionUser && !isCompanion) {
      throw new ForbiddenException('You are not a participant of this session');
    }

    const updateData: any = {};

    if (isSessionUser) {
      updateData.acceptedByUser = true;
    }

    if (isCompanion) {
      updateData.acceptedByCompanion = true;
    }

    const acceptedByUser = isSessionUser ? true : contract.acceptedByUser;
    const acceptedByCompanion = isCompanion ? true : contract.acceptedByCompanion;

    if (acceptedByUser && acceptedByCompanion) {
      updateData.acceptedAt = new Date();
    }

    return this.prisma.contract.update({
      where: { id: contractId },
      data: updateData,
    });
  }
}
