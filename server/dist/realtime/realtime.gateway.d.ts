import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface ChatMessage {
    campaignId: string;
    message: string;
    type: 'all' | 'dm' | 'party';
}
interface UserPresence {
    userId: string;
    email: string;
    name?: string;
}
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private userSockets;
    private campaignUsers;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinCampaign(client: Socket, data: {
        campaignId: string;
        user: UserPresence;
    }): Promise<{
        error: string;
        success?: undefined;
        users?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        users: any[];
        message: string;
        error?: undefined;
    }>;
    handleLeaveCampaign(client: Socket, data: {
        campaignId: string;
    }): Promise<{
        error: string;
        success?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
    handleChatMessage(client: Socket, data: ChatMessage): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleTyping(client: Socket, data: {
        campaignId: string;
        isTyping: boolean;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleCombatUpdate(client: Socket, data: {
        campaignId: string;
        combatId: string;
        action: string;
        payload?: any;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleCombatTurnChange(client: Socket, data: {
        campaignId: string;
        combatId: string;
        currentTurn: number;
        round: number;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
}
export {};
