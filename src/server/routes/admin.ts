import { Hono } from 'hono';
import { db } from '../database';
import { repurposeSessions, repurposeOutputs, brandVoices } from '../schema';
import { requireAdmin } from '../middleware/admin';
import { and, count, eq, gte, lt, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

// Admin middleware
app.use('*', requireAdmin);

// Helper to get date 24 hours ago
const get24HoursAgo = () => {
  const now = new Date();
  const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return past;
};

// GET /api/admin/stats
app.get('/stats', async (c) => {
  const [totalUsers] = await db.select({ count: count() }).from(brandVoices);
  const [todayUsers] = await db.select({ count: count() })
    .from(brandVoices)
    .where(gte(brandVoices.updatedAt, get24HoursAgo()));

  const [totalSessions] = await db.select({ count: count() }).from(repurposeSessions);
  const [todaySessions] = await db.select({ count: count() })
    .from(repurposeSessions)
    .where(gte(repurposeSessions.createdAt, get24HoursAgo()));

  const [totalOutputs] = await db.select({ count: count() }).from(repurposeOutputs);

  return c.json({
    totalUsers: Number(totalUsers.count),
    todayUsers: Number(todayUsers.count),
    totalSessions: Number(totalSessions.count),
    todaySessions: Number(todaySessions.count),
    totalOutputs: Number(totalOutputs.count),
  });
});

// GET /api/admin/analytics
app.get('/analytics', async (c) => {
  // We'll compute simple analytics for the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Sessions per day (last 7 days)
  const sessionsPerDay = await db.select({
    date: sql<string>`strftime('%Y-%m-%d', ${repurposeSessions.createdAt} / 1000)`,
    count: count(),
  })
    .from(repurposeSessions)
    .where(gte(repurposeSessions.createdAt, sevenDaysAgo))
    .groupBy(sql<string>`strftime('%Y-%m-%d', ${repurposeSessions.createdAt} / 1000)`)
    .orderBy(sql<string>`strftime('%Y-%m-%d', ${repurposeSessions.createdAt} / 1000)`);

  // Signups per day (last 7 days) - using brandVoices.updatedAt as proxy for user creation
  const signupsPerDay = await db.select({
    date: sql<string>`strftime('%Y-%m-%d', ${brandVoices.updatedAt} / 1000)`,
    count: count(),
  })
    .from(brandVoices)
    .where(gte(brandVoices.updatedAt, sevenDaysAgo))
    .groupBy(sql<string>`strftime('%Y-%m-%d', ${brandVoices.updatedAt} / 1000)`)
    .orderBy(sql<string>`strftime('%Y-%m-%d', ${brandVoices.updatedAt} / 1000)`);

  // Top formats used (all time)
  const topFormats = await db.select({
    format: repurposeOutputs.format,
    count: count(),
  })
    .from(repurposeOutputs)
    .groupBy(repurposeOutputs.format)
    .orderBy(count(repurposeOutputs.format))
    .limit(10);

  return c.json({
    sessions: sessionsPerDay.map((row) => ({
      date: row.date,
      count: Number(row.count),
    })),
    signups: signupsPerDay.map((row) => ({
      date: row.date,
      count: Number(row.count),
    })),
    topFormats: topFormats.map((row) => ({
      format: row.format,
      count: Number(row.count),
    })),
  });
});

// GET /api/admin/users
app.get('/users', async (c) => {
  const users = await db.select({
    id: brandVoices.id,
    userId: brandVoices.userId,
    // We don't have email in brandVoices, but we can join with auth user table? 
    // Since we didn't expose the auth user table in the schema, we'll skip email for now.
    // Alternatively, we can change the schema to include email in brandVoices? 
    // But note: brandVoices already has userId which references auth.user.id.
    // We'll need to join with the auth user table to get email. However, we didn't export the auth user table.
    // For simplicity, we'll just return the userId and the brand voice details.
    examples: brandVoices.examples,
    toneFormality: brandVoices.toneFormality,
    toneLength: brandVoices.toneLength,
    toneHumor: brandVoices.toneHumor,
    updatedAt: brandVoices.updatedAt,
  })
    .from(brandVoices);
  return c.json({ users });
});

// GET /api/admin/sessions
app.get('/sessions', async (c) => {
  const sessions = await db.select({
    id: repurposeSessions.id,
    inputTitle: repurposeSessions.inputTitle,
    inputType: repurposeSessions.inputType,
    status: repurposeSessions.status,
    createdAt: repurposeSessions.createdAt,
  })
    .from(repurposeSessions)
    .orderBy(repurposeSessions.createdAt)
    .limit(50);
  return c.json({ sessions });
});

// GET /api/admin/maintenance
app.get('/maintenance', async (c) => {
  // We'll store maintenance in a simple table or in a file. For simplicity, we'll use a table.
  // Let's create a maintenance table on the fly if it doesn't exist? 
  // Instead, we'll use a singleton row in a table called `app_settings`.
  // But we don't have that table. We'll create a simple key-value table in the database.
  // However, to keep it simple, we'll just return a default value.
  // We'll create a table for settings if needed, but for now, we'll return a static object.
  // In a real app, we'd have a settings table.
  return c.json({ enabled: false, message: '' });
});

// POST /api/admin/maintenance
app.post('/maintenance', async (c) => {
  const { enabled, message } = await c.req.json();
  // We would save this to a database table. For now, we'll just echo back.
  // In a real app, we'd update a settings table.
  return c.json({ enabled, message });
});

export default app;
