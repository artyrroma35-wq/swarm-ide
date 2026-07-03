const tokens = new Map<string, { userId: string; username: string; role: 'admin'|'user'|'viewer'; workspaceIds: string[] }>();

export function createToken(username: string, role: 'admin'|'user'|'viewer' = 'user'): string {
  const token = `swarm_${Buffer.from(username + Date.now()).toString('base64').slice(0, 20)}`;
  tokens.set(token, { userId: crypto.randomUUID(), username, role, workspaceIds: [] });
  return token;
}

export function verifyToken(token: string): typeof tokens extends Map<string, infer V> ? V : null {
  const found = tokens.get(token);
  return found ? { ...found } : null as any;
}

export function addWorkspaceToUser(token: string, workspaceId: string): void {
  const user = tokens.get(token);
  if (user && !user.workspaceIds.includes(workspaceId)) user.workspaceIds.push(workspaceId);
}

export function listUsers(): string[] {
  return [...tokens.values()].map(u => `${u.username} (${u.role})`);
}

export const adminToken = createToken('admin', 'admin');
