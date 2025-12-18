import { MonstersService } from './monsters.service';
export declare class MonstersController {
    private readonly monsters;
    constructor(monsters: MonstersService);
    list(req: any, scope?: 'user' | 'campaign', campaignId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        ownerId: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    create(req: any, body: {
        name: string;
        dataJson?: unknown;
        campaignId?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        ownerId: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getById(req: any, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        ownerId: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    update(req: any, id: string, body: {
        name?: string;
        dataJson?: unknown;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        ownerId: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
