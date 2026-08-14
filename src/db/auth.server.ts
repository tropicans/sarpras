import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "./client.server";
import * as schema from "./schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	plugins: [tanstackStartCookies()],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					},
				}
			: {}),
	},
	user: {
		fields: {
			role: "role",
			status: "status",
			mustResetPassword: "must_reset_password",
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const adminEmails = (
						process.env.ADMIN_DEFAULT_EMAIL || "admin@ppkasn.go.id"
					)
						.split(",")
						.map((e) => e.trim().toLowerCase());
					const isAdmin = adminEmails.includes(user.email.toLowerCase());
					return {
						data: {
							...user,
							role: isAdmin ? "admin" : user.role || "operator",
							status: "active",
						},
					};
				},
			},
		},
	},
	signUp: {
		enabled: false,
	},
});
export type Auth = typeof auth;
