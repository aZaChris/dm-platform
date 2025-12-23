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
exports.CombatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let CombatService = class CombatService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async createCombat(userId, data) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per creare combattimenti in questa campagna');
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
        this.realtime.server?.in(data.campaignId).emit('combat_created', {
            campaignId: data.campaignId,
            combatId: combat.id,
            name: combat.name
        });
        return combat;
    }
    async getCombats(userId, campaignId) {
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
            throw new common_1.ForbiddenException('Non hai accesso a questa campagna');
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
    async getCombat(userId, combatId) {
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
            throw new common_1.NotFoundException('Combattimento non trovato');
        }
        return combat;
    }
    async deleteCombat(userId, combatId) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per eliminare questo combattimento');
        }
        const deleted = await this.prisma.combat.delete({
            where: { id: combatId }
        });
        this.realtime.server?.in(combat.campaignId).emit('combat_deleted', {
            campaignId: combat.campaignId,
            combatId: combatId
        });
        return deleted;
    }
    async addParticipant(userId, data) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per aggiungere partecipanti');
        }
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
        this.realtime.server?.in(combat.campaignId).emit('combat_participant_added', {
            campaignId: combat.campaignId,
            combatId: data.combatId,
            participant
        });
        return participant;
    }
    async updateParticipant(userId, participantId, data) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per modificare questo partecipante');
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
        }
        catch (_) { }
        return updated;
    }
    async removeParticipant(userId, participantId) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per rimuovere questo partecipante');
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
        }
        catch (_) { }
        return removed;
    }
    async startCombat(userId, combatId) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per avviare questo combattimento');
        }
        if (combat.participants.length === 0) {
            throw new common_1.ForbiddenException('Non ci sono partecipanti nel combattimento');
        }
        const sortedParticipants = combat.participants
            .sort((a, b) => {
            if (b.initiative !== a.initiative) {
                return b.initiative - a.initiative;
            }
            return a.order - b.order;
        });
        await Promise.all(sortedParticipants.map((participant, index) => this.prisma.combatParticipant.update({
            where: { id: participant.id },
            data: { order: index + 1 }
        })));
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
        this.realtime.server?.in(combat.campaignId).emit('combat_started', {
            campaignId: combat.campaignId,
            combatId: combatId,
            currentTurn: 1,
            round: 1
        });
        return updated;
    }
    async nextTurn(userId, combatId) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per gestire questo combattimento');
        }
        if (!combat.isActive) {
            throw new common_1.ForbiddenException('Il combattimento non è attivo');
        }
        const activeParticipants = combat.participants.filter(p => p.isActive);
        if (activeParticipants.length === 0) {
            throw new common_1.ForbiddenException('Non ci sono partecipanti attivi');
        }
        let newTurn = combat.currentTurn + 1;
        let newRound = combat.round;
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
        this.realtime.server?.in(combat.campaignId).emit('combat_turn_changed', {
            campaignId: combat.campaignId,
            combatId: combatId,
            currentTurn: newTurn,
            round: newRound
        });
        return updated;
    }
    async endCombat(userId, combatId) {
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
            throw new common_1.ForbiddenException('Non hai i permessi per terminare questo combattimento');
        }
        const updated = await this.prisma.combat.update({
            where: { id: combatId },
            data: {
                isActive: false,
                currentTurn: 0,
                round: 1
            }
        });
        this.realtime.server?.in(combat.campaignId).emit('combat_ended', {
            campaignId: combat.campaignId,
            combatId: combatId
        });
        return updated;
    }
};
exports.CombatService = CombatService;
exports.CombatService = CombatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], CombatService);
//# sourceMappingURL=combat.service.js.map