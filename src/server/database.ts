import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migration';
import { authSchema } from './auth-schema';
import { repurposeSchema } from './schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// For Bun, we can use __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

// Create the database connection
const sqlite = new Database(join(__dirname, '..', '..', 'sqlite.db'));
export const db = drizzle(sqlite, {
  schema: {
    ...authSchema,
    ...repurposeSchema,
  },
});

// Run migrations
migrate(db, { migrationsFolder: join(__dirname, '..', 'drizzle') });

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
