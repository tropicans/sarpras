import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "./client.server";
import * as schema from "./schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    tanstackStartCookies()
  ],
  user: {
    fields: {
      role: "role",
      status: "status",
    },
  },
  signUp: {
    enabled: false,
  },
});
export type Auth = typeof auth;
