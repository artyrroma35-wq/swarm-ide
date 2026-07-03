import { pgTable, uuid, text, timestamp, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  settings: text('settings').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  role: text('role').notNull(),
  parentId: uuid('parent_id'),
  llmHistory: text('llm_history').notNull().default('[]'),
  systemPrompt: text('system_prompt').notNull().default(''),
  model: text('model').notNull().default(''),
  status: text('status').notNull().default('idle'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: text('name'),
  contextTokens: integer('context_tokens').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groupMembers = pgTable('group_members', {
  groupId: uuid('group_id').notNull().references(() => groups.id),
  userId: uuid('user_id').notNull(),
  lastReadMessageId: uuid('last_read_message_id'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.groupId, t.userId] }) }));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  groupId: uuid('group_id').notNull().references(() => groups.id),
  senderId: uuid('sender_id').notNull(),
  contentType: text('content_type').notNull().default('text'),
  content: text('content').notNull(),
  reasoningContent: text('reasoning_content'),
  toolCalls: text('tool_calls'),
  toolResults: text('tool_results'),
  sendTime: timestamp('send_time').defaultNow().notNull(),
});

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  path: text('path').notNull(),
  mimeType: text('mime_type').notNull().default('text/plain'),
  size: integer('size').notNull().default(0),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mcpServers = pgTable('mcp_servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  url: text('url').notNull(),
  tools: text('tools').notNull().default('[]'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
