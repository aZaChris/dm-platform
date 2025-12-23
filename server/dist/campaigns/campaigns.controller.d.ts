import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaigns;
    constructor(campaigns: CampaignsService);
    list(req: any): Promise<({
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
    create(req: any, body: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    getById(req: any, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
    listMembers(req: any, id: string): Promise<({
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
    getPermissions(req: any, id: string): Promise<{
        role: string;
        canInvite: boolean;
        canManageJournal: boolean;
        canManageCombat: boolean;
        canManageCharacters: boolean;
        canManageMonsters: boolean;
    }>;
    addMember(req: any, id: string, body: {
        email: string;
        role?: 'DM' | 'PLAYER';
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
    removeMember(req: any, id: string, userId: string): Promise<{
        ok: boolean;
    }>;
    updateMemberRole(req: any, id: string, userId: string, body: {
        role: 'DM' | 'PLAYER';
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
    updateMemberPermissions(req: any, id: string, userId: string, body: {
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
    createInvite(req: any, id: string, body: {
        email?: string;
        role?: 'PLAYER' | 'DM';
    }): Promise<{
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
    listInvites(req: any, id: string): Promise<{
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
    revokeInvite(req: any, id: string, token: string): Promise<{
        ok: boolean;
    }>;
    accept(req: any, token: string): Promise<{
        ok: boolean;
    }>;
}
