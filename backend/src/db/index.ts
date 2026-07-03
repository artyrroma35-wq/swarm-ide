import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/swarm_ide';
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export type Db = typeof db;
