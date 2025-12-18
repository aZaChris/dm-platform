import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface CreateCombatDto {
  campaignId: string;
  name: string;
}

interface AddParticipantDto {
  combatId: string;
  name: string;
  type: 'character' | 'monster' | 'npc';
  entityId?: string;
  initiative: number;
  hp?: number;
  maxHp?: number;
  ac?: number;
}

interface UpdateParticipantDto {
  hp?: number;
  maxHp?: number;
  ac?: number;
  conditions?: any[];
  isActive?: boolean;
}

@Injectable()
export class CombatService {
  constructor(
    private prisma: PrismaService,
    private readonly realtime: RealtimeGateway
  ) {}

  // CRUD per Combat
  async createCombat(userId: string, data: CreateCombatDto) {
    // Verifica che l'utente sia DM della campagna
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: data.campaignId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'DM' } } }
        ]
      }
    });

    if (!campaign) {
      throw new ForbiddenException('Non hai i permessi per creare combattimenti in questa campagna');
    }

    const combat = await this.prisma.combat.create({
      data: {
        campaignId: data.campaignId,
        name: data.name
      },
      include: {
        participants: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Emit realtime event
    this.realtime.server?.in(data.campaignId).emit('combat_created', { 
      campaignId: data.campaignId, 
      combatId: combat.id,
      name: combat.name 
    });

    return combat;
  }

  async getCombats(userId: string, campaignId: string) {
    // Verifica che l'utente sia membro della campagna
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });

    if (!campaign) {
      throw new ForbiddenException('Non hai accesso a questa campagna');
    }

    return this.prisma.combat.findMany({
      where: { campaignId },
      include: {
        participants: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCombat(userId: string, combatId: string) {
    const combat = await this.prisma.combat.findFirst({
      where: {
        id: combatId,
        campaign: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      },
      include: {
        participants: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!combat) {
      throw new NotFoundException('Combattimento non trovato');
    }

    return combat;
  }

  async deleteCombat(userId: string, combatId: string) {
    // Verifica che l'utente sia DM
    const combat = await this.prisma.combat.findFirst({
      where: {
        id: combatId,
        campaign: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'DM' } } }
        ]
        }
      }
    });

    if (!combat) {
      throw new ForbiddenException('Non hai i permessi per eliminare questo combattimento');
    }

    const deleted = await this.prisma.combat.delete({
      where: { id: combatId }
    });

    // Emit realtime event
    this.realtime.server?.in(combat.campaignId).emit('combat_deleted', { 
      campaignId: combat.campaignId, 
      combatId: combatId 
    });

    return deleted;
  }

  // Gestione partecipanti
  async addParticipant(userId: string, data: AddParticipantDto) {
    // Verifica che l'utente sia DM
    const combat = await this.prisma.combat.findFirst({
      where: {
        id: data.combatId,
        campaign: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'DM' } } }
        ]
        }
      }
    });

    if (!combat) {
      throw new ForbiddenException('Non hai i permessi per aggiungere partecipanti');
    }

    // Trova l'ordine massimo
    const maxOrder = await this.prisma.combatParticipant.aggregate({
      where: { combatId: data.combatId },
      _max: { order: true }
    });

    const newOrder = (maxOrder._max.order || 0) + 1;

    const participant = await this.prisma.combatParticipant.create({
      data: {
        combatId: data.combatId,
        name: data.name,
        type: data.type,
        entityId: data.entityId,
        initiative: data.initiative,
        hp: data.hp,
        maxHp: data.maxHp,
        ac: data.ac,
        order: newOrder
      }
    });

    // Emit realtime event
    this.realtime.server?.in(combat.campaignId).emit('combat_participant_added', { 
      campaignId: combat.campaignId, 
      combatId: data.combatId,
      participant 
    });

    return participant;
  }

  async updateParticipant(userId: string, participantId: string, data: UpdateParticipantDto) {
    // Verifica che l'utente sia DM
    const participant = await this.prisma.combatParticipant.findFirst({
      where: {
        id: participantId,
        combat: {
          campaign: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId, role: 'DM' } } }
            ]
          }
        }
      }
    });

    if (!participant) {
      throw new ForbiddenException('Non hai i permessi per modificare questo partecipante');
    }

    const updated = await this.prisma.combatParticipant.update({
      where: { id: participantId },
      data
    });
    try {
      const combat = await this.prisma.combat.findUnique({ where: { id: updated.combatId } });
      if (combat) {
        this.realtime.server?.in(combat.campaignId).emit('combat_participant_updated', {
          campaignId: combat.campaignId,
          combatId: updated.combatId,
          participant: updated,
        });
      }
    } catch (_) {}
    return updated;
  }

  async removeParticipant(userId: string, participantId: string) {
    // Verifica che l'utente sia DM
    const participant = await this.prisma.combatParticipant.findFirst({
      where: {
        id: participantId,
        combat: {
          campaign: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId, role: 'DM' } } }
            ]
          }
        }
      }
    });

    if (!participant) {
      throw new ForbiddenException('Non hai i permessi per rimuovere questo partecipante');
    }

    const removed = await this.prisma.combatParticipant.delete({
      where: { id: participantId }
    });
    try {
      const combat = await this.prisma.combat.findUnique({ where: { id: removed.combatId } });
      if (combat) {
        this.realtime.server?.in(combat.campaignId).emit('combat_participant_removed', {
          campaignId: combat.campaignId,
          combatId: removed.combatId,
          participantId: removed.id,
        });
      }
    } catch (_) {}
    return removed;
  }

  // Gestione combattimento
  async startCombat(userId: string, combatId: string) {
    // Verifica che l'utente sia DM
    const combat = await this.prisma.combat.findFirst({
      where: {
        id: combatId,
        campaign: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'DM' } } }
        ]
        }
      },
      include: { participants: true }
    });

    if (!combat) {
      throw new ForbiddenException('Non hai i permessi per avviare questo combattimento');
    }

    if (combat.participants.length === 0) {
      throw new ForbiddenException('Non ci sono partecipanti nel combattimento');
    }

    // Ordina per iniziativa (decrescente) e poi per ordine
    const sortedParticipants = combat.participants
      .sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        return a.order - b.order;
      });

    // Aggiorna l'ordine dei partecipanti
    await Promise.all(
      sortedParticipants.map((participant, index) =>
        this.prisma.combatParticipant.update({
          where: { id: participant.id },
          data: { order: index + 1 }
        })
      )
    );

    const updated = await this.prisma.combat.update({
      where: { id: combatId },
      data: {
        isActive: true,
        currentTurn: 1,
        round: 1
      },
      include: {
        participants: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Emit realtime event
    this.realtime.server?.in(combat.campaignId).emit('combat_started', { 
      campaignId: combat.campaignId, 
      combatId: combatId,
      currentTurn: 1,
      round: 1 
    });

    return updated;
  }

  async nextTurn(userId: string, combatId: string) {
    // Verifica che l'utente sia DM
    const combat = await this.prisma.combat.findFirst({
      where: {
        id: combatId,
        campaign: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId, role: 'DM' } } }
          ]
        }
      },
      include: { participants: true }
    });

    if (!combat) {
      throw new ForbiddenException('Non hai i permessi per gestire questo combattimento');
    }

    if (!combat.isActive) {
      throw new ForbiddenException('Il combattimento non è attivo');
    }

    const activeParticipants = combat.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      throw new ForbiddenException('Non ci sono partecipanti attivi');
    }

    let newTurn = combat.currentTurn + 1;
    let newRound = combat.round;

    // Se abbiamo superato l'ultimo partecipante, ricomincia dal primo e aumenta il round
    if (newTurn > activeParticipants.length) {
      newTurn = 1;
      newRound = combat.round + 1;
    }

    const updated = await this.prisma.combat.update({
      where: { id: combatId },
      data: {
        currentTurn: newTurn,
        round: newRound
      },
      include: {
        participants: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Emit realtime event
    this.realtime.server?.in(combat.campaignId).emit('combat_turn_changed', { 
      campaignId: combat.campaignId, 
      combatId: combatId,
      currentTurn: newTurn,
      round: newRound 
    });

    return updated;
  }

  async endCombat(userId: string, combatId: string) {
    // Verifica che l'utente sia DM
    const combat = await this.prisma.combat.findFirst({
      where: {
        id: combatId,
        campaign: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId, OR: [{ role: 'DM' }, { canManageCombat: true }] } } }
          ]
        }
      }
    });

    if (!combat) {
      throw new ForbiddenException('Non hai i permessi per terminare questo combattimento');
    }

    const updated = await this.prisma.combat.update({
      where: { id: combatId },
      data: {
        isActive: false,
        currentTurn: 0,
        round: 1
      }
    });

    // Emit realtime event
    this.realtime.server?.in(combat.campaignId).emit('combat_ended', { 
      campaignId: combat.campaignId, 
      combatId: combatId 
    });

    return updated;
  }
}
