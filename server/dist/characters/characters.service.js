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
exports.CharactersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CharactersService = class CharactersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async isCampaignOwner(userId, campaignId) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId }, select: { ownerId: true } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return campaign.ownerId === userId;
    }
    async list(userId, campaignId) {
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
    async create(userId, campaignId, name, dataJson) {
        await this.isCampaignOwner(userId, campaignId).catch(async (e) => {
            const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
            if (!campaign)
                throw e;
            const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId } });
            if (!isMember && campaign.ownerId !== userId)
                throw new common_1.ForbiddenException('Not allowed');
        });
        if (!name || !name.trim())
            throw new common_1.BadRequestException('Name is required');
        return this.prisma.character.create({
            data: { campaignId, ownerId: userId, name: name.trim(), dataJson: (dataJson ?? {}) },
        });
    }
    async getById(userId, id) {
        const character = await this.prisma.character.findUnique({ where: { id } });
        if (!character)
            throw new common_1.NotFoundException('Character not found');
        const isDm = await this.isCampaignOwner(userId, character.campaignId);
        if (character.ownerId !== userId && !isDm)
            throw new common_1.ForbiddenException('Not allowed');
        return character;
    }
    async update(userId, id, updates) {
        const character = await this.prisma.character.findUnique({ where: { id } });
        if (!character)
            throw new common_1.NotFoundException('Character not found');
        const isDm = await this.isCampaignOwner(userId, character.campaignId);
        if (character.ownerId !== userId && !isDm)
            throw new common_1.ForbiddenException('Not allowed');
        return this.prisma.character.update({
            where: { id },
            data: {
                name: updates.name?.trim() ?? undefined,
                dataJson: updates.dataJson !== undefined ? updates.dataJson : undefined,
            },
        });
    }
    async remove(userId, id) {
        const character = await this.prisma.character.findUnique({ where: { id } });
        if (!character)
            throw new common_1.NotFoundException('Character not found');
        const isDm = await this.isCampaignOwner(userId, character.campaignId);
        if (character.ownerId !== userId && !isDm)
            throw new common_1.ForbiddenException('Not allowed');
        await this.prisma.character.delete({ where: { id } });
        return { ok: true };
    }
};
exports.CharactersService = CharactersService;
exports.CharactersService = CharactersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CharactersService);
//# sourceMappingURL=characters.service.js.map