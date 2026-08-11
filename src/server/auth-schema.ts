import { pgTable, text, integer, timestamp, pgIndex } from "drizzle-orm/pg-core";
import { sqliteTable, text, integer, timestamp } from "drizzle-orm/sqlite-core";

// Since we are using SQLite, we use sqliteTable
export const authSchema = {
  user: sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "timestamp" }),
    image: text("image"),
    password: text("password"), // hashed password
  }),

  session: sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => authSchema.user.id),
  }),

  account: sqliteTable("account", {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => authSchema.user.id),
    providerType: text("providerType").notNull(),
    providerId: text("providerId").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refreshToken: text("refreshToken"),
    accessToken: text("accessToken"),
    expiresAt: integer("expiresAt", { mode: "timestamp" }),
    tokenType: text("tokenType"),
    scope: text("scope"),
    idToken: text("idToken"),
    password: text("password"),
  }),

  verification: sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  }),

  // We can add other tables like password reset, etc. if needed
};
