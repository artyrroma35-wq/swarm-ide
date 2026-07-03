/**
 * 📡 WebRTC Signaling Server
 * Для P2P коллаборации между пользователями
 */

export class SignalingServer {
  private rooms = new Map<string, Set<{ id: string; ws: any }>>();

  join(roomId: string, clientId: string, ws: any) {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
    this.rooms.get(roomId)!.add({ id: clientId, ws });
    
    // Notify others
    for (const peer of this.rooms.get(roomId)!) {
      if (peer.id !== clientId) {
        try { peer.ws.send(JSON.stringify({ event: 'peer_joined', data: { peerId: clientId } })); } catch {}
      }
    }
  }

  leave(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      for (const peer of room) {
        if (peer.id !== clientId) {
          try { peer.ws.send(JSON.stringify({ event: 'peer_left', data: { peerId: clientId } })); } catch {}
        }
      }
      room.delete({ id: clientId, ws: null } as any);
    }
  }

  relay(roomId: string, senderId: string, targetId: string, data: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const peer of room) {
      if (peer.id === targetId) {
        try { peer.ws.send(JSON.stringify({ event: 'signal', data: { from: senderId, ...data } })); } catch {}
        break;
      }
    }
  }

  getPeers(roomId: string): string[] {
    return [...(this.rooms.get(roomId) || [])].map(p => p.id);
  }
}

declare global { var __signaling: SignalingServer | undefined; }
export function getSignaling(): SignalingServer {
  if (!globalThis.__signaling) globalThis.__signaling = new SignalingServer();
  return globalThis.__signaling;
}
