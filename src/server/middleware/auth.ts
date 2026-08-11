import { HttpException } from "hono/http-exception";
import { auth } from "../auth";

export const authMiddleware = async (c, next) => {
  const session = await auth.api.getSession({
    header: c.req.header("Authorization") ?? "",
    cookie: c.req.header("Cookie") ?? "",
  });

  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
    await next();
  } else {
    // If the route is not public, we should return 401
    // We'll check if the path is in the public routes (like /api/auth/*)
    const path = c.req.path;
    if (path.startsWith("/api/auth/")) {
      await next();
    } else {
      throw new HttpException(401, "Unauthorized");
    }
  }
};
