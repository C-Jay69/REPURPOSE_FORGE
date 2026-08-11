import { Hono } from 'hono';
import { db } from '../database';
import { brandVoices } from '../schema';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

// Middleware to check auth (we already have authMiddleware in the app, but we double-check)
app.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  await next();
});

app.get('/', async (c) => {
  const user = c.get('user');
  const [voice] = await db.select().from(brandVoices)
    .where(eq(brandVoices.userId, user.id));
  return c.json({ voice: voice || null }, 200);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const { examples, toneFormality, toneLength, toneHumor } = await c.req.json();

  const [existing] = await db.select().from(brandVoices)
    .where(eq(brandVoices.userId, user.id));

  const data = {
    userId: user.id,
    examples: JSON.stringify(examples || []),
    toneFormality: toneFormality ?? 50,
    toneLength: toneLength ?? 50,
    toneHumor: toneHumor ?? 30,
    updatedAt: Date.now(),
  };

  if (existing) {
    const [updated] = await db.update(brandVoices)
      .set(data)
      .where(eq(brandVoices.userId, user.id))
      .returning();
    return c.json({ voice: updated }, 200);
  } else {
    const [created] = await db.insert(brandVoices)
      .values(data)
      .returning();
    return c.json({ voice: created }, 200);
  }
});

export default app;
