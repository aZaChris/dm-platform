import { Body, Controller, Delete, Get, Param, Post, UseGuards, Req, Put } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  async list(@Req() req: any) {
    return this.campaigns.listForUser(req.user.userId);
  }

  @Post()
  async create(@Req() req: any, @Body() body: { name: string }) {
    return this.campaigns.create(req.user.userId, body.name);
  }

  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.campaigns.getById(req.user.userId, id);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.campaigns.remove(req.user.userId, id);
  }

  @Get(':id/members')
  async listMembers(@Req() req: any, @Param('id') id: string) {
    return this.campaigns.listMembers(req.user.userId, id);
  }

  @Get(':id/permissions')
  async getPermissions(@Req() req: any, @Param('id') id: string) {
    return this.campaigns.getMemberPermissions(req.user.userId, id);
  }

  @Post(':id/members')
  async addMember(@Req() req: any, @Param('id') id: string, @Body() body: { email: string; role?: 'DM' | 'PLAYER' }) {
    return this.campaigns.addMemberAsDM(req.user.userId, id, body.email, body.role ?? 'PLAYER');
  }

  @Delete(':id/members/:userId')
  async removeMember(@Req() req: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.campaigns.removeMemberAsDM(req.user.userId, id, userId);
  }

  @Put(':id/members/:userId/role')
  async updateMemberRole(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: 'DM' | 'PLAYER' }
  ) {
    return this.campaigns.updateMemberRole(req.user.userId, id, userId, body.role);
  }

  @Put(':id/members/:userId/permissions')
  async updateMemberPermissions(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { canInvite?: boolean; canManageJournal?: boolean; canManageCombat?: boolean; canManageCharacters?: boolean; canManageMonsters?: boolean }
  ) {
    return this.campaigns.updateMemberPermissions(req.user.userId, id, userId, body);
  }

  // Invitations
  @Post(':id/invitations')
  async createInvite(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { email?: string; role?: 'PLAYER' | 'DM' }
  ) {
    return this.campaigns.createInvitation(req.user.userId, id, body.email, body.role ?? 'PLAYER');
  }

  @Get(':id/invitations')
  async listInvites(@Req() req: any, @Param('id') id: string) {
    return this.campaigns.listInvitations(req.user.userId, id);
  }

  @Delete(':id/invitations/:token')
  async revokeInvite(@Req() req: any, @Param('id') id: string, @Param('token') token: string) {
    return this.campaigns.revokeInvitation(req.user.userId, id, token);
  }

  @Post('invitations/accept/:token')
  async accept(@Req() req: any, @Param('token') token: string) {
    return this.campaigns.acceptInvitation(req.user.userId, token);
  }
}
