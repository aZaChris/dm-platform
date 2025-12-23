import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
export declare class CampaignsService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    listForUser(userId: string): Promise<({
        members: {
            user: {
                id: string;
                email: string;
                name: string | null;
            };
            userId: string;
            role: import("@prisma/client").$Enums.Role;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    })[]>;
    create(userId: string, name: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    getById(userId: string, campaignId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    remove(userId: string, campaignId: string): Promise<{
        ok: boolean;
    }>;
    listMembers(userId: string, campaignId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    } & {
        id: string;
        userId: string;
        campaignId: string;
        role: import("@prisma/client").$Enums.Role;
        canInvite: boolean;
        canManageJournal: boolean;
        canManageCombat: boolean;
        canManageCharacters: boolean;
        canManageMonsters: boolean;
    })[]>;
    addMemberAsDM(ownerId: string, campaignId: string, email: string, role: 'DM' | 'PLAYER'): Promise<{
        id: string;
        userId: string;
        campaignId: string;
        role: import("@prisma/client").$Enums.Role;
        canInvite: boolean;
        canManageJournal: boolean;
        canManageCombat: boolean;
        canManageCharacters: boolean;
        canManageMonsters: boolean;
    }>;
    removeMemberAsDM(ownerId: string, campaignId: string, memberUserId: string): Promise<{
        ok: boolean;
    }>;
    createInvitation(ownerId: string, campaignId: string, email?: string, role?: 'PLAYER' | 'DM'): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        token: string;
        campaignId: string;
        role: import("@prisma/client").$Enums.Role;
        acceptedBy: string | null;
        acceptedAt: Date | null;
        expiresAt: Date | null;
    }>;
    listInvitations(ownerId: string, campaignId: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        token: string;
        campaignId: string;
        role: import("@prisma/client").$Enums.Role;
        acceptedBy: string | null;
        acceptedAt: Date | null;
        expiresAt: Date | null;
    }[]>;
    acceptInvitation(userId: string, token: string): Promise<{
        ok: boolean;
    }>;
    updateMemberRole(ownerId: string, campaignId: string, memberUserId: string, role: 'DM' | 'PLAYER'): Promise<{
        id: string;
        userId: string;
        campaignId: string;
        role: import("@prisma/client").$Enums.Role;
        canInvite: boolean;
        canManageJournal: boolean;
        canManageCombat: boolean;
        canManageCharacters: boolean;
        canManageMonsters: boolean;
    }>;
    revokeInvitation(ownerId: string, campaignId: string, token: string): Promise<{
        ok: boolean;
    }>;
    getMemberPermissions(userId: string, campaignId: string): Promise<{
        role: string;
        canInvite: boolean;
        canManageJournal: boolean;
        canManageCombat: boolean;
        canManageCharacters: boolean;
        canManageMonsters: boolean;
    }>;
    updateMemberPermissions(ownerId: string, campaignId: string, memberUserId: string, perms: {
        canInvite?: boolean;
        canManageJournal?: boolean;
        canManageCombat?: boolean;
        canManageCharacters?: boolean;
        canManageMonsters?: boolean;
    }): Promise<{
        id: string;
        userId: string;
        campaignId: string;
        role: import("@prisma/client").$Enums.Role;
        canInvite: boolean;
        canManageJournal: boolean;
        canManageCombat: boolean;
        canManageCharacters: boolean;
        canManageMonsters: boolean;
    }>;
}
