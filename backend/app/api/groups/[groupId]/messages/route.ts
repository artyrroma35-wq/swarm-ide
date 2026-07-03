import { db } from '@/src/db/client';
import { getRuntime } from '@/src/runtime/agent-runtime';
import { eventBus } from '@/src/runtime/event-bus';
import { getBillionContext } from '@/src/memory/true-billion-context';

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const messages = await db.listMessages(params.groupId);
  return Response.json({ messages });
}

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const body = await req.json().catch(() => null) as any;
  const content = body?.content?.trim();
  const senderId = body?.senderId?.trim();
  if (!content || !senderId) return Response.json({ error: 'Нет содержимого или отправителя' }, { status: 400 });

  const members = await db.listGroupMemberIds(groupId);
  if (!members.includes(senderId)) return Response.json({ error: 'Отправитель не участник группы' }, { status: 403 });

  const msgId = db.id();
  const group = await db.getGroup(groupId);
  const wsId = group?.workspaceId ?? '';

  const message = await db.createMessage({
    id: msgId, workspaceId: wsId, groupId, senderId,
    contentType: body?.contentType ?? 'text',
    content, sendTime: new Date().toISOString(),
  });

  eventBus.emit(`workspace:${wsId}`, { event: 'new_message', data: { groupId, message } });

  // ====== 🧠 СОХРАНЯЕМ В TRUE 1 BILLION CONTEXT (БЕЗ СЖАТИЯ!) ======
  const bc = getBillionContext();
  const sender = await db.getAgent(senderId);
  const isHuman = sender?.role === 'human';

  await bc.remember(content, {
    agentId: senderId,
    workspaceId: wsId,
    conversationId: groupId,
    importance: isHuman ? 0.8 : 0.5,
    toolsUsed: body.toolsUsed,
    turnNumber: body.turnNumber,
  }).catch(() => {});

  // Запускаем агентов
  const runtime = getRuntime();
  runtime.wakeAgentsForGroup(groupId, senderId).catch(() => {});

  return Response.json(message, { status: 201 });
}
