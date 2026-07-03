import { eventBus } from '../runtime/event-bus';

interface CollabUser { userId: string; username: string; cursor?: { line: number; col: number }; isTyping: boolean; lastActive: string; }

export class CollabManager {
  private sessions = new Map<string, Map<string, CollabUser>>();

  join(workspaceId: string, user: CollabUser): void {
    if (!this.sessions.has(workspaceId)) this.sessions.set(workspaceId, new Map());
    this.sessions.get(workspaceId)!.set(user.userId, user);
    this.broadcast(workspaceId, { event: 'user_joined', data: user });
  }

  leave(workspaceId: string, userId: string): void {
    this.sessions.get(workspaceId)?.delete(userId);
    this.broadcast(workspaceId, { event: 'user_left', data: { userId } });
  }

  updateCursor(workspaceId: string, userId: string, cursor: { line: number; col: number }): void {
    const user = this.sessions.get(workspaceId)?.get(userId);
    if (user) { user.cursor = cursor; user.lastActive = new Date().toISOString(); }
  }

  setTyping(workspaceId: string, userId: string, typing: boolean): void {
    const user = this.sessions.get(workspaceId)?.get(userId);
    if (user) { user.isTyping = typing; this.broadcast(workspaceId, { event: 'typing', data: { userId, typing } }); }
  }

  getUsers(workspaceId: string): CollabUser[] {
    return [...(this.sessions.get(workspaceId)?.values() || [])];
  }

  private broadcast(workspaceId: string, data: any): void {
    eventBus.emit(`workspace:${workspaceId}`, data);
  }
}
export const collabManager = new CollabManager();
