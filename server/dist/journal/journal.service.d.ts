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
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(userId: string, body: {
        campaignId: string;
        title: string;
        content: string;
        tags?: string[];
        attachments?: unknown;
    }): Promise<{
        id: string;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getById(userId: string, id: string): Promise<{
        id: string;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(userId: string, id: string, body: {
        title?: string;
        content?: string;
        tags?: string[];
        attachments?: unknown;
    }): Promise<{
        id: string;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
