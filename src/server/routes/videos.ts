import { Hono } from 'hono';
import { db } from '../database';
import { projects, sourceVideos } from '../schema';
import { eq, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { storage, generateStorageKey, getVideoDuration } from '../lib/storage';

const app = new Hono();

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];

app.post('/:projectId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');
  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  const body = await c.req.parseBody({ all: true });
  const file = body.file;

  if (!file || !(file instanceof File)) {
    throw new HTTPException(400, { message: 'No video file provided' });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException(400, { message: 'Invalid file type. Use MP4, MOV, or WEBM.' });
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new HTTPException(400, { message: 'File too large. Max 2GB.' });
  }

  const storageKey = generateStorageKey(user.id, 'videos', file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await storage.save(storageKey, buffer, file.type);

  const localPath = storage.getLocalPath(storageKey);
  let duration: number | null = null;
  try {
    duration = await getVideoDuration(localPath);
  } catch {
    duration = null;
  }

  const [video] = await db.insert(sourceVideos).values({
    projectId,
    storageUrl: storageKey,
    duration,
    status: 'uploaded',
  }).returning();

  return c.json({ video }, 201);
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

  return c.json({ videos });
});

app.get('/:projectId/:videoId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');
  const videoId = c.req.param('videoId');

  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  const [video] = await db.select()
    .from(sourceVideos)
    .where(and(eq(sourceVideos.id, videoId), eq(sourceVideos.projectId, projectId)));
  if (!video) throw new HTTPException(404, { message: 'Video not found' });

  const url = storage.getUrl(video.storageUrl);
  return c.json({ video: { ...video, url } });
});

app.delete('/:projectId/:videoId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');
  const videoId = c.req.param('videoId');

  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  const [video] = await db.select()
    .from(sourceVideos)
    .where(and(eq(sourceVideos.id, videoId), eq(sourceVideos.projectId, projectId)));
  if (!video) throw new HTTPException(404, { message: 'Video not found' });

  await storage.delete(video.storageUrl);
  await db.delete(sourceVideos).where(eq(sourceVideos.id, videoId));

  return c.json({ success: true });
});

export default app;