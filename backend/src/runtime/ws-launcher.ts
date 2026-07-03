/**
 * ⚡ WebSocket — запуск и интеграция с Next.js
 */
import http from 'http';
import { getWSManager } from './websocket';

let initialized = false;

export function initWebSocket(server: http.Server) {
  if (initialized) return;
  const wsm = getWSManager();
  wsm.init(server);
  initialized = true;
  console.log('⚡ WebSocket server initialized');

  // Forward events from EventBus to WebSocket
  const { eventBus } = require('./event-bus');
  // Intercept eventBus.emit to also push to WS
  const originalEmit = eventBus.emit.bind(eventBus);
  eventBus.emit = (event: string, data: unknown) => {
    originalEmit(event, data);
    wsm.broadcast('*', { event, data });
    // Also broadcast to workspace-specific channel
    if (typeof data === 'object' && data && 'workspaceId' in (data as any)) {
      wsm.broadcast(`workspace:${(data as any).workspaceId}`, { event, data });
    }
  };
}

export function getWSStats() {
  return getWSManager().getStats();
}
