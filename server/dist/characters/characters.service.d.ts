import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
export declare class CharactersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private isCampaignOwner;
    list(userId: string, campaignId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        ownerId: string;
        dataJson: Prisma.JsonValue;
    }[]>;
    create(userId: string, campaignId: string, name: string, dataJson: unknown): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        ownerId: string;
        dataJson: Prisma.JsonValue;
    }>;
    getById(userId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        ownerId: string;
        dataJson: Prisma.JsonValue;
    }>;
    update(userId: string, id: string, updates: {
        name?: string;
        dataJson?: unknown;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        ownerId: string;
        dataJson: Prisma.JsonValue;
    }>;
    remove(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
