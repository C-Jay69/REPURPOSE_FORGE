import { Hono } from 'hono';
import { db } from '../database';
import { projects, sourceVideos, subscriptions } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const userProjects = await db.select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt));

  return c.json({ projects: userProjects });
});

app.post('/', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const { name } = await c.req.json();
  if (!name?.trim()) throw new HTTPException(400, { message: 'Project name required' });

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
  const planType = sub?.planType || 'free';
  const maxProjects = planType === 'free' ? 3 : planType === 'pro' ? 20 : 100;

  const count = await db.select({ count: 1 }).from(projects).where(eq(projects.userId, user.id));
  if (count.length >= maxProjects) {
    throw new HTTPException(403, { message: `Project limit reached for ${planType} plan` });
  }

  const [project] = await db.insert(projects).values({
    userId: user.id,
    name: name.trim(),
    status: 'draft',
  }).returning();

  return c.json({ project }, 201);
});

app.get('/:projectId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');
  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  const videos = await db.select()
    .from(sourceVideos)
    .where(eq(sourceVideos.projectId, projectId))
    .orderBy(sourceVideos.createdAt);

  return c.json({ project, videos });
});

app.patch('/:projectId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');
  const { name, status } = await c.req.json();

  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  const updates: any = {};
  if (name?.trim()) updates.name = name.trim();
  if (status) updates.status = status;

  const [updated] = await db.update(projects)
    .set({ ...updates, updatedAt: Date.now() })
    .where(eq(projects.id, projectId))
    .returning();

  return c.json({ project: updated });
});

app.delete('/:projectId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');
  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  await db.delete(projects).where(eq(projects.id, projectId));
  return c.json({ success: true });
});

export default app;