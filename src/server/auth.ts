import { BetterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database";
import { authSchema } from "./auth-schema";

export const auth = BetterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: false,
    sendResetPassword: ({ user, url }) => {
      // Implement your own email sending logic here
      console.log(`Password reset URL for ${user.email}: ${url}`);
      return Promise.resolve();
    },
    sendSignInEmail: ({ user, url }) => {
      // Implement your own email sending logic here
      console.log(`Sign-in URL for ${user.email}: ${url}`);
      return Promise.resolve();
    },
  },
  socialProviders: {}, // Add if needed
  // You can add other plugins like openapi, etc.
});

export type Auth = typeof auth;
