import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// We'll reuse the authSchema from auth-schema.ts, but we'll export our own tables here.
// In database.ts we are combining both.

export const repurposeSessions = sqliteTable("repurpose_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(), // references auth.user.id
  inputType: text("input_type").notNull(), // 'text' | 'url' | 'file'
  inputContent: text("input_content").notNull(),
  inputTitle: text("input_title"),
  status: text("status").notNull().default("pending"), // 'pending' | 'processing' | 'done' | 'error'
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const repurposeOutputs = sqliteTable("repurpose_outputs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  userId: text("user_id").notNull(),
  format: text("format").notNull(),
  formatLabel: text("format_label").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const brandVoices = sqliteTable("brand_voices", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  examples: text("examples").notNull().default("[]"), // JSON array of strings
  toneFormality: integer("tone_formality").notNull().default(50), // 0-100
  toneLength: integer("tone_length").notNull().default(50), // 0-100 (short-long)
  toneHumor: integer("tone_humor").notNull().default(30), // 0-100 (serious-witty)
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

// Subscriptions table for Stripe
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(), // references auth.user.id
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  planId: text("plan_id").notNull(), // e.g., 'pro', 'unlimited'
  status: text("status").notNull(), // 'active', 'canceled', 'past_due', etc.
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});
