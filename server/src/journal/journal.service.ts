import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { Prisma } from '@prisma/client';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService, private readonly realtime: RealtimeGateway) {}

  private async ensureAccess(userId: string, campaignId: string) {
    const camp = await this.prisma.campaign.findUnique({ where: { id: campaignId }, select: { ownerId: true, id: true } });
    if (!camp) throw new NotFoundException('Campaign not found');
    const isOwner = camp.ownerId === userId;
    if (isOwner) return { isOwner };
    const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId } });
    if (!isMember) throw new ForbiddenException('Not allowed');
    return { isOwner };
  }

  async list(userId: string, campaignId?: string) {
    if (!campaignId) {
      // Return only entries authored by the user when no campaign is specified
      return this.prisma.journalEntry.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
      });
    }
    await this.ensureAccess(userId, campaignId);
    return this.prisma.journalEntry.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, body: { campaignId: string; title: string; content: string; tags?: string[]; attachments?: unknown }) {
    const campAccess = await this.ensureAccess(userId, body.campaignId);
    if (!campAccess.isOwner) {
      const can = await this.prisma.campaignMember.findFirst({ where: { campaignId: body.campaignId, userId, OR: [{ role: 'DM' }, { canManageJournal: true }] } });
      if (!can) throw new ForbiddenException('Not allowed to create journal entries');
    }
    if (!body.title?.trim()) throw new BadRequestException('Title required');
    const entry = await this.prisma.journalEntry.create({
      data: {
        campaignId: body.campaignId,
        authorId: userId,
        title: body.title.trim(),
        content: body.content ?? '',
        tags: body.tags ?? [],
        attachments: (body.attachments ?? null) as Prisma.InputJsonValue,
      },
    });
    try { this.realtime.server?.in(body.campaignId).emit('journal_entry_created', { campaignId: body.campaignId, entry }); } catch {}
    return entry;
  }

  async getById(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    await this.ensureAccess(userId, entry.campaignId);
    return entry;
  }

  async update(userId: string, id: string, body: { title?: string; content?: string; tags?: string[]; attachments?: unknown }) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    const { isOwner } = await this.ensureAccess(userId, entry.campaignId);
    if (!isOwner && entry.authorId !== userId) {
      const can = await this.prisma.campaignMember.findFirst({ where: { campaignId: entry.campaignId, userId, OR: [{ role: 'DM' }, { canManageJournal: true }] } });
      if (!can) throw new ForbiddenException('Not allowed');
    }
    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? undefined,
        content: body.content ?? undefined,
        tags: body.tags ?? undefined,
        attachments: body.attachments !== undefined ? (body.attachments as Prisma.InputJsonValue) : undefined,
      },
    });
    try { this.realtime.server?.in(entry.campaignId).emit('journal_entry_updated', { campaignId: entry.campaignId, entry: updated }); } catch {}
    return updated;
  }

  async remove(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    const { isOwner } = await this.ensureAccess(userId, entry.campaignId);
    if (!isOwner && entry.authorId !== userId) {
      const can = await this.prisma.campaignMember.findFirst({ where: { campaignId: entry.campaignId, userId, OR: [{ role: 'DM' }, { canManageJournal: true }] } });
      if (!can) throw new ForbiddenException('Not allowed');
    }
    await this.prisma.journalEntry.delete({ where: { id } });
    try { this.realtime.server?.in(entry.campaignId).emit('journal_entry_deleted', { campaignId: entry.campaignId, entryId: id }); } catch {}
    return { ok: true };
  }
}
