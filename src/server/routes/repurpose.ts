import { Hono } from 'hono';
import { db } from '../database';
import { repurposeSessions, repurposeOutputs, brandVoices } from '../schema';
import { and, eq } from 'drizzle-orm';
import { generateRepurposedContent } from '../lib/repurpose';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

// Generate repurposed content for a set of formats
app.post('/', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const { inputContent, inputType = 'text', formats } = await c.req.json();

  if (!inputContent || !formats || !Array.isArray(formats) || formats.length === 0) {
    throw new HTTPException(400, { message: 'Invalid input' });
  }

  // Fetch user's brand voice
  const [voice] = await db.select().from(brandVoices).where(eq(brandVoices.userId, user.id));

  // Create a session
  const [session] = await db
    .insert(repurposeSessions)
    .values({
      userId: user.id,
      inputType,
      inputContent,
      inputTitle: inputContent.split('\n')[0].slice(0, 100), // first line as title
      status: 'processing',
    })
    .returning();

  // Generate outputs for each format
  const outputsPromises = formats.map(async (formatId) => {
    try {
      const content = await generateRepurposedContent(
        inputContent,
        formatId,
        {
          examples: voice?.examples ? JSON.parse(voice.examples) : [],
          toneFormality: voice?.toneFormality ?? 50,
          toneLength: voice?.toneLength ?? 50,
          toneHumor: voice?.toneHumor ?? 30,
        }
      );

      // We need the formatLabel from the formatId. We'll use a map.
      const formatMap: Record<string, string> = {
        twitter_thread: 'X / Twitter Thread',
        linkedin_post: 'LinkedIn Post',
        instagram_caption: 'Instagram Caption',
        instagram_hooks: 'Instagram Hooks (5)',
        email_newsletter: 'Email Newsletter',
        youtube_script: 'YouTube Script',
        blog_summary: 'Blog Summary',
        tiktok_hook: 'TikTok Hook',
        podcast_intro: 'Podcast Intro',
        facebook_post: 'Facebook Post',
        whatsapp_broadcast: 'WhatsApp Broadcast',
        sms_campaign: 'SMS Campaign',
      };

      const formatLabel = formatMap[formatId] || formatId;

      return {
        sessionId: session.id,
        userId: user.id,
        format: formatId,
        formatLabel,
        content,
      };
    } catch (err) {
      console.error(`Failed to generate ${formatId}:`, err);
      return null;
    }
  });

  const outputs = (await Promise.all(outputsPromises)).filter((o): o is NonNullable<typeof o> => o !== null);

  // Insert outputs
  if (outputs.length > 0) {
    await db.insert(repurposeOutputs).values(outputs);
  }

  // Update session status to done
  await db
    .update(repurposeSessions)
    .set({ status: 'done' })
    .where(eq(repurposeSessions.id, session.id));

  return c.json({
    session: {
      id: session.id,
      inputTitle: session.inputTitle,
      inputType: session.inputType,
      status: session.status,
      createdAt: session.createdAt,
    },
    outputs: outputs.map((o) => ({
      id: o.id,
      format: o.format,
      formatLabel: o.formatLabel,
      content: o.content,
    })),
  });
});

// Get user's sessions (history)
app.get('/history', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const sessions = await db
    .select({
      id: repurposeSessions.id,
      inputTitle: repurposeSessions.inputTitle,
      inputType: repurposeSessions.inputType,
      status: repurposeSessions.status,
      createdAt: repurposeSessions.createdAt,
    })
    .from(repurposeSessions)
    .where(eq(repurposeSessions.userId, user.id))
    .orderBy(repurposeSessions.createdAt);

  return c.json({ sessions });
});

// Get a specific session with its outputs
app.get('/history/:sessionId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const sessionId = c.req.param('sessionId');

  const [session] = await db
    .select()
    .from(repurposeSessions)
    .where(and(eq(repurposeSessions.id, sessionId), eq(repurposeSessions.userId, user.id)));

  if (!session) {
    throw new HTTPException(404, { message: 'Session not found' });
  }

  const outputs = await db
    .select({
      id: repurposeOutputs.id,
      format: repurposeOutputs.format,
      formatLabel: repurposeOutputs.formatLabel,
      content: repurposeOutputs.content,
    })
    .from(repurposeOutputs)
    .where(eq(repurposeOutputs.sessionId, sessionId));

  return c.json({
    session: {
      id: session.id,
      inputTitle: session.inputTitle,
      inputType: session.inputType,
      status: session.status,
      createdAt: session.createdAt,
    },
    outputs,
  });
});

// Regenerate a specific format for a session
app.post('/history/:sessionId/regenerate', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const sessionId = c.req.param('sessionId');
  const { formatId, customInstruction } = await c.req.json();

  if (!formatId) {
    throw new HTTPException(400, { message: 'formatId is required' });
  }

  // Verify the session belongs to the user
  const [session] = await db
    .select()
    .from(repurposeSessions)
    .where(and(eq(repurposeSessions.id, sessionId), eq(repurposeSessions.userId, user.id)));

  if (!session) {
    throw new HTTPException(404, { message: 'Session not found' });
  }

  // Fetch user's brand voice
  const [voice] = await db.select().from(brandVoices).where(eq(brandVoices.userId, user.id));

  // Generate the content
  const content = await generateRepurposedContent(
    session.inputContent,
    formatId,
    {
      examples: voice?.examples ? JSON.parse(voice.examples) : [],
      toneFormality: voice?.toneFormality ?? 50,
      toneLength: voice?.toneLength ?? 50,
      toneHumor: voice?.toneHumor ?? 30,
    },
    customInstruction
  );

  const formatMap: Record<string, string> = {
    twitter_thread: 'X / Twitter Thread',
    linkedin_post: 'LinkedIn Post',
    instagram_caption: 'Instagram Caption',
    instagram_hooks: 'Instagram Hooks (5)',
    email_newsletter: 'Email Newsletter',
    youtube_script: 'YouTube Script',
    blog_summary: 'Blog Summary',
    tiktok_hook: 'TikTok Hook',
    podcast_intro: 'Podcast Intro',
    facebook_post: 'Facebook Post',
    whatsapp_broadcast: 'WhatsApp Broadcast',
    sms_campaign: 'SMS Campaign',
  };

  const formatLabel = formatMap[formatId] || formatId;

  // Upsert the output: update if exists, else insert
  const [existingOutput] = await db
    .select()
    .from(repurposeOutputs)
    .where(and(eq(repurposeOutputs.sessionId, sessionId), eq(repurposeOutputs.format, formatId)));

  if (existingOutput) {
    await db
      .update(repurposeOutputs)
      .set({ content, formatLabel })
      .where(eq(repurposeOutputs.id, existingOutput.id));
  } else {
    await db.insert(repurposeOutputs).values({
      sessionId,
      userId: user.id,
      format: formatId,
      formatLabel,
      content,
    });
  }

  return c.json({
    id: crypto.randomUUID(), // temporary id for the output
    format: formatId,
    formatLabel,
    content,
  });
});

export default app;
