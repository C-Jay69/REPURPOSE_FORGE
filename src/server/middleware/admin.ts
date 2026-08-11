import { createMiddleware } from "hono/factory";
import { HTTPException } from 'hono/http-exception';

export const requireAdmin = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Admin auth required" });
  }
  const token = authHeader.slice(7);
  // Admin token = base64(email:password)
  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64').toString('utf-8');
  } catch {
    throw new HTTPException(401, { message: "Invalid token" });
  }
  const [email, ...rest] = decoded.split(":");
  const password = rest.join(":");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (
    !adminEmail ||
    !adminPassword ||
    email !== adminEmail ||
    password !== adminPassword
  ) {
    throw new HTTPException(403, { message: "Invalid admin credentials" });
  }
  c.set("isAdmin" as any, true);
  return next();
});

export function getAdminToken(): string {
  const email = process.env.ADMIN_EMAIL ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  return btoa(`${email}:${password}`);
}
