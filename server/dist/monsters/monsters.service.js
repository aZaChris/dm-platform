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
exports.MonstersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MonstersService = class MonstersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId, opts) {
        if (opts.scope === 'campaign') {
            if (!opts.campaignId)
                throw new common_1.BadRequestException('campaignId required');
            const camp = await this.prisma.campaign.findUnique({ where: { id: opts.campaignId }, select: { ownerId: true } });
            if (!camp)
                throw new common_1.NotFoundException('Campaign not found');
            const isOwner = camp.ownerId === userId;
            const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId: opts.campaignId, userId } });
            if (!isOwner && !isMember)
                throw new common_1.ForbiddenException('Not allowed');
            return this.prisma.monster.findMany({ where: { campaignId: opts.campaignId }, orderBy: { createdAt: 'desc' } });
        }
        return this.prisma.monster.findMany({ where: { ownerId: userId, campaignId: null }, orderBy: { createdAt: 'desc' } });
    }
    async create(userId, body) {
        if (!body.name?.trim())
            throw new common_1.BadRequestException('Name is required');
        let campaignId = null;
        if (body.campaignId) {
            const camp = await this.prisma.campaign.findUnique({ where: { id: body.campaignId }, select: { ownerId: true } });
            if (!camp)
                throw new common_1.NotFoundException('Campaign not found');
            const isOwner = camp.ownerId === userId;
            const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId: body.campaignId, userId } });
            if (!isOwner && !isMember)
                throw new common_1.ForbiddenException('Not allowed');
            campaignId = body.campaignId;
        }
        return this.prisma.monster.create({
            data: {
                name: body.name.trim(),
                dataJson: (body.dataJson ?? {}),
                ownerId: userId,
                campaignId,
            },
        });
    }
    async getById(userId, id) {
        const monster = await this.prisma.monster.findUnique({ where: { id } });
        if (!monster)
            throw new common_1.NotFoundException('Monster not found');
        if (monster.campaignId) {
            const camp = await this.prisma.campaign.findUnique({ where: { id: monster.campaignId }, select: { ownerId: true } });
            const isOwner = camp?.ownerId === userId;
            const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId: monster.campaignId, userId } });
            if (!isOwner && !isMember)
                throw new common_1.ForbiddenException('Not allowed');
        }
        else if (monster.ownerId !== userId) {
            throw new common_1.ForbiddenException('Not allowed');
        }
        return monster;
    }
    async update(userId, id, body) {
        const monster = await this.prisma.monster.findUnique({ where: { id } });
        if (!monster)
            throw new common_1.NotFoundException('Monster not found');
        if (monster.campaignId) {
            const camp = await this.prisma.campaign.findUnique({ where: { id: monster.campaignId }, select: { ownerId: true } });
            const isOwner = camp?.ownerId === userId;
            if (!isOwner)
                throw new common_1.ForbiddenException('Only DM can edit campaign monsters');
        }
        else if (monster.ownerId !== userId) {
            throw new common_1.ForbiddenException('Not allowed');
        }
        return this.prisma.monster.update({
            where: { id },
            data: {
                name: body.name?.trim() ?? undefined,
                dataJson: body.dataJson !== undefined ? body.dataJson : undefined,
            },
        });
    }
    async remove(userId, id) {
        const monster = await this.prisma.monster.findUnique({ where: { id } });
        if (!monster)
            throw new common_1.NotFoundException('Monster not found');
        if (monster.campaignId) {
            const camp = await this.prisma.campaign.findUnique({ where: { id: monster.campaignId }, select: { ownerId: true } });
            const isOwner = camp?.ownerId === userId;
            if (!isOwner)
                throw new common_1.ForbiddenException('Only DM can delete campaign monsters');
        }
        else if (monster.ownerId !== userId) {
            throw new common_1.ForbiddenException('Not allowed');
        }
        await this.prisma.monster.delete({ where: { id } });
        return { ok: true };
    }
};
exports.MonstersService = MonstersService;
exports.MonstersService = MonstersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MonstersService);
//# sourceMappingURL=monsters.service.js.map