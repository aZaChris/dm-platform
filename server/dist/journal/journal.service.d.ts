import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { Prisma } from '@prisma/client';
export declare class JournalService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    private ensureAccess;
    list(userId: string, campaignId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
    }[]>;
    create(userId: string, body: {
        campaignId: string;
        title: string;
        content: string;
        tags?: string[];
        attachments?: unknown;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
    }>;
    getById(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
    }>;
    update(userId: string, id: string, body: {
        title?: string;
        content?: string;
        tags?: string[];
        attachments?: unknown;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
    }>;
    remove(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
