import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';

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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();
  private campaignUsers = new Map<string, Set<string>>();

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.userSockets.set(userId, client);
      console.log(`User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.userSockets.delete(userId);
      // Remove from all campaign rooms
      this.campaignUsers.forEach((users, campaignId) => {
        users.delete(userId);
        if (users.size === 0) {
          this.campaignUsers.delete(campaignId);
        } else {
          this.server.to(campaignId).emit('user_left', { userId });
        }
      });
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('join_campaign')
  async handleJoinCampaign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string; user: UserPresence }
  ) {
    const { campaignId, user } = data;
    const userId = client.handshake.auth.userId;

    if (!userId || userId !== user.userId) {
      return { error: 'Unauthorized' };
    }

    // Join the campaign room
    await client.join(campaignId);
    console.log(`User ${user.email} joined campaign room ${campaignId}`);
    
    // Track user in campaign
    if (!this.campaignUsers.has(campaignId)) {
      this.campaignUsers.set(campaignId, new Set());
    }
    this.campaignUsers.get(campaignId)!.add(userId);

    // Notify others in the campaign
    client.to(campaignId).emit('user_joined', user);

    // Send current users in campaign
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

  @SubscribeMessage('leave_campaign')
  async handleLeaveCampaign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string }
  ) {
    const { campaignId } = data;
    const userId = client.handshake.auth.userId;

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await client.leave(campaignId);
    
    // Remove from tracking
    const users = this.campaignUsers.get(campaignId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        this.campaignUsers.delete(campaignId);
      } else {
        client.to(campaignId).emit('user_left', { userId });
      }
    }

    return { success: true, message: `Left campaign ${campaignId}` };
  }

  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessage
  ) {
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

    // Debug: check room members
    const room = this.server.sockets.adapter.rooms.get(campaignId);
    const roomSize = room ? room.size : 0;
    console.log(`Chat message from ${user.email} in campaign ${campaignId}, room size: ${roomSize}`);

    // Broadcast to campaign room (including sender)
    this.server.in(campaignId).emit('chat_message', chatData);

    return { success: true };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string; isTyping: boolean }
  ) {
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

  // Combat Tracker Events
  @SubscribeMessage('combat_update')
  async handleCombatUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string; combatId: string; action: string; payload?: any }
  ) {
    const { campaignId, combatId, action, payload } = data;
    const userId = client.handshake.auth.userId;
    const user = client.handshake.auth.user;

    if (!userId || !user) {
      return { error: 'Unauthorized' };
    }

    // Broadcast combat update to campaign room
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

  @SubscribeMessage('combat_turn_change')
  async handleCombatTurnChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string; combatId: string; currentTurn: number; round: number }
  ) {
    const { campaignId, combatId, currentTurn, round } = data;
    const userId = client.handshake.auth.userId;
    const user = client.handshake.auth.user;

    if (!userId || !user) {
      return { error: 'Unauthorized' };
    }

    // Broadcast turn change to campaign room
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
}
