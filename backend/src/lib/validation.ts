/**
 * 🛡️ Валидация API запросов через Zod
 */
import { z, ZodSchema } from 'zod';

export const WorkspaceCreateSchema = z.object({
  name: z.string().min(1).max(100).optional().default('Моя рабочая область'),
});

export const AgentCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  creatorId: z.string().uuid(),
  role: z.string().min(1).max(50),
  guidance: z.string().max(2000).optional(),
});

export const MessageSendSchema = z.object({
  content: z.string().min(1).max(50000),
  senderId: z.string().uuid(),
  contentType: z.string().max(20).optional().default('text'),
});

export const SandboxExecSchema = z.object({
  action: z.literal('exec'),
  command: z.string().min(1).max(10000),
  sudo: z.boolean().optional().default(false),
  background: z.boolean().optional().default(false),
  timeout: z.number().max(600000).optional().default(60000),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  action: z.enum(['search', 'fetch']).optional().default('search'),
});

export const MemorySearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().max(100).optional().default(20),
});

export function validate<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') };
}
