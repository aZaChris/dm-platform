import { CharactersService } from './characters.service';
export declare class CharactersController {
    private readonly characters;
    constructor(characters: CharactersService);
    list(req: any, campaignId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        ownerId: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    create(req: any, body: {
        campaignId: string;
        name: string;
        dataJson?: unknown;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        ownerId: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getById(req: any, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
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
        campaignId: string;
        ownerId: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
