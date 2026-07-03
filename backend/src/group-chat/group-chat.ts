import { db } from '../db/client';
import { eventBus } from '../runtime/event-bus';

export interface GroupChatMessage {
  id: string; groupId: string; senderId: string; content: string;
  replyTo?: string; mentions: string[]; attachments: string[];
  sendTime: string;
}

export class GroupChatManager {
  async sendMessage(groupId: string, senderId: string, content: string, opts: { replyTo?: string; mentions?: string[]; attachments?: string[] } = {}): Promise<GroupChatMessage> {
    const msg: GroupChatMessage = {
      id: db.id(), groupId, senderId, content,
      replyTo: opts.replyTo, mentions: opts.mentions||[], attachments: opts.attachments||[],
      sendTime: new Date().toISOString(),
    };
    await db.createMessage({ id: msg.id, workspaceId: '', groupId, senderId, contentType: 'group_chat', content, sendTime: msg.sendTime });
    eventBus.emit(`group:${groupId}`, { event: 'group_message', data: msg });

    // Уведомления для @упоминаний
    for (const mention of msg.mentions) {
      eventBus.emit(`agent:${mention}`, { event: 'mentioned', data: { groupId, senderId, content: content.slice(0, 100) } });
    }
    return msg;
  }

  async createGroupChat(workspaceId: string, name: string, memberIds: string[]): Promise<string> {
    const gid = db.id();
    await db.createGroup({ id: gid, workspaceId, name, contextTokens: 0, createdAt: new Date().toISOString() });
    for (const mid of memberIds) await db.addGroupMember(gid, mid);
    eventBus.emit(`workspace:${workspaceId}`, { event: 'group_created', data: { groupId: gid, name, memberIds } });
    return gid;
  }

  formatThread(messages: GroupChatMessage[]): string {
    return messages.map(m => {
      const parts = [`[${m.senderId.slice(0,8)}] ${m.content}`];
      if (m.replyTo) parts.push(`  ↳ ответ на ${m.replyTo.slice(0,8)}`);
      if (m.mentions.length) parts.push(`  📢 @${m.mentions.join(', @')}`);
      return parts.join('\n');
    }).join('\n');
  }
}

export const groupChat = new GroupChatManager();
