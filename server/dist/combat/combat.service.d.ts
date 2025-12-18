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
export declare class CombatService {
    private prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    createCombat(userId: string, data: CreateCombatDto): Promise<{
        participants: {
            id: string;
            name: string;
            type: string;
            combatId: string;
            isActive: boolean;
            order: number;
            entityId: string | null;
            initiative: number;
            hp: number | null;
            maxHp: number | null;
            ac: number | null;
            conditions: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    }>;
    getCombats(userId: string, campaignId: string): Promise<({
        participants: {
            id: string;
            name: string;
            type: string;
            combatId: string;
            isActive: boolean;
            order: number;
            entityId: string | null;
            initiative: number;
            hp: number | null;
            maxHp: number | null;
            ac: number | null;
            conditions: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    })[]>;
    getCombat(userId: string, combatId: string): Promise<{
        participants: {
            id: string;
            name: string;
            type: string;
            combatId: string;
            isActive: boolean;
            order: number;
            entityId: string | null;
            initiative: number;
            hp: number | null;
            maxHp: number | null;
            ac: number | null;
            conditions: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    }>;
    deleteCombat(userId: string, combatId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    }>;
    addParticipant(userId: string, data: AddParticipantDto): Promise<{
        id: string;
        name: string;
        type: string;
        combatId: string;
        isActive: boolean;
        order: number;
        entityId: string | null;
        initiative: number;
        hp: number | null;
        maxHp: number | null;
        ac: number | null;
        conditions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateParticipant(userId: string, participantId: string, data: UpdateParticipantDto): Promise<{
        id: string;
        name: string;
        type: string;
        combatId: string;
        isActive: boolean;
        order: number;
        entityId: string | null;
        initiative: number;
        hp: number | null;
        maxHp: number | null;
        ac: number | null;
        conditions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    removeParticipant(userId: string, participantId: string): Promise<{
        id: string;
        name: string;
        type: string;
        combatId: string;
        isActive: boolean;
        order: number;
        entityId: string | null;
        initiative: number;
        hp: number | null;
        maxHp: number | null;
        ac: number | null;
        conditions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    startCombat(userId: string, combatId: string): Promise<{
        participants: {
            id: string;
            name: string;
            type: string;
            combatId: string;
            isActive: boolean;
            order: number;
            entityId: string | null;
            initiative: number;
            hp: number | null;
            maxHp: number | null;
            ac: number | null;
            conditions: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    }>;
    nextTurn(userId: string, combatId: string): Promise<{
        participants: {
            id: string;
            name: string;
            type: string;
            combatId: string;
            isActive: boolean;
            order: number;
            entityId: string | null;
            initiative: number;
            hp: number | null;
            maxHp: number | null;
            ac: number | null;
            conditions: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    }>;
    endCombat(userId: string, combatId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    }>;
}
export {};
