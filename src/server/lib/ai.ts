import { generateText } from 'ai';
import { gateway, getModel } from './gateway';
import { db } from '../database';
import { analysisJobs, sourceVideos, generatedClips } from '../schema';
import { eq } from 'drizzle-orm';
import { storage, getVideoDuration } from './storage';
import { registerAnalysisHandler } from './queue';

export interface ClipSuggestion {
  start: number;
  end: number;
  confidence: number;
  rationale: string;
  hookType: string;
}

export interface AnalysisResult {
  clips: ClipSuggestion[];
  fullTranscript: string;
}

const HOOK_TYPES = [
  'Hot Take',
  'Question/Answer',
  'Tutorial',
  'Anecdote',
  'Story',
  'Listicle',
  'Demo',
  'Reaction',
  'Controversial',
  'Inspirational',
];

function buildAnalysisPrompt(
  transcript: string,
  clipDuration: number,
  userKeywords: string[]
): string {
  const keywordGuidance = userKeywords.length > 0
    ? `\nIMPORTANT: Prioritize segments containing these keywords: ${userKeywords.join(', ')}`
    : '';

  return `You are an expert video content analyst. Analyze the following transcript and identify the best ${clipDuration}-second clips for viral social media.

TRANSCRIPT:
${transcript}

TASK:
1. Find 5-8 distinct segments that would make engaging short-form clips (${clipDuration}s each)
2. Each clip must have a clear hook, complete thought, and viral potential
3. Classify each clip's hook type: ${HOOK_TYPES.join(', ')}
4. Provide confidence score (0-1) and rationale

${keywordGuidance}

RESPOND IN JSON ONLY:
{
  "clips": [
    {
      "start": <seconds>,
      "end": <seconds>,
      "confidence": <0-1>,
      "rationale": "<why this clip works>",
      "hookType": "<one of the hook types>"
    }
  ]
}`;
}

export async function analyzeVideoForClips(
  jobId: string,
  projectId: string,
  sourceVideoId: string,
  clipDuration: number,
  userKeywords: string[]
): Promise<void> {
  const [sourceVideo] = await db.select().from(sourceVideos).where(eq(sourceVideos.id, sourceVideoId));
  if (!sourceVideo) throw new Error('Source video not found');

  let transcript = sourceVideo.fullTranscriptJson;
  if (!transcript) {
    const videoPath = storage.getLocalPath(sourceVideo.storageUrl);
    const duration = await getVideoDuration(videoPath);
    transcript = `[No transcript available. Video duration: ${duration.toFixed(1)}s. Analyze based on typical content structure for ${clipDuration}s clips.]`;
  }

  const prompt = buildAnalysisPrompt(transcript, clipDuration, userKeywords);

  const { text } = await generateText({
    model: gateway(getModel()),
    system: 'You are a precise video content analyst. Output only valid JSON.',
    prompt,
    maxTokens: 2000,
    temperature: 0.3,
  });

  let result: AnalysisResult;
  try {
    result = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  const clips = result.clips
    .filter((c: ClipSuggestion) => c.end - c.start >= clipDuration * 0.8 && c.end - c.start <= clipDuration * 1.2)
    .slice(0, 8)
    .map((c: ClipSuggestion, i: number) => ({
      ...c,
      start: Math.max(0, c.start),
      end: Math.min(sourceVideo.duration || c.end, c.end),
    }));

  for (const clip of clips) {
    await db.insert(generatedClips).values({
      sourceVideoId,
      startTime: clip.start,
      endTime: clip.end,
      aiRationaleText: clip.rationale,
      hookType: clip.hookType,
    });
  }

  await db.update(analysisJobs)
    .set({
      status: 'completed',
      resultJson: JSON.stringify({ clips, fullTranscript: transcript }),
    })
    .where(eq(analysisJobs.id, jobId));
}

registerAnalysisHandler('analyze', async (payload) => {
  await analyzeVideoForClips(
    payload.jobId || 'unknown',
    payload.projectId,
    payload.sourceVideoId,
    payload.clipDuration,
    payload.userKeywords
  );
});