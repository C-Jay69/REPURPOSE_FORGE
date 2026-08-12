import { Hono } from 'hono';
import { db } from '../database';
import { generatedClips, sourceVideos, projects, processingJobs } from '../schema';
import { eq, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { storage, generateStorageKey } from '../lib/storage';
import { enqueueProcessingJob } from '../lib/queue';
import { processClipExport } from '../lib/video';

const app = new Hono();

app.patch('/:clipId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const clipId = c.req.param('clipId');
  const { userRating } = await c.req.json();

  const [clip] = await db.select()
    .from(generatedClips)
    .where(eq(generatedClips.id, clipId));
  if (!clip) throw new HTTPException(404, { message: 'Clip not found' });

  const [video] = await db.select().from(sourceVideos).where(eq(sourceVideos.id, clip.sourceVideoId));
  const [project] = await db.select().from(projects).where(eq(projects.id, video?.projectId));
  if (!project || project.userId !== user.id) throw new HTTPException(403, { message: 'Forbidden' });

  const validRating = userRating === 1 || userRating === -1 ? userRating : null;
  const [updated] = await db.update(generatedClips)
    .set({ userRating: validRating, updatedAt: Date.now() })
    .where(eq(generatedClips.id, clipId))
    .returning();

  return c.json({ clip: updated });
});

app.get('/:clipId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const clipId = c.req.param('clipId');
  const [clip] = await db.select().from(generatedClips).where(eq(generatedClips.id, clipId));
  if (!clip) throw new HTTPException(404, { message: 'Clip not found' });

  const [video] = await db.select().from(sourceVideos).where(eq(sourceVideos.id, clip.sourceVideoId));
  const [project] = await db.select().from(projects).where(eq(projects.id, video?.projectId));
  if (!project || project.userId !== user.id) throw new HTTPException(403, { message: 'Forbidden' });

  return c.json({
    clip: {
      ...clip,
      originalUrl: clip.storageUrlOriginal ? storage.getUrl(clip.storageUrlOriginal) : null,
      formattedUrl: clip.storageUrlFormatted ? storage.getUrl(clip.storageUrlFormatted) : null,
    },
  });
});

app.post('/:clipId/export', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const clipId = c.req.param('clipId');
  const { aspectRatio, captionStyle, watermarkEnabled, captionSegments, watermarkPath } = await c.req.json();

  const [clip] = await db.select().from(generatedClips).where(eq(generatedClips.id, clipId));
  if (!clip) throw new HTTPException(404, { message: 'Clip not found' });

  const [video] = await db.select().from(sourceVideos).where(eq(sourceVideos.id, clip.sourceVideoId));
  const [project] = await db.select().from(projects).where(eq(projects.id, video?.projectId));
  if (!project || project.userId !== user.id) throw new HTTPException(403, { message: 'Forbidden' });

  const validRatios = ['9:16', '1:1', '4:5', '16:9'];
  const ratio = validRatios.includes(aspectRatio) ? aspectRatio : '9:16';
  const style = ['hormozi', 'mrbeast', 'minimal'].includes(captionStyle) ? captionStyle : 'hormozi';

  const jobId = await enqueueProcessingJob(clipId, ratio, style, !!watermarkEnabled);

  processClipExport(jobId, clipId, ratio, style, !!watermarkEnabled, captionSegments || [], watermarkPath)
    .catch(console.error);

  return c.json({ jobId, status: 'pending' }, 202);
});

app.get('/:clipId/exports/:jobId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const jobId = c.req.param('jobId');
  const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId));
  if (!job) throw new HTTPException(404, { message: 'Export job not found' });

  return c.json({
    job: {
      id: job.id,
      status: job.status,
      outputUrl: job.outputUrl ? storage.getUrl(job.outputUrl) : null,
      errorMessage: job.errorMessage,
    },
  });
});

app.post('/:clipId/transcript', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const clipId = c.req.param('clipId');
  const [clip] = await db.select().from(generatedClips).where(eq(generatedClips.id, clipId));
  if (!clip) throw new HTTPException(404, { message: 'Clip not found' });

  const [video] = await db.select().from(sourceVideos).where(eq(sourceVideos.id, clip.sourceVideoId));
  const [project] = await db.select().from(projects).where(eq(projects.id, video?.projectId));
  if (!project || project.userId !== user.id) throw new HTTPException(403, { message: 'Forbidden' });

  const { segments } = await c.req.json();

  return c.json({ success: true, segments });
});

export default app;