-- Create auth tables from better-auth
CREATE TABLE IF NOT EXISTS "user" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"name" TEXT,
	"email" TEXT NOT NULL UNIQUE,
	"emailVerified" INTEGER,
	"image" TEXT,
	"password" TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"expiresAt" INTEGER NOT NULL,
	"ipAddress" TEXT,
	"userAgent" TEXT,
	"userId" TEXT NOT NULL,
	FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "account" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"userId" TEXT NOT NULL,
	"providerType" TEXT NOT NULL,
	"providerId" TEXT NOT NULL,
	"providerAccountId" TEXT NOT NULL,
	"refreshToken" TEXT,
	"accessToken" TEXT,
	"expiresAt" INTEGER,
	"tokenType" TEXT,
	"scope" TEXT,
	"idToken" TEXT,
	"password" TEXT,
	FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "verification" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"identifier" TEXT NOT NULL,
	"value" TEXT NOT NULL,
	"expiresAt" INTEGER NOT NULL
);

-- Viral Clip Forge tables
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL UNIQUE,
	"stripe_customer_id" TEXT,
	"stripe_subscription_id" TEXT UNIQUE,
	"plan_type" TEXT NOT NULL DEFAULT 'free',
	"status" TEXT NOT NULL DEFAULT 'active',
	"current_period_end" INTEGER,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "branding_kits" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL UNIQUE,
	"logo_url" TEXT,
	"primary_color_hex" TEXT,
	"font_name" TEXT,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "projects" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"status" TEXT NOT NULL DEFAULT 'draft',
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "source_videos" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"project_id" TEXT NOT NULL,
	"storage_url" TEXT NOT NULL,
	"duration" REAL,
	"full_transcript_json" TEXT,
	"status" TEXT NOT NULL DEFAULT 'uploaded',
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "generated_clips" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"source_video_id" TEXT NOT NULL,
	"storage_url_original" TEXT,
	"storage_url_formatted" TEXT,
	"start_time" REAL NOT NULL,
	"end_time" REAL NOT NULL,
	"ai_rationale_text" TEXT,
	"hook_type" TEXT,
	"user_rating" INTEGER,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("source_video_id") REFERENCES "source_videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "scheduled_posts" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL,
	"generated_clip_id" TEXT NOT NULL,
	"social_platform" TEXT NOT NULL,
	"post_time" INTEGER NOT NULL,
	"status" TEXT NOT NULL DEFAULT 'scheduled',
	"error_message" TEXT,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
	FOREIGN KEY ("generated_clip_id") REFERENCES "generated_clips"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "social_accounts" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL,
	"platform" TEXT NOT NULL,
	"platform_user_id" TEXT NOT NULL,
	"access_token" TEXT NOT NULL,
	"refresh_token" TEXT,
	"expires_at" INTEGER,
	"scopes" TEXT,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
	UNIQUE("user_id", "platform")
);

CREATE TABLE IF NOT EXISTS "analysis_jobs" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"project_id" TEXT NOT NULL,
	"source_video_id" TEXT NOT NULL,
	"status" TEXT NOT NULL DEFAULT 'pending',
	"clip_duration" INTEGER NOT NULL,
	"user_keywords" TEXT,
	"result_json" TEXT,
	"error_message" TEXT,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
	FOREIGN KEY ("source_video_id") REFERENCES "source_videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "processing_jobs" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"generated_clip_id" TEXT NOT NULL,
	"status" TEXT NOT NULL DEFAULT 'pending',
	"aspect_ratio" TEXT,
	"caption_style" TEXT,
	"watermark_enabled" INTEGER DEFAULT 0,
	"output_url" TEXT,
	"error_message" TEXT,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY ("generated_clip_id") REFERENCES "generated_clips"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);