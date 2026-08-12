import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  planType: text("plan_type").notNull().default("free"),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const brandingKits = sqliteTable("branding_kits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColorHex: text("primary_color_hex"),
  fontName: text("font_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const sourceVideos = sqliteTable("source_videos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull(),
  storageUrl: text("storage_url").notNull(),
  duration: real("duration"),
  fullTranscriptJson: text("full_transcript_json"),
  status: text("status").notNull().default("uploaded"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const generatedClips = sqliteTable("generated_clips", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceVideoId: text("source_video_id").notNull(),
  storageUrlOriginal: text("storage_url_original"),
  storageUrlFormatted: text("storage_url_formatted"),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  aiRationaleText: text("ai_rationale_text"),
  hookType: text("hook_type"),
  userRating: integer("user_rating"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const scheduledPosts = sqliteTable("scheduled_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  generatedClipId: text("generated_clip_id").notNull(),
  socialPlatform: text("social_platform").notNull(),
  postTime: integer("post_time", { mode: "timestamp" }).notNull(),
  status: text("status").notNull().default("scheduled"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const socialAccounts = sqliteTable("social_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  platformUserId: text("platform_user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  scopes: text("scopes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const analysisJobs = sqliteTable("analysis_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull(),
  sourceVideoId: text("source_video_id").notNull(),
  status: text("status").notNull().default("pending"),
  clipDuration: integer("clip_duration").notNull(),
  userKeywords: text("user_keywords"),
  resultJson: text("result_json"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export const processingJobs = sqliteTable("processing_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  generatedClipId: text("generated_clip_id").notNull(),
  status: text("status").notNull().default("pending"),
  aspectRatio: text("aspect_ratio"),
  captionStyle: text("caption_style"),
  watermarkEnabled: integer("watermark_enabled", { mode: "boolean" }).default(false),
  outputUrl: text("output_url"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});