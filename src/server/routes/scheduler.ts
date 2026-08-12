import { Hono } from 'hono';
import { db } from '../database';
import { scheduledPosts, socialAccounts, generatedClips } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { storage } from '../lib/storage';

const app = new Hono();

const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'linkedin', 'facebook'] as const;

app.get('/accounts', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const accounts = await db.select()
    .from(socialAccounts)
    .where(eq(socialAccounts.userId, user.id));

  return c.json({ accounts });
});

app.post('/accounts', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const { platform, platformUserId, accessToken, refreshToken, expiresAt, scopes } = await c.req.json();

  if (!PLATFORMS.includes(platform)) {
    throw new HTTPException(400, { message: 'Invalid platform' });
  }

  const [account] = await db.insert(socialAccounts).values({
    userId: user.id,
    platform,
    platformUserId,
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
    scopes: scopes ? JSON.stringify(scopes) : null,
  }).onConflictDoUpdate({
    target: [socialAccounts.userId, socialAccounts.platform],
    set: {
      platformUserId,
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      scopes: scopes ? JSON.stringify(scopes) : null,
      updatedAt: Date.now(),
    },
  }).returning();

  return c.json({ account });
});

app.delete('/accounts/:platform', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const platform = c.req.param('platform');
  if (!PLATFORMS.includes(platform as any)) {
    throw new HTTPException(400, { message: 'Invalid platform' });
  }

  await db.delete(socialAccounts)
    .where(and(eq(socialAccounts.userId, user.id), eq(socialAccounts.platform, platform)));

  return c.json({ success: true });
});

app.get('/oauth/:platform', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const platform = c.req.param('platform');
  if (!PLATFORMS.includes(platform as any)) {
    throw new HTTPException(400, { message: 'Invalid platform' });
  }

  const configs: Record<string, { clientId: string; redirectUri: string; scope: string; authUrl: string }> = {
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      redirectUri: `${process.env.PUBLIC_BASE_URL}/api/scheduler/oauth/tiktok/callback`,
      scope: 'video.upload,user.info.basic',
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    },
    instagram: {
      clientId: process.env.META_APP_ID || '',
      redirectUri: `${process.env.PUBLIC_BASE_URL}/api/scheduler/oauth/instagram/callback`,
      scope: 'instagram_content_publish,instagram_basic,pages_show_list',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    },
    youtube: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      redirectUri: `${process.env.PUBLIC_BASE_URL}/api/scheduler/oauth/youtube/callback`,
      scope: 'https://www.googleapis.com/auth/youtube.upload',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      redirectUri: `${process.env.PUBLIC_BASE_URL}/api/scheduler/oauth/linkedin/callback`,
      scope: 'r_liteprofile,w_member_social',
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    },
    facebook: {
      clientId: process.env.META_APP_ID || '',
      redirectUri: `${process.env.PUBLIC_BASE_URL}/api/scheduler/oauth/facebook/callback`,
      scope: 'pages_manage_posts,pages_read_engagement,instagram_content_publish',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    },
  };

  const config = configs[platform];
  if (!config.clientId) {
    throw new HTTPException(500, { message: `${platform} OAuth not configured` });
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state,
  });

  return c.redirect(`${config.authUrl}?${params.toString()}`);
});

app.get('/oauth/:platform/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const platform = c.req.param('platform');

  if (!code) {
    return c.redirect(`${process.env.PUBLIC_BASE_URL}/scheduler?error=oauth_failed`);
  }

  const tokenEndpoints: Record<string, string> = {
    tiktok: 'https://open.tiktokapis.com/v2/oauth/token/',
    instagram: 'https://graph.facebook.com/v18.0/oauth/access_token',
    youtube: 'https://oauth2.googleapis.com/token',
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
  };

  const endpoint = tokenEndpoints[platform];
  if (!endpoint) {
    return c.redirect(`${process.env.PUBLIC_BASE_URL}/scheduler?error=invalid_platform`);
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env[`${platform.toUpperCase()}_CLIENT_ID`] || '',
      client_secret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`] || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/scheduler/oauth/${platform}/callback`,
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    let platformUserId = '';
    if (platform === 'tiktok') {
      const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userRes.json();
      platformUserId = userData.data?.user?.open_id || '';
    } else if (platform === 'instagram' || platform === 'facebook') {
      const userRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userRes.json();
      platformUserId = userData.id || '';
    } else if (platform === 'youtube') {
      const userRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userRes.json();
      platformUserId = userData.items?.[0]?.id || '';
    } else if (platform === 'linkedin') {
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userRes.json();
      platformUserId = userData.sub || '';
    }

    await db.insert(socialAccounts).values({
      userId: user.id,
      platform,
      platformUserId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
    }).onConflictDoUpdate({
      target: [socialAccounts.userId, socialAccounts.platform],
      set: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
        updatedAt: Date.now(),
      },
    });

    return c.redirect(`${process.env.PUBLIC_BASE_URL}/scheduler?connected=${platform}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.redirect(`${process.env.PUBLIC_BASE_URL}/scheduler?error=oauth_failed`);
  }
});

app.get('/posts', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const posts = await db.select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.userId, user.id))
    .orderBy(desc(scheduledPosts.postTime));

  return c.json({ posts });
});

app.post('/posts', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const { generatedClipId, socialPlatform, postTime } = await c.req.json();

  if (!PLATFORMS.includes(socialPlatform)) {
    throw new HTTPException(400, { message: 'Invalid platform' });
  }

  const [clip] = await db.select().from(generatedClips).where(eq(generatedClips.id, generatedClipId));
  if (!clip) throw new HTTPException(404, { message: 'Clip not found' });

  const [video] = await db.select().from(socialAccounts)
    .where(and(eq(socialAccounts.userId, user.id), eq(socialAccounts.platform, socialPlatform)));
  if (!video) throw new HTTPException(400, { message: 'Social account not connected' });

  const postDate = new Date(postTime);
  if (postDate < new Date()) {
    throw new HTTPException(400, { message: 'Post time must be in the future' });
  }

  const [post] = await db.insert(scheduledPosts).values({
    userId: user.id,
    generatedClipId,
    socialPlatform,
    postTime: postDate.getTime(),
    status: 'scheduled',
  }).returning();

  return c.json({ post }, 201);
});

app.delete('/posts/:postId', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const postId = c.req.param('postId');
  await db.delete(scheduledPosts)
    .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, user.id)));

  return c.json({ success: true });
});

export default app;