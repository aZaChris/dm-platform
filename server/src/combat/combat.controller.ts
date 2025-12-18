import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CombatService } from './combat.service';

@Controller('combat')
@UseGuards(JwtAuthGuard)
export class CombatController {
  constructor(private combatService: CombatService) {}

  // CRUD per Combat
  @Post()
  async createCombat(@Request() req, @Body() data: { campaignId: string; name: string }) {
    return this.combatService.createCombat(req.user.sub, data);
  }

  @Get('campaign/:campaignId')
  async getCombats(@Request() req, @Param('campaignId') campaignId: string) {
    return this.combatService.getCombats(req.user.sub, campaignId);
  }

  @Get(':id')
  async getCombat(@Request() req, @Param('id') id: string) {
    return this.combatService.getCombat(req.user.sub, id);
  }

  @Delete(':id')
  async deleteCombat(@Request() req, @Param('id') id: string) {
    return this.combatService.deleteCombat(req.user.sub, id);
  }

  // Gestione partecipanti
  @Post(':combatId/participants')
  async addParticipant(
    @Request() req,
    @Param('combatId') combatId: string,
    @Body() data: {
      name: string;
      type: 'character' | 'monster' | 'npc';
      entityId?: string;
      initiative: number;
      hp?: number;
      maxHp?: number;
      ac?: number;
    }
  ) {
    return this.combatService.addParticipant(req.user.sub, {
      combatId,
      ...data
    });
  }

  @Put('participants/:participantId')
  async updateParticipant(
    @Request() req,
    @Param('participantId') participantId: string,
    @Body() data: {
      hp?: number;
      maxHp?: number;
      ac?: number;
      conditions?: any[];
      isActive?: boolean;
    }
  ) {
    return this.combatService.updateParticipant(req.user.sub, participantId, data);
  }

  @Delete('participants/:participantId')
  async removeParticipant(@Request() req, @Param('participantId') participantId: string) {
    return this.combatService.removeParticipant(req.user.sub, participantId);
  }

  // Gestione combattimento
  @Post(':id/start')
  async startCombat(@Request() req, @Param('id') id: string) {
    return this.combatService.startCombat(req.user.sub, id);
  }

  @Post(':id/next-turn')
  async nextTurn(@Request() req, @Param('id') id: string) {
    return this.combatService.nextTurn(req.user.sub, id);
  }

  @Post(':id/end')
  async endCombat(@Request() req, @Param('id') id: string) {
    return this.combatService.endCombat(req.user.sub, id);
  }
}
