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

-- Create our tables
CREATE TABLE IF NOT EXISTS "repurpose_sessions" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL,
	"input_type" TEXT NOT NULL,
	"input_content" TEXT NOT NULL,
	"input_title" TEXT,
	"status" TEXT NOT NULL DEFAULT 'pending',
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS "repurpose_outputs" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"session_id" TEXT NOT NULL,
	"user_id" TEXT NOT NULL,
	"format" TEXT NOT NULL,
	"format_label" TEXT NOT NULL,
	"content" TEXT NOT NULL,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS "brand_voices" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL UNIQUE,
	"examples" TEXT NOT NULL DEFAULT '[]',
	"tone_formality" INTEGER NOT NULL DEFAULT 50,
	"tone_length" INTEGER NOT NULL DEFAULT 50,
	"tone_humor" INTEGER NOT NULL DEFAULT 30,
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT NOT NULL,
	"stripe_customer_id" TEXT NOT NULL,
	"stripe_subscription_id" TEXT NOT NULL UNIQUE,
	"plan_id" TEXT NOT NULL,
	"status" TEXT NOT NULL,
	"current_period_end" INTEGER NOT NULL,
	"created_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
	"updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);
