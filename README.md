# RepurposeAI

A content repurposing SaaS that turns one input into 12 platform-native outputs.

## Features

- Convert text content into 12 different formats (X/Twitter, LinkedIn, Instagram, Email Newsletter, YouTube Script, Blog Summary, TikTok Hook, Podcast Intro, Facebook Post, WhatsApp Broadcast, SMS Campaign)
- Brand voice training to make the AI write in your style
- History of all your repurposings
- Admin panel for monitoring usage
- Stripe integration for billing (Free, Pro, Unlimited plans)
- Built with modern web technologies: Vite, React, Hono, Bun, SQLite, Tailwind CSS

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
- Better Auth for authentication (shared with frontend)
- Vercel AI SDK for AI generation (OpenRouter by default, with Ollama/HuggingFace fallbacks)
- Stripe for billing

## Setup

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- [SQLite](https://www.sqlite.org/index.html) (bundled with Bun)
- Optional: [Ollama](https://ollama.ai) for local AI models (if using Ollama provider)

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
STRIPE_PRICE_PRO=price_1XXX...   # Pro monthly
STRIPE_PRICE_UNLIMITED=price_1XXX... # Unlimited monthly

# Optional: Ollama settings (if using local Ollama)
# OLLAMA_HOST=http://localhost:11434
# OLLAMA_MODEL=llama3.1

# Optional: HuggingFace (if using HF inference API)
# HF_API_KEY=
# HF_MODEL=meta-llama/Meta-Llama-3-8B-Instruct

# Feature flags
# ENABLE_STRIPE=true
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
- Backend Hono server on http://localhost:3000 (proxied by Vite)

### Production Build
```bash
bun run build
```
The built assets will be in the `dist/` directory.

### Docker (Optional)
You can also run with Docker:
```bash
docker build -t repurposeai .
docker run -p 3000:3000 repurposeai
```

## Notes

- The AI generation uses OpenRouter's free models by default (`google/gemma-2-9b-it:free`). You can switch to Ollama or HuggingFace by changing the `AI_PROVIDER` environment variable.
- The Stripe integration is set up for test mode. Use test keys from your Stripe dashboard.
- The admin panel is accessible at `/admin` and requires the admin credentials set in `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.
- The project includes a migration script that sets up the database schema on first start.

## Project Structure
```
REPURPOSE_FORGE/
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── index.html
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
│   │       ├── index.tsx
│   │       ├── sign-in.tsx
│   │       ├── sign-up.tsx
│   │       ├── dashboard.tsx
│   │       ├── history.tsx
│   │       ├── settings.tsx
│   │       ├── pricing.tsx
│   │       └── admin.tsx
│   └── server/                 # Backend (Hono + Bun)
│       ├── index.ts
│       ├── auth.ts
│       ├── auth-schema.ts
│       ├── database.ts
│       ├── schema.ts
│       ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── admin.ts
│   │   ├── routes/
│   │   │   ├── repurpose.ts
│   │   │   ├── voice.ts
│   │   │   ├── admin.ts
│   │   │   └── stripe.ts
│   │   └── lib/
│   │       ├── gateway.ts
│   │       ├── repurpose.ts
│   │       └── admin.ts
│   └── drizzle/                # Database migrations
│       └── 0001_init.sql
��── dist/                       # Built output (after bun run build)
```

## Acknowledgments
- Built with inspiration from content creators who need to maximize their reach.
- Uses open-source and free APIs wherever possible to keep costs low during bootstrapping.

