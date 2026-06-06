import { createMiddleware } from "hono/factory";

export const requireAdmin = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Admin auth required" }, 401);
  }
  const token = authHeader.slice(7);
  // Admin token = base64(email:password)
  const decoded = atob(token);
  const [email, ...rest] = decoded.split(":");
  const password = rest.join(":");
  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return c.json({ error: "Invalid admin credentials" }, 403);
  }
  c.set("isAdmin" as any, true);
  return next();
});

export function getAdminToken(): string {
  const email = process.env.ADMIN_EMAIL ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  return btoa(`${email}:${password}`);
}
