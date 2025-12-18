import { CombatService } from './combat.service';
export declare class CombatController {
    private combatService;
    constructor(combatService: CombatService);
    createCombat(req: any, data: {
        campaignId: string;
        name: string;
    }): Promise<{
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
    getCombats(req: any, campaignId: string): Promise<({
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
    getCombat(req: any, id: string): Promise<{
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
    deleteCombat(req: any, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        currentTurn: number;
        round: number;
        isActive: boolean;
    }>;
    addParticipant(req: any, combatId: string, data: {
        name: string;
        type: 'character' | 'monster' | 'npc';
        entityId?: string;
        initiative: number;
        hp?: number;
        maxHp?: number;
        ac?: number;
    }): Promise<{
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
    updateParticipant(req: any, participantId: string, data: {
        hp?: number;
        maxHp?: number;
        ac?: number;
        conditions?: any[];
        isActive?: boolean;
    }): Promise<{
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
    removeParticipant(req: any, participantId: string): Promise<{
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
    startCombat(req: any, id: string): Promise<{
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
    nextTurn(req: any, id: string): Promise<{
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
    endCombat(req: any, id: string): Promise<{
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
