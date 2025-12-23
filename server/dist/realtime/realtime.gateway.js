"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("./ws-jwt.guard");
let RealtimeGateway = class RealtimeGateway {
    server;
    userSockets = new Map();
    campaignUsers = new Map();
    async handleConnection(client) {
        const userId = client.handshake.auth.userId;
        if (userId) {
            this.userSockets.set(userId, client);
            console.log(`User ${userId} connected`);
        }
    }
    handleDisconnect(client) {
        const userId = client.handshake.auth.userId;
        if (userId) {
            this.userSockets.delete(userId);
            this.campaignUsers.forEach((users, campaignId) => {
                users.delete(userId);
                if (users.size === 0) {
                    this.campaignUsers.delete(campaignId);
                }
                else {
                    this.server.to(campaignId).emit('user_left', { userId });
                }
            });
            console.log(`User ${userId} disconnected`);
        }
    }
    async handleJoinCampaign(client, data) {
        const { campaignId } = data;
        const userId = client.handshake.auth.userId;
        const socketUser = client.handshake.auth.user || {};
        if (!userId) {
            return { error: 'Unauthorized' };
        }
        const user = (data.user && data.user.userId === userId)
            ? data.user
            : { userId, email: socketUser.email, name: socketUser.name };
        await client.join(campaignId);
        console.log(`User ${user.email || user.userId} joined campaign room ${campaignId}`);
        if (!this.campaignUsers.has(campaignId)) {
            this.campaignUsers.set(campaignId, new Set());
        }
        this.campaignUsers.get(campaignId).add(userId);
        client.to(campaignId).emit('user_joined', user);
        const campaignUsers = Array.from(this.campaignUsers.get(campaignId) || []);
        const userDetails = campaignUsers.map(id => {
            const socket = this.userSockets.get(id);
            return socket?.handshake.auth.user || { userId: id };
        }).filter(Boolean);
        return {
            success: true,
            users: userDetails,
            message: `Joined campaign ${campaignId}`
        };
    }
    async handleLeaveCampaign(client, data) {
        const { campaignId } = data;
        const userId = client.handshake.auth.userId;
        if (!userId) {
            return { error: 'Unauthorized' };
        }
        await client.leave(campaignId);
        const users = this.campaignUsers.get(campaignId);
        if (users) {
            users.delete(userId);
            if (users.size === 0) {
                this.campaignUsers.delete(campaignId);
            }
            else {
                client.to(campaignId).emit('user_left', { userId });
            }
        }
        return { success: true, message: `Left campaign ${campaignId}` };
    }
    async handleChatMessage(client, data) {
        const { campaignId, message, type } = data;
        const userId = client.handshake.auth.userId;
        const user = client.handshake.auth.user;
        if (!userId || !user) {
            return { error: 'Unauthorized' };
        }
        const chatData = {
            userId,
            user: { email: user.email, name: user.name },
            message,
            type,
            timestamp: new Date().toISOString(),
        };
        const room = this.server.sockets.adapter.rooms.get(campaignId);
        const roomSize = room ? room.size : 0;
        console.log(`Chat message from ${user.email} in campaign ${campaignId}, room size: ${roomSize}`);
        this.server.in(campaignId).emit('chat_message', chatData);
        return { success: true };
    }
    async handleTyping(client, data) {
        const { campaignId, isTyping } = data;
        const userId = client.handshake.auth.userId;
        const user = client.handshake.auth.user;
        if (!userId || !user) {
            return { error: 'Unauthorized' };
        }
        client.to(campaignId).emit('user_typing', {
            userId,
            user: { email: user.email, name: user.name },
            isTyping,
        });
        return { success: true };
    }
    async handleCombatUpdate(client, data) {
        const { campaignId, combatId, action, payload } = data;
        const userId = client.handshake.auth.userId;
        const user = client.handshake.auth.user;
        if (!userId || !user) {
            return { error: 'Unauthorized' };
        }
        this.server.in(campaignId).emit('combat_update', {
            combatId,
            action,
            payload,
            userId,
            user: { email: user.email, name: user.name },
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    async handleCombatTurnChange(client, data) {
        const { campaignId, combatId, currentTurn, round } = data;
        const userId = client.handshake.auth.userId;
        const user = client.handshake.auth.user;
        if (!userId || !user) {
            return { error: 'Unauthorized' };
        }
        this.server.in(campaignId).emit('combat_turn_change', {
            combatId,
            currentTurn,
            round,
            userId,
            user: { email: user.email, name: user.name },
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_campaign'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleJoinCampaign", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_campaign'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleLeaveCampaign", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleChatMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('combat_update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleCombatUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('combat_turn_change'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleCombatTurnChange", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map