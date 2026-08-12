import { db } from '../database';
import { analysisJobs, processingJobs } from '../schema';
import { eq, and } from 'drizzle-orm';

type JobHandler<T> = (job: T) => Promise<void>;

interface QueuedJob<T> {
  id: string;
  type: 'analysis' | 'processing';
  payload: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: number;
}

const analysisHandlers = new Map<string, JobHandler<any>>();
const processingHandlers = new Map<string, JobHandler<any>>();

const POLL_INTERVAL = 2000;
const MAX_ATTEMPTS = 3;
let isRunning = false;

export function registerAnalysisHandler(type: string, handler: JobHandler<any>) {
  analysisHandlers.set(type, handler);
}

export function registerProcessingHandler(type: string, handler: JobHandler<any>) {
  processingHandlers.set(type, handler);
}

async function processAnalysisJob(job: any) {
  const handler = analysisHandlers.get(job.type);
  if (!handler) throw new Error(`No handler for analysis job type: ${job.type}`);
  await handler(job.payload);
}

async function processProcessingJob(job: any) {
  const handler = processingHandlers.get(job.type);
  if (!handler) throw new Error(`No handler for processing job type: ${job.type}`);
  await handler(job.payload);
}

export async function enqueueAnalysisJob(
  projectId: string,
  sourceVideoId: string,
  clipDuration: number,
  userKeywords?: string[]
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(analysisJobs).values({
    id,
    projectId,
    sourceVideoId,
    status: 'pending',
    clipDuration,
    userKeywords: userKeywords ? JSON.stringify(userKeywords) : null,
  });
  return id;
}

export async function enqueueProcessingJob(
  generatedClipId: string,
  aspectRatio: string,
  captionStyle: string,
  watermarkEnabled: boolean
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(processingJobs).values({
    id,
    generatedClipId,
    status: 'pending',
    aspectRatio,
    captionStyle,
    watermarkEnabled: watermarkEnabled ? 1 : 0,
  });
  return id;
}

async function pollAnalysisJobs() {
  const jobs = await db.select()
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'pending'))
    .limit(5);

  for (const job of jobs) {
    await db.update(analysisJobs).set({ status: 'processing' }).where(eq(analysisJobs.id, job.id));
    try {
      await processAnalysisJob({
        id: job.id,
        type: 'analyze',
        payload: {
          projectId: job.projectId,
          sourceVideoId: job.sourceVideoId,
          clipDuration: job.clipDuration,
          userKeywords: job.userKeywords ? JSON.parse(job.userKeywords) : [],
        },
      });
      await db.update(analysisJobs).set({ status: 'completed' }).where(eq(analysisJobs.id, job.id));
    } catch (error) {
      await db.update(analysisJobs)
        .set({ status: 'failed', errorMessage: String(error) })
        .where(eq(analysisJobs.id, job.id));
    }
  }
}

async function pollProcessingJobs() {
  const jobs = await db.select()
    .from(processingJobs)
    .where(eq(processingJobs.status, 'pending'))
    .limit(3);

  for (const job of jobs) {
    await db.update(processingJobs).set({ status: 'processing' }).where(eq(processingJobs.id, job.id));
    try {
      await processProcessingJob({
        id: job.id,
        type: 'export',
        payload: {
          generatedClipId: job.generatedClipId,
          aspectRatio: job.aspectRatio,
          captionStyle: job.captionStyle,
          watermarkEnabled: !!job.watermarkEnabled,
        },
      });
      await db.update(processingJobs).set({ status: 'completed' }).where(eq(processingJobs.id, job.id));
    } catch (error) {
      await db.update(processingJobs)
        .set({ status: 'failed', errorMessage: String(error) })
        .where(eq(processingJobs.id, job.id));
    }
  }
}

export function startJobQueue() {
  if (isRunning) return;
  isRunning = true;

  const interval = setInterval(async () => {
    try {
      await pollAnalysisJobs();
      await pollProcessingJobs();
    } catch (error) {
      console.error('Job queue error:', error);
    }
  }, POLL_INTERVAL);

  return () => {
    clearInterval(interval);
    isRunning = false;
  };
}

export function getJobStatus(jobId: string, type: 'analysis' | 'processing') {
  if (type === 'analysis') {
    return db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId)).then(r => r[0]);
  } else {
    return db.select().from(processingJobs).where(eq(processingJobs.id, jobId)).then(r => r[0]);
  }
}