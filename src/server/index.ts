import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';
import { authMiddleware } from './middleware/auth';
import { startJobQueue } from './lib/queue';
import projectsRoutes from './routes/projects';
import videosRoutes from './routes/videos';
import analysisRoutes from './routes/analysis';
import clipsRoutes from './routes/clips';
import brandingRoutes from './routes/branding';
import schedulerRoutes from './routes/scheduler';
import stripeRoutes from './routes/stripe';
import { storage } from './lib/storage';

declare module 'hono' {
  interface ContextVariableMap {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  }
}

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("/api")
  .use("*", authMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .get("/me", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ user: null }, 200);
    return c.json({ user }, 200);
  })
  .route("/projects", projectsRoutes)
  .route("/videos", videosRoutes)
  .route("/analysis", analysisRoutes)
  .route("/clips", clipsRoutes)
  .route("/branding", brandingRoutes)
  .route("/scheduler", schedulerRoutes)
  .route("/stripe", stripeRoutes)
  .get("/files/*", async (c) => {
    const key = c.req.param("*");
    const data = await storage.get(key);
    if (!data) return c.json({ error: "Not found" }, 404);
    return new Response(data, { headers: { "Content-Type": "application/octet-stream" } });
  });

startJobQueue();

export type AppType = typeof app;
export default app;