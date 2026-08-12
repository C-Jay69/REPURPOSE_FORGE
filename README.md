# Viral Clip Forge v2.0

An intelligent, end-to-end content repurposing platform that turns long-form videos into viral social media clips.

## Features

- **AI Clip Detection**: Upload long videos, AI finds the most engaging moments with confidence scoring
- **Studio Editor**: Timeline with waveforms, trim handles, aspect ratios (9:16, 1:1, 4:5, 16:9)
- **Auto-Captions**: AI-generated transcripts with editable text, Hormozi/MrBeast/Minimal styles
- **Branding Kit**: Custom logos, colors, fonts applied as watermarks
- **Content Scheduler**: Calendar view, connect TikTok/Instagram/YouTube/LinkedIn, drag-to-schedule
- **Tiered Plans**: Free (3 projects/mo), Pro ($29/mo), Agency ($99/mo)

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS for styling
- TanStack Query for data fetching
- Wouter for routing
- Better Auth for authentication

### Backend
- Hono (lightweight web framework) on Bun
- SQLite database with Drizzle ORM
- Better Auth for authentication
- Vercel AI SDK for AI generation (OpenRouter by default)
- Stripe for billing
- FFmpeg for video processing

## Setup

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- [FFmpeg](https://ffmpeg.org/) (for video processing)
- SQLite (bundled with Bun)

### Environment Variables
Create a `.env` file in the root directory based on `.env.example`:

```env
# Server
PORT=3000

# Better Auth
# Generate a secret: openssl rand -base64 32
AUTH_SECRET=

# OpenRouter (free models)
OPENROUTER_API_KEY=

# Stripe (test mode keys from dashboard.stripe.com/test)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=price_1XXX...
STRIPE_PRICE_AGENCY=price_1XXX...

# Public URL (for OAuth callbacks, webhooks)
PUBLIC_BASE_URL=http://localhost:3000

# Optional: S3-compatible storage (if not set, uses local filesystem)
# S3_BUCKET=
# S3_REGION=us-east-1
# S3_ACCESS_KEY=
# S3_SECRET_KEY=

# Optional: Social OAuth (for scheduler)
# TIKTOK_CLIENT_ID=
# TIKTOK_CLIENT_SECRET=
# META_APP_ID=
# META_APP_SECRET=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# LINKEDIN_CLIENT_ID=
# LINKEDIN_CLIENT_SECRET=

# Admin panel credentials
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=securepassword
```

### Installation
```bash
bun install
```

### Development
Start both frontend and backend servers:
```bash
bun run dev
```
This will start:
- Frontend Vite dev server on http://localhost:3000
- Backend Hono server on http://localhost:3001 (proxied by Vite: `/api` is forwarded to the backend)

### Production Build
```bash
bun run build
```
The built assets will be in the `dist/` directory.

### Docker (Optional)
```bash
docker build -t viral-clip-forge .
docker run -p 3000:3000 --env-file .env viral-clip-forge
```

## Project Structure
```
REPURPOSE_FORGE/
├── README.md
├── package.json
├── vite.config.mts
├── tsconfig.json
├── .env.example
├── .gitignore
├── postcss.config.cjs
├── public/
│   └── page-0_5XloeH.jpg
├── src/
│   ├── client/                 # Frontend (Vite + React)
│   │   ├── main.tsx
│   │   ├── app.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   └── api.ts
│   │   ├── components/
│   │   │   ├── layout.tsx
│   │   │   ├── protected-route.tsx
│   │   │   └── runable-badge.tsx
│   │   └── pages/
│   │       ├── landing.tsx
│   │       ├── sign-in.tsx
│   │       ├── sign-up.tsx
│   │       ├── dashboard.tsx
│   │       ├── project-workspace.tsx
│   │       ├── clip-review.tsx
│   │       ├── studio.tsx
│   │       ├── scheduler.tsx
│   │       ├── settings.tsx
│   │       └── pricing.tsx
│   └── server/                 # Backend (Hono + Bun)
│       ├── index.ts
│       ├── auth.ts
│       ├── auth-schema.ts
│       ├── database.ts
│       ├── schema.ts
│       ├── lib/
│       │   ├── gateway.ts
│       │   ├── storage.ts
│       │   ├── video.ts
│       │   ├── queue.ts
│       │   └── ai.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── admin.ts
│       ├── routes/
│       │   ├── projects.ts
│       │   ├── videos.ts
│       │   ├── analysis.ts
│       │   ├── clips.ts
│       │   ├── branding.ts
│       │   ├── scheduler.ts
│       │   └── stripe.ts
│       └── drizzle/
│           └── 0001_init.sql
├── dist/                       # Built output (after bun run build)
└── storage/                    # Local file storage (created at runtime)
```

## API Routes

### Authentication
- `POST /api/auth/sign-up/email` - Register
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get session

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:projectId` - Get project with videos
- `PATCH /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Videos
- `POST /api/videos/:projectId` - Upload video
- `GET /api/videos/:projectId` - List videos
- `GET /api/videos/:projectId/:videoId` - Get video details
- `DELETE /api/videos/:projectId/:videoId` - Delete video

### Analysis
- `POST /api/analysis/:projectId/videos/:videoId` - Start AI analysis
- `GET /api/analysis/:projectId/jobs/:jobId` - Get job status
- `GET /api/analysis/:projectId/clips` - List generated clips

### Clips
- `PATCH /api/clips/:clipId` - Update clip (rating)
- `GET /api/clips/:clipId` - Get clip details
- `POST /api/clips/:clipId/export` - Export clip with formatting
- `GET /api/clips/:clipId/exports/:jobId` - Get export status

### Branding
- `GET /api/branding` - Get brand kit
- `POST /api/branding` - Create/update brand kit
- `DELETE /api/branding` - Delete brand kit

### Scheduler
- `GET /api/scheduler/accounts` - List connected accounts
- `POST /api/scheduler/accounts` - Add/update account
- `DELETE /api/scheduler/accounts/:platform` - Disconnect account
- `GET /api/scheduler/oauth/:platform` - Start OAuth
- `GET /api/scheduler/oauth/:platform/callback` - OAuth callback
- `GET /api/scheduler/posts` - List scheduled posts
- `POST /api/scheduler/posts` - Schedule post
- `DELETE /api/scheduler/posts/:postId` - Delete scheduled post

### Billing
- `GET /api/stripe/plans` - Get plans
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/portal` - Create portal session
- `POST /api/stripe/webhook` - Stripe webhook

## Video Processing Pipeline

1. **Upload**: Video stored locally or to S3
2. **Analysis Job**: Queued, AI analyzes transcript + keywords, returns clip suggestions with hook types
3. **Review**: User rates clips, selects for editing
4. **Studio**: User trims, chooses aspect ratio, enables captions, picks style, adds watermark
5. **Export Job**: FFmpeg re-encodes, burns captions (ASS subtitles), overlays watermark
6. **Schedule**: User connects social accounts via OAuth, drags clips to calendar

## Deployment Notes

- Set `PUBLIC_BASE_URL` to your production URL
- Configure Stripe webhook endpoint to `/api/stripe/webhook`
- Set up OAuth redirect URIs for each platform pointing to `/api/scheduler/oauth/:platform/callback`
- For production, use S3-compatible storage (set S3_* env vars)
- Ensure FFmpeg is installed on the server
- Run behind a reverse proxy (nginx, Caddy) with SSL

## License

MIT