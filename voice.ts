import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const voiceRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const [voice] = await db.select().from(schema.brandVoices)
      .where(eq(schema.brandVoices.userId, user.id));
    return c.json({ voice: voice || null }, 200);
  })
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const { examples, toneFormality, toneLength, toneHumor } = await c.req.json();

    const [existing] = await db.select().from(schema.brandVoices)
      .where(eq(schema.brandVoices.userId, user.id));

    const data = {
      userId: user.id,
      examples: JSON.stringify(examples || []),
      toneFormality: toneFormality ?? 50,
      toneLength: toneLength ?? 50,
      toneHumor: toneHumor ?? 30,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await db.update(schema.brandVoices)
        .set(data)
        .where(eq(schema.brandVoices.userId, user.id))
        .returning();
      return c.json({ voice: updated }, 200);
    } else {
      const [created] = await db.insert(schema.brandVoices)
        .values(data)
        .returning();
      return c.json({ voice: created }, 200);
    }
  });
