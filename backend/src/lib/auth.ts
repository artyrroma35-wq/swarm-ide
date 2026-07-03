import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'swarm-ide-secret-change-me';
const TOKEN_EXPIRY = '7d';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verify;
}

export async function registerUser(username: string, password: string) {
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) throw new Error('User already exists');
  
  const [user] = await db.insert(users).values({
    username,
    passwordHash: hashPassword(password),
  }).returning();
  
  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  return { user: { id: user.id, username: user.username, role: user.role }, token };
}

export async function loginUser(username: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) throw new Error('User not found');
  if (!verifyPassword(password, user.passwordHash)) throw new Error('Invalid password');
  
  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  return { user: { id: user.id, username: user.username, role: user.role }, token };
}

export function verifyAuthToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch { return null; }
}
