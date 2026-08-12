import { drizzle } from 'drizzle-orm/bun-sqlite';
import { authSchema } from './auth-schema';
import * as repurposeSchema from './schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { Database } from 'bun:sqlite';

// For Bun, we can use __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

// Create the database connection
const sqlite = new Database(join(__dirname, '..', '..', 'sqlite.db'));

// Run raw SQL migrations (bypasses drizzle migrator which needs _journal.json)
const migrationSQL = readFileSync(join(__dirname, 'drizzle', '0001_init.sql'), 'utf-8');
sqlite.exec(migrationSQL);

export const db = drizzle(sqlite, {
  schema: {
    ...authSchema,
    ...repurposeSchema,
  },
});

// Helper to get a user by email
export async function getUserByEmail(email: string) {
  return db.query.authSchema.user.findFirst({
    where: (eq(authSchema.user.email, email)),
  });
}

// Helper to get a user by id
export async function getUserById(id: string) {
  return db.query.authSchema.user.findFirst({
    where: (eq(authSchema.user.id, id)),
  });
}
