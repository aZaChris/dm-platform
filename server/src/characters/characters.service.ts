import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  private async isCampaignOwner(userId: string, campaignId: string): Promise<boolean> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId }, select: { ownerId: true } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign.ownerId === userId;
  }

  async list(userId: string, campaignId?: string) {
    // If no campaignId provided, return only user's own characters
    if (!campaignId) {
      return this.prisma.character.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
      });
    }
    const isDm = await this.isCampaignOwner(userId, campaignId);
    return this.prisma.character.findMany({
      where: isDm ? { campaignId } : { campaignId, ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, campaignId: string, name: string, dataJson: unknown) {
    // Ensure campaign exists; throws if not
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== userId) {
      const member = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId }, select: { canManageCharacters: true } });
      if (!member?.canManageCharacters) throw new ForbiddenException('Not allowed');
    }
    if (!name || !name.trim()) throw new BadRequestException('Name is required');
    return this.prisma.character.create({
      data: { campaignId, ownerId: userId, name: name.trim(), dataJson: (dataJson ?? {}) as Prisma.InputJsonValue },
    });
  }

  async getById(userId: string, id: string) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');
    if (character.ownerId !== userId) {
      const campaign = await this.prisma.campaign.findUnique({ where: { id: character.campaignId }, select: { ownerId: true } });
      const isOwner = campaign?.ownerId === userId;
      if (!isOwner) {
        const member = await this.prisma.campaignMember.findFirst({ where: { campaignId: character.campaignId, userId }, select: { canManageCharacters: true } });
        if (!member?.canManageCharacters) throw new ForbiddenException('Not allowed');
      }
    }
    return character;
  }

  async update(userId: string, id: string, updates: { name?: string; dataJson?: unknown }) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');
    if (character.ownerId !== userId) {
      const campaign = await this.prisma.campaign.findUnique({ where: { id: character.campaignId }, select: { ownerId: true } });
      const isOwner = campaign?.ownerId === userId;
      if (!isOwner) {
        const member = await this.prisma.campaignMember.findFirst({ where: { campaignId: character.campaignId, userId }, select: { canManageCharacters: true } });
        if (!member?.canManageCharacters) throw new ForbiddenException('Not allowed');
      }
    }
    return this.prisma.character.update({
      where: { id },
      data: {
        name: updates.name?.trim() ?? undefined,
        dataJson: updates.dataJson !== undefined ? (updates.dataJson as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');
    if (character.ownerId !== userId) {
      const campaign = await this.prisma.campaign.findUnique({ where: { id: character.campaignId }, select: { ownerId: true } });
      const isOwner = campaign?.ownerId === userId;
      if (!isOwner) {
        const member = await this.prisma.campaignMember.findFirst({ where: { campaignId: character.campaignId, userId }, select: { canManageCharacters: true } });
        if (!member?.canManageCharacters) throw new ForbiddenException('Not allowed');
      }
    }
    await this.prisma.character.delete({ where: { id } });
    return { ok: true };
  }
}
