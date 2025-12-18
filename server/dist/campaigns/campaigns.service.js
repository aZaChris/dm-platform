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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
function generateToken(length = 32) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++)
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}
let CampaignsService = class CampaignsService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async listForUser(userId) {
        return this.prisma.campaign.findMany({
            where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(userId, name) {
        const campaign = await this.prisma.campaign.create({
            data: {
                name,
                ownerId: userId,
                members: {
                    create: {
                        userId: userId,
                        role: 'DM'
                    }
                }
            },
        });
        this.realtime.server?.in(campaign.id).emit('campaign_created', {
            campaignId: campaign.id,
            name: campaign.name,
            ownerId: campaign.ownerId
        });
        return campaign;
    }
    async getById(userId, campaignId) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const isOwner = campaign.ownerId === userId;
        const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId } });
        if (!isOwner && !isMember)
            throw new common_1.ForbiddenException('Not allowed');
        return campaign;
    }
    async remove(userId, campaignId) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.ownerId !== userId)
            throw new common_1.ForbiddenException('Only owner can delete');
        this.realtime.server?.in(campaignId).emit('campaign_deleted', {
            campaignId: campaignId,
            name: campaign.name
        });
        await this.prisma.campaign.delete({ where: { id: campaignId } });
        return { ok: true };
    }
    async listMembers(userId, campaignId) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const isOwner = campaign.ownerId === userId;
        const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId } });
        if (!isOwner && !isMember)
            throw new common_1.ForbiddenException('Not allowed');
        return this.prisma.campaignMember.findMany({
            where: { campaignId },
            include: { user: { select: { id: true, email: true, name: true } } },
            orderBy: { role: 'asc' },
        });
    }
    async addMemberAsDM(ownerId, campaignId, email, role) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only owner can add');
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (role === 'DM' && user.id !== ownerId)
            throw new common_1.BadRequestException('Only owner can be DM');
        try {
            const created = await this.prisma.campaignMember.create({
                data: { campaignId, userId: user.id, role },
            });
            this.realtime.server?.in(campaignId).emit('campaign_members_updated', { campaignId });
            return created;
        }
        catch (e) {
            throw new common_1.BadRequestException('User is already a member');
        }
    }
    async removeMemberAsDM(ownerId, campaignId, memberUserId) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only owner can remove');
        if (memberUserId === ownerId)
            throw new common_1.BadRequestException('Owner cannot be removed');
        const membership = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: memberUserId } });
        if (!membership)
            throw new common_1.NotFoundException('Membership not found');
        await this.prisma.campaignMember.delete({ where: { id: membership.id } });
        this.realtime.server?.in(campaignId).emit('campaign_member_removed', { campaignId, userId: memberUserId });
        return { ok: true };
    }
    async createInvitation(ownerId, campaignId, email, role = 'PLAYER') {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only owner can invite');
        if (role === 'DM')
            throw new common_1.BadRequestException('DM invites are not allowed');
        const token = generateToken(48);
        const inv = await this.prisma.invitation.create({
            data: { campaignId, email, token, role },
        });
        this.realtime.server?.in(campaignId).emit('campaign_invitation_created', { campaignId, token: inv.token });
        this.realtime.server?.in(campaignId).emit('campaign_invitation_updated', { campaignId });
        return inv;
    }
    async listInvitations(ownerId, campaignId) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only owner can list');
        return this.prisma.invitation.findMany({ where: { campaignId }, orderBy: { createdAt: 'desc' } });
    }
    async acceptInvitation(userId, token) {
        const invite = await this.prisma.invitation.findUnique({ where: { token } });
        if (!invite)
            throw new common_1.NotFoundException('Invitation not found');
        if (invite.expiresAt && invite.expiresAt < new Date())
            throw new common_1.BadRequestException('Invitation expired');
        const already = await this.prisma.campaignMember.findFirst({ where: { campaignId: invite.campaignId, userId } });
        if (already)
            throw new common_1.BadRequestException('Already a member');
        await this.prisma.$transaction([
            this.prisma.campaignMember.create({ data: { campaignId: invite.campaignId, userId, role: invite.role } }),
            this.prisma.invitation.update({ where: { token }, data: { acceptedBy: userId, acceptedAt: new Date() } }),
        ]);
        this.realtime.server?.in(invite.campaignId).emit('campaign_members_updated', { campaignId: invite.campaignId });
        return { ok: true };
    }
    async updateMemberRole(ownerId, campaignId, memberUserId, role) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only owner can update roles');
        if (memberUserId === ownerId)
            throw new common_1.BadRequestException('Owner role cannot change');
        const membership = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: memberUserId } });
        if (!membership)
            throw new common_1.NotFoundException('Membership not found');
        const updated = await this.prisma.campaignMember.update({ where: { id: membership.id }, data: { role } });
        this.realtime.server?.in(campaignId).emit('campaign_member_role_updated', { campaignId, userId: memberUserId, role });
        return updated;
    }
    async revokeInvitation(ownerId, campaignId, token) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        if (campaign.ownerId !== ownerId)
            throw new common_1.ForbiddenException('Only owner can revoke');
        const inv = await this.prisma.invitation.findFirst({ where: { campaignId, token } });
        if (!inv)
            throw new common_1.NotFoundException('Invitation not found');
        await this.prisma.invitation.delete({ where: { token } });
        this.realtime.server?.in(campaignId).emit('campaign_invitation_updated', { campaignId });
        return { ok: true };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, realtime_gateway_1.RealtimeGateway])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map