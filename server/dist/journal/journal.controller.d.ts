import { JournalService } from './journal.service';
export declare class JournalController {
    private readonly journal;
    constructor(journal: JournalService);
    list(req: any, campaignId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    create(req: any, body: {
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
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getById(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(req: any, id: string, body: {
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
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
