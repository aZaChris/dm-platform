"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let JournalService = class JournalService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async ensureAccess(userId, campaignId) {
        const camp = await this.prisma.campaign.findUnique({ where: { id: campaignId }, select: { ownerId: true, id: true } });
        if (!camp)
            throw new common_1.NotFoundException('Campaign not found');
        const isOwner = camp.ownerId === userId;
        if (isOwner)
            return { isOwner };
        const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId } });
        if (!isMember)
            throw new common_1.ForbiddenException('Not allowed');
        return { isOwner };
    }
    async list(userId, campaignId) {
        if (!campaignId) {
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
    async create(userId, body) {
        const campAccess = await this.ensureAccess(userId, body.campaignId);
        if (!campAccess.isOwner) {
            const can = await this.prisma.campaignMember.findFirst({ where: { campaignId: body.campaignId, userId, OR: [{ role: 'DM' }, { canManageJournal: true }] } });
            if (!can)
                throw new common_1.ForbiddenException('Not allowed to create journal entries');
        }
        if (!body.title?.trim())
            throw new common_1.BadRequestException('Title required');
        const entry = await this.prisma.journalEntry.create({
            data: {
                campaignId: body.campaignId,
                authorId: userId,
                title: body.title.trim(),
                content: body.content ?? '',
                tags: body.tags ?? [],
                attachments: (body.attachments ?? null),
            },
        });
        try {
            this.realtime.server?.in(body.campaignId).emit('journal_entry_created', { campaignId: body.campaignId, entry });
        }
        catch { }
        return entry;
    }
    async getById(userId, id) {
        const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Entry not found');
        await this.ensureAccess(userId, entry.campaignId);
        return entry;
    }
    async update(userId, id, body) {
        const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Entry not found');
        const { isOwner } = await this.ensureAccess(userId, entry.campaignId);
        if (!isOwner && entry.authorId !== userId) {
            const can = await this.prisma.campaignMember.findFirst({ where: { campaignId: entry.campaignId, userId, OR: [{ role: 'DM' }, { canManageJournal: true }] } });
            if (!can)
                throw new common_1.ForbiddenException('Not allowed');
        }
        const updated = await this.prisma.journalEntry.update({
            where: { id },
            data: {
                title: body.title?.trim() ?? undefined,
                content: body.content ?? undefined,
                tags: body.tags ?? undefined,
                attachments: body.attachments !== undefined ? body.attachments : undefined,
            },
        });
        try {
            this.realtime.server?.in(entry.campaignId).emit('journal_entry_updated', { campaignId: entry.campaignId, entry: updated });
        }
        catch { }
        return updated;
    }
    async remove(userId, id) {
        const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Entry not found');
        const { isOwner } = await this.ensureAccess(userId, entry.campaignId);
        if (!isOwner && entry.authorId !== userId) {
            const can = await this.prisma.campaignMember.findFirst({ where: { campaignId: entry.campaignId, userId, OR: [{ role: 'DM' }, { canManageJournal: true }] } });
            if (!can)
                throw new common_1.ForbiddenException('Not allowed');
        }
        await this.prisma.journalEntry.delete({ where: { id } });
        try {
            this.realtime.server?.in(entry.campaignId).emit('journal_entry_deleted', { campaignId: entry.campaignId, entryId: id });
        }
        catch { }
        return { ok: true };
    }
};
exports.JournalService = JournalService;
exports.JournalService = JournalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, realtime_gateway_1.RealtimeGateway])
], JournalService);
//# sourceMappingURL=journal.service.js.map