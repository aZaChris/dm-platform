import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class MonstersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, opts: { scope?: 'user' | 'campaign'; campaignId?: string }) {
    if (opts.scope === 'campaign') {
      if (!opts.campaignId) throw new BadRequestException('campaignId required');
      const camp = await this.prisma.campaign.findUnique({ where: { id: opts.campaignId }, select: { ownerId: true } });
      if (!camp) throw new NotFoundException('Campaign not found');
      const isOwner = camp.ownerId === userId;
      if (!isOwner) {
        const member = await this.prisma.campaignMember.findFirst({ where: { campaignId: opts.campaignId, userId }, select: { canManageMonsters: true } });
        if (!member) throw new ForbiddenException('Not allowed');
      }
      return this.prisma.monster.findMany({ where: { campaignId: opts.campaignId }, orderBy: { createdAt: 'desc' } });
    }
    return this.prisma.monster.findMany({ where: { ownerId: userId, campaignId: null }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, body: { name: string; dataJson?: unknown; campaignId?: string }) {
    if (!body.name?.trim()) throw new BadRequestException('Name is required');
    let campaignId: string | null = null;
    if (body.campaignId) {
      const camp = await this.prisma.campaign.findUnique({ where: { id: body.campaignId }, select: { ownerId: true } });
      if (!camp) throw new NotFoundException('Campaign not found');
      const isOwner = camp.ownerId === userId;
      if (!isOwner) {
        const member = await this.prisma.campaignMember.findFirst({ where: { campaignId: body.campaignId, userId }, select: { canManageMonsters: true } });
        if (!member?.canManageMonsters) throw new ForbiddenException('Not allowed');
      }
      campaignId = body.campaignId;
    }
    return this.prisma.monster.create({
      data: {
        name: body.name.trim(),
        dataJson: (body.dataJson ?? {}) as Prisma.InputJsonValue,
        ownerId: userId,
        campaignId,
      },
    });
  }

  async getById(userId: string, id: string) {
    const monster = await this.prisma.monster.findUnique({ where: { id } });
    if (!monster) throw new NotFoundException('Monster not found');
    if (monster.campaignId) {
      const camp = await this.prisma.campaign.findUnique({ where: { id: monster.campaignId }, select: { ownerId: true } });
      const isOwner = camp?.ownerId === userId;
      const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId: monster.campaignId, userId } });
      if (!isOwner && !isMember) throw new ForbiddenException('Not allowed');
    } else if (monster.ownerId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    return monster;
  }

  async update(userId: string, id: string, body: { name?: string; dataJson?: unknown }) {
    const monster = await this.prisma.monster.findUnique({ where: { id } });
    if (!monster) throw new NotFoundException('Monster not found');
    if (monster.campaignId) {
      const camp = await this.prisma.campaign.findUnique({ where: { id: monster.campaignId }, select: { ownerId: true } });
      const isOwner = camp?.ownerId === userId;
      if (!isOwner) {
        const member = await this.prisma.campaignMember.findFirst({ where: { campaignId: monster.campaignId, userId }, select: { canManageMonsters: true } });
        if (!member?.canManageMonsters) throw new ForbiddenException('Only DM or permitted members can edit campaign monsters');
      }
    } else if (monster.ownerId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    return this.prisma.monster.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? undefined,
        dataJson: body.dataJson !== undefined ? (body.dataJson as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const monster = await this.prisma.monster.findUnique({ where: { id } });
    if (!monster) throw new NotFoundException('Monster not found');
    if (monster.campaignId) {
      const camp = await this.prisma.campaign.findUnique({ where: { id: monster.campaignId }, select: { ownerId: true } });
      const isOwner = camp?.ownerId === userId;
      if (!isOwner) {
        const member = await this.prisma.campaignMember.findFirst({ where: { campaignId: monster.campaignId, userId }, select: { canManageMonsters: true } });
        if (!member?.canManageMonsters) throw new ForbiddenException('Only DM or permitted members can delete campaign monsters');
      }
    } else if (monster.ownerId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    await this.prisma.monster.delete({ where: { id } });
    return { ok: true };
  }
}


