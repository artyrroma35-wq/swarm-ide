/**
 * ⚡ WebSocket сервер для двусторонней связи
 * 
 * Заменяет SSE на полноценный двусторонний канал.
 * Агенты могут получать команды в реальном времени.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyAuthToken } from '../lib/auth';

interface WSClient {
  ws: WebSocket;
  userId?: string;
  workspaceId?: string;
  agentId?: string;
  subscribed: Set<string>;
}

class WSManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<WebSocket, WSClient>();

  init(server: any) {
    if (this.wss) return;
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '/', 'http://localhost');
      const token = url.searchParams.get('token') || '';
      const payload = token ? verifyAuthToken(token) : null;
      
      const client: WSClient = {
        ws,
        userId: payload?.userId,
        workspaceId: url.searchParams.get('workspaceId') || undefined,
        agentId: url.searchParams.get('agentId') || undefined,
        subscribed: new Set(['*']),
      };
      
      this.clients.set(ws, client);
      
      // Send connected event
      this.send(ws, { event: 'connected', data: { userId: client.userId, workspaceId: client.workspaceId } });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          this.handleMessage(client, msg);
        } catch {}
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(client: WSClient, msg: any) {
    switch (msg.type) {
      case 'subscribe':
        if (msg.channel) client.subscribed.add(msg.channel);
        this.send(client.ws, { event: 'subscribed', data: { channel: msg.channel } });
        break;
        
      case 'unsubscribe':
        if (msg.channel) client.subscribed.delete(msg.channel);
        break;
        
      case 'ping':
        this.send(client.ws, { event: 'pong' });
        break;
        
      case 'message':
        // Forward message to agents
        this.broadcast(`workspace:${client.workspaceId}`, {
          event: 'user_message',
          data: { content: msg.content, senderId: client.userId }
        });
        break;
        
      case 'agent:command':
        this.broadcast(`agent:${msg.agentId}`, {
          event: 'command',
          data: { command: msg.command, args: msg.args }
        });
        break;
    }
  }

  send(ws: WebSocket, data: any) {
    try {
      ws.send(JSON.stringify(data));
    } catch {}
  }

  broadcast(channel: string, data: any) {
    const msg = JSON.stringify(data);
    for (const client of this.clients.values()) {
      if (client.subscribed.has(channel) || client.subscribed.has('*')) {
        try { client.ws.send(msg); } catch {}
      }
    }
  }

  emit(workspaceId: string, event: string, data: any) {
    this.broadcast(`workspace:${workspaceId}`, { event, data });
    this.broadcast('*', { event, data });
  }

  getStats() {
    return {
      connections: this.clients.size,
      channels: [...new Set([...this.clients.values()].flatMap(c => [...c.subscribed]))],
    };
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

declare global { var __wsManager: WSManager | undefined; }
export function getWSManager(): WSManager {
  if (!globalThis.__wsManager) globalThis.__wsManager = new WSManager();
  return globalThis.__wsManager;
}
