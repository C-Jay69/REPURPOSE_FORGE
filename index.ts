import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { authMiddleware } from "./middleware/auth";
import { repurposeRoutes } from "./routes/repurpose";
import { voiceRoutes } from "./routes/voice";
import { adminRoutes } from "./routes/admin";

declare module "hono" {
  interface ContextVariableMap {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  }
}

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .use("*", authMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .get("/me", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ user: null }, 200);
    return c.json({ user }, 200);
  })
  .route("/repurpose", repurposeRoutes)
  .route("/voice", voiceRoutes)
  .route("/admin", adminRoutes);

export type AppType = typeof app;
export default app;
