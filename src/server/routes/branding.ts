import { Hono } from 'hono';
import { db } from '../database';
import { brandingKits } from '../schema';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { storage, generateStorageKey } from '../lib/storage';

const app = new Hono();

app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const [kit] = await db.select().from(brandingKits).where(eq(brandingKits.userId, user.id));
  if (!kit) return c.json({ kit: null });

  return c.json({
    kit: {
      ...kit,
      logoUrl: kit.logoUrl ? storage.getUrl(kit.logoUrl) : null,
    },
  });
});

app.post('/', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const body = await c.req.parseBody({ all: true });
  const logoFile = body.logo;
  const primaryColorHex = body.primaryColorHex as string;
  const fontName = body.fontName as string;

  let logoUrl: string | null = null;
  if (logoFile && logoFile instanceof File) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(logoFile.type)) {
      throw new HTTPException(400, { message: 'Invalid logo format. Use PNG, JPG, SVG, or WebP.' });
    }
    const storageKey = generateStorageKey(user.id, 'branding', logoFile.name);
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    await storage.save(storageKey, buffer, logoFile.type);
    logoUrl = storageKey;
  }

  const [existing] = await db.select().from(brandingKits).where(eq(brandingKits.userId, user.id));

  let kit;
  if (existing) {
    if (logoUrl && existing.logoUrl) {
      await storage.delete(existing.logoUrl);
    }
    [kit] = await db.update(brandingKits)
      .set({
        logoUrl: logoUrl ?? existing.logoUrl,
        primaryColorHex: primaryColorHex ?? existing.primaryColorHex,
        fontName: fontName ?? existing.fontName,
        updatedAt: Date.now(),
      })
      .where(eq(brandingKits.userId, user.id))
      .returning();
  } else {
    [kit] = await db.insert(brandingKits).values({
      userId: user.id,
      logoUrl,
      primaryColorHex,
      fontName,
    }).returning();
  }

  return c.json({
    kit: {
      ...kit,
      logoUrl: kit.logoUrl ? storage.getUrl(kit.logoUrl) : null,
    },
  });
});

app.delete('/', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const [existing] = await db.select().from(brandingKits).where(eq(brandingKits.userId, user.id));
  if (existing?.logoUrl) {
    await storage.delete(existing.logoUrl);
  }
  await db.delete(brandingKits).where(eq(brandingKits.userId, user.id));
  return c.json({ success: true });
});

export default app;