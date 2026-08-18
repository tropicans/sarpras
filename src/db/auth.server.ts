import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { twoFactor } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { eq } from "drizzle-orm";
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
			twoFactor: schema.twoFactors,
		},
	}),
	plugins: [
		tanstackStartCookies(),
		twoFactor({
			issuer: "SARPRAS PPKASN",
			allowPasswordless: true,
		}),
	],
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google"],
			requireLocalEmailVerified: false,
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
						disableSignUp: true,
						disableImplicitSignUp: true,
					},
				}
			: {}),
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "operator",
			},
			status: {
				type: "string",
				required: false,
				defaultValue: "active",
			},
			mustResetPassword: {
				type: "boolean",
				required: false,
				defaultValue: false,
			},
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

					// Check if this email was already registered in the database by Administrator
					const existing = await db
						.select()
						.from(schema.users)
						.where(eq(schema.users.email, user.email.toLowerCase()))
						.limit(1);

					if (existing.length === 0 && !isAdmin) {
						throw new APIError("FORBIDDEN", {
							message:
								"Akun Google ini belum didaftarkan di sistem. Silakan hubungi Administrator untuk mendaftarkan email Anda.",
						});
					}

					return {
						data: {
							...user,
							role: isAdmin ? "admin" : (user as any).role || "operator",
							status: "active",
						},
					};
				},
			},
		},
		session: {
			create: {
				before: async (session) => {
					const [userRecord] = await db
						.select()
						.from(schema.users)
						.where(eq(schema.users.id, session.userId))
						.limit(1);

					if (!userRecord || userRecord.status !== "active") {
						throw new APIError("FORBIDDEN", {
							message:
								"Akun Anda tidak aktif atau belum terdaftar. Silakan hubungi Administrator.",
						});
					}

					return { data: session };
				},
			},
		},
	},
	signUp: {
		enabled: false,
	},
});
export type Auth = typeof auth;
