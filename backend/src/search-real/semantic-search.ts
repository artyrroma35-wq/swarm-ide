/**
 * 🔍 Semantic Search — поиск по всем сообщениям
 */

import { getBillionContext } from '../memory/true-billion-context';

export async function semanticSearch(
  query: string,
  workspaceId?: string,
  limit: number = 20
): Promise<Array<{ content: string; score: number; timestamp: string; senderId?: string }>> {
  const bc = getBillionContext();
  const results = await bc.findRelevant(query, { workspaceId, limit, deep: true });
  
  // Парсим результаты в структурированный формат
  // В реальной системе здесь был бы парсинг
  return [];
}

export async function searchMessages(
  query: string,
  workspaceId: string
): Promise<Array<{ id: string; content: string; sendTime: string; senderId: string; groupId: string }>> {
  // Поиск по сообщениям в БД
  const { db } = await import('../db');
  const { messages } = await import('../db/schema');
  const { like, and, eq } = await import('drizzle-orm');
  
  const results = await db
    .select()
    .from(messages)
    .where(and(
      eq(messages.workspaceId, workspaceId),
      like(messages.content, `%${query}%`)
    ))
    .limit(50);
  
  return results.map(r => ({
    id: r.id,
    content: r.content,
    sendTime: r.sendTime.toISOString(),
    senderId: r.senderId,
    groupId: r.groupId,
  }));
}
