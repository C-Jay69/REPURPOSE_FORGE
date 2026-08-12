import { Hono } from 'hono';
import { db } from '../database';
import { projects, sourceVideos, analysisJobs, generatedClips } from '../schema';
import { eq, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { enqueueAnalysisJob } from '../lib/queue';

const app = new Hono();

const CLIP_DURATIONS = [30, 60, 90, 120, 180, 240, 300];

app.post('/:projectId/videos/:videoId', async (c) => {
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

  const { clipDuration, keywords } = await c.req.json();
  const duration = CLIP_DURATIONS.includes(clipDuration) ? clipDuration : 60;
  const userKeywords = Array.isArray(keywords) ? keywords.filter(k => typeof k === 'string' && k.trim()) : [];

  const jobId = await enqueueAnalysisJob(projectId, videoId, duration, userKeywords);

  await db.update(projects).set({ status: 'processing' }).where(eq(projects.id, projectId));

  return c.json({ jobId, status: 'pending' }, 202);
});

app.get('/:projectId/jobs/:jobId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');
  const jobId = c.req.param('jobId');

  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  const [job] = await db.select()
    .from(analysisJobs)
    .where(and(eq(analysisJobs.id, jobId), eq(analysisJobs.projectId, projectId)));
  if (!job) throw new HTTPException(404, { message: 'Job not found' });

  let result = null;
  if (job.resultJson) {
    try { result = JSON.parse(job.resultJson); } catch {}
  }

  return c.json({
    job: {
      id: job.id,
      status: job.status,
      clipDuration: job.clipDuration,
      userKeywords: job.userKeywords ? JSON.parse(job.userKeywords) : [],
      result,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
    },
  });
});

app.get('/:projectId/clips', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const projectId = c.req.param('projectId');

  const [project] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  if (!project) throw new HTTPException(404, { message: 'Project not found' });

  const videos = await db.select().from(sourceVideos).where(eq(sourceVideos.projectId, projectId));
  const videoIds = videos.map(v => v.id);

  if (videoIds.length === 0) return c.json({ clips: [] });

  const clips = await db.select()
    .from(generatedClips)
    .where(eq(generatedClips.sourceVideoId, videoIds[0]));

  const clipsWithUrls = clips.map(clip => ({
    ...clip,
    originalUrl: clip.storageUrlOriginal ? storage.getUrl(clip.storageUrlOriginal) : null,
    formattedUrl: clip.storageUrlFormatted ? storage.getUrl(clip.storageUrlFormatted) : null,
  }));

  return c.json({ clips: clipsWithUrls });
});

import { storage } from '../lib/storage';

export default app;