import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

function generateToken(length = 32): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService, private readonly realtime: RealtimeGateway) {}

  async listForUser(userId: string) {
    return this.prisma.campaign.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, name: string) {
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
    
    // Emit realtime event for new campaign
    this.realtime.server?.in(campaign.id).emit('campaign_created', { 
      campaignId: campaign.id, 
      name: campaign.name,
      ownerId: campaign.ownerId 
    });
    
    return campaign;
  }

  async getById(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    const isOwner = campaign.ownerId === userId;
    const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId } });
    if (!isOwner && !isMember) throw new ForbiddenException('Not allowed');
    return campaign;
  }

  async remove(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== userId) throw new ForbiddenException('Only owner can delete');
    
    // Emit realtime event before deletion
    this.realtime.server?.in(campaignId).emit('campaign_deleted', { 
      campaignId: campaignId,
      name: campaign.name 
    });
    
    await this.prisma.campaign.delete({ where: { id: campaignId } });
    return { ok: true };
  }

  async listMembers(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    const isOwner = campaign.ownerId === userId;
    const isMember = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId } });
    if (!isOwner && !isMember) throw new ForbiddenException('Not allowed');
    return this.prisma.campaignMember.findMany({
      where: { campaignId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { role: 'asc' },
    });
  }

  async addMemberAsDM(ownerId: string, campaignId: string, email: string, role: 'DM' | 'PLAYER') {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== ownerId) throw new ForbiddenException('Only owner can add');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if (role === 'DM' && user.id !== ownerId) throw new BadRequestException('Only owner can be DM');
    try {
      const created = await this.prisma.campaignMember.create({
        data: { campaignId, userId: user.id, role },
      });
      this.realtime.server?.in(campaignId).emit('campaign_members_updated', { campaignId });
      return created;
    } catch (e) {
      throw new BadRequestException('User is already a member');
    }
  }

  async removeMemberAsDM(ownerId: string, campaignId: string, memberUserId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== ownerId) throw new ForbiddenException('Only owner can remove');
    if (memberUserId === ownerId) throw new BadRequestException('Owner cannot be removed');
    const membership = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: memberUserId } });
    if (!membership) throw new NotFoundException('Membership not found');
    await this.prisma.campaignMember.delete({ where: { id: membership.id } });
    this.realtime.server?.in(campaignId).emit('campaign_member_removed', { campaignId, userId: memberUserId });
    return { ok: true };
  }

  async createInvitation(ownerId: string, campaignId: string, email?: string, role: 'PLAYER' | 'DM' = 'PLAYER') {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== ownerId) {
      const member = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: ownerId, role: 'DM' } });
      if (!member) throw new ForbiddenException('Not allowed to invite');
    }
    if (role === 'DM') throw new BadRequestException('DM invites are not allowed');
    const token = generateToken(48);
    const inv = await this.prisma.invitation.create({
      data: { campaignId, email, token, role },
    });
    this.realtime.server?.in(campaignId).emit('campaign_invitation_created', { campaignId, token: inv.token });
    this.realtime.server?.in(campaignId).emit('campaign_invitation_updated', { campaignId });
    return inv;
  }

  async listInvitations(ownerId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== ownerId) {
      const member = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: ownerId, role: 'DM' } });
      if (!member) throw new ForbiddenException('Not allowed to list invitations');
    }
    return this.prisma.invitation.findMany({ where: { campaignId }, orderBy: { createdAt: 'desc' } });
  }

  async acceptInvitation(userId: string, token: string) {
    const invite = await this.prisma.invitation.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.expiresAt && invite.expiresAt < new Date()) throw new BadRequestException('Invitation expired');
    const already = await this.prisma.campaignMember.findFirst({ where: { campaignId: invite.campaignId, userId } });
    if (already) throw new BadRequestException('Already a member');
    await this.prisma.$transaction([
      this.prisma.campaignMember.create({ data: { campaignId: invite.campaignId, userId, role: invite.role } }),
      this.prisma.invitation.update({ where: { token }, data: { acceptedBy: userId, acceptedAt: new Date() } }),
    ]);
    this.realtime.server?.in(invite.campaignId).emit('campaign_members_updated', { campaignId: invite.campaignId });
    return { ok: true };
  }

  async updateMemberRole(ownerId: string, campaignId: string, memberUserId: string, role: 'DM' | 'PLAYER') {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== ownerId) throw new ForbiddenException('Only owner can update roles');
    if (memberUserId === ownerId) throw new BadRequestException('Owner role cannot change');
    const membership = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: memberUserId } });
    if (!membership) throw new NotFoundException('Membership not found');
    const updated = await this.prisma.campaignMember.update({ where: { id: membership.id }, data: { role } });
    this.realtime.server?.in(campaignId).emit('campaign_member_role_updated', { campaignId, userId: memberUserId, role });
    return updated;
  }

  async revokeInvitation(ownerId: string, campaignId: string, token: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== ownerId) {
      const member = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: ownerId, role: 'DM' } });
      if (!member) throw new ForbiddenException('Not allowed to revoke');
    }
    const inv = await this.prisma.invitation.findFirst({ where: { campaignId, token } });
    if (!inv) throw new NotFoundException('Invitation not found');
    await this.prisma.invitation.delete({ where: { token } });
    this.realtime.server?.in(campaignId).emit('campaign_invitation_updated', { campaignId });
    return { ok: true };
  }

  async getMemberPermissions(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId === userId) {
      return { role: 'OWNER', canInvite: true, canManageJournal: true, canManageCombat: true, canManageCharacters: true, canManageMonsters: true };
    }
    const membership = await this.prisma.campaignMember.findFirst({
      where: { campaignId, userId },
      select: {
        role: true,
        canInvite: true,
        canManageJournal: true,
        canManageCombat: true,
        canManageCharacters: true,
        canManageMonsters: true,
      },
    });
    if (!membership) throw new ForbiddenException('Not a member');
    return {
      role: membership.role,
      canInvite: membership.canInvite || membership.role === 'DM',
      canManageJournal: membership.canManageJournal || membership.role === 'DM',
      canManageCombat: membership.canManageCombat || membership.role === 'DM',
      canManageCharacters: membership.canManageCharacters || membership.role === 'DM',
      canManageMonsters: membership.canManageMonsters || membership.role === 'DM',
    };
  }

  async updateMemberPermissions(
    ownerId: string,
    campaignId: string,
    memberUserId: string,
    perms: { canInvite?: boolean; canManageJournal?: boolean; canManageCombat?: boolean; canManageCharacters?: boolean; canManageMonsters?: boolean }
  ) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== ownerId) throw new ForbiddenException('Only owner can update permissions');
    if (memberUserId === ownerId) throw new BadRequestException('Owner permissions are implicit');
    const membership = await this.prisma.campaignMember.findFirst({ where: { campaignId, userId: memberUserId }, select: { id: true, role: true } });
    if (!membership) throw new NotFoundException('Membership not found');
    const updated = await this.prisma.campaignMember.update({
      where: { id: membership.id },
      data: {
        canInvite: perms.canInvite ?? undefined,
        canManageJournal: perms.canManageJournal ?? undefined,
        canManageCombat: perms.canManageCombat ?? undefined,
        canManageCharacters: perms.canManageCharacters ?? undefined,
        canManageMonsters: perms.canManageMonsters ?? undefined,
      },
    });
    this.realtime.server?.in(campaignId).emit('campaign_member_permissions_updated', { campaignId, userId: memberUserId });
    return updated;
  }
}
