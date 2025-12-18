import { JournalService } from './journal.service';
export declare class JournalController {
    private readonly journal;
    constructor(journal: JournalService);
    list(req: any, campaignId: string): Promise<{
        id: string;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(req: any, body: {
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
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getById(req: any, id: string): Promise<{
        id: string;
        campaignId: string;
        authorId: string;
        title: string;
        content: string;
        tags: string[];
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(req: any, id: string, body: {
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
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
