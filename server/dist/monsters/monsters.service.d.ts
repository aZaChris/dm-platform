import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
export declare class MonstersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string, opts: {
        scope?: 'user' | 'campaign';
        campaignId?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        ownerId: string;
        dataJson: Prisma.JsonValue;
    }[]>;
    create(userId: string, body: {
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
        dataJson: Prisma.JsonValue;
    }>;
    getById(userId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        ownerId: string;
        dataJson: Prisma.JsonValue;
    }>;
    update(userId: string, id: string, body: {
        name?: string;
        dataJson?: unknown;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        ownerId: string;
        dataJson: Prisma.JsonValue;
    }>;
    remove(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
