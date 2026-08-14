import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { auth } from "../db/auth.server";
import { db } from "../db/client.server";
import { users } from "../db/schema";
import {
	ROLE_RANK,
	resolveEffectiveRole,
	type UserRole,
} from "./auth/role-helper";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (session?.user) {
			const effectiveRole = resolveEffectiveRole(session.user);
			if (session.user.role !== effectiveRole) {
				session.user.role = effectiveRole;
				await db
					.update(users)
					.set({ role: effectiveRole })
					.where(eq(users.id, session.user.id));
			}
		}
		return session;
	},
);

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session) {
		throw new Error("Unauthorized");
	}

	if (session.user.status === "inactive") {
		throw new Error("Unauthorized");
	}

	session.user.role = resolveEffectiveRole(session.user);

	return next({
		context: {
			user: session.user,
			session: session.session,
		},
	});
});

export function requireMinRole(minRole: UserRole) {
	return createMiddleware().server(async ({ next }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw new Error("Unauthorized");
		}

		if (session.user.status === "inactive") {
			throw new Error("Unauthorized");
		}

		const effectiveRole = resolveEffectiveRole(session.user);
		session.user.role = effectiveRole;

		if (ROLE_RANK[effectiveRole] < ROLE_RANK[minRole]) {
			throw new Error("Forbidden");
		}

		return next({
			context: {
				user: session.user,
				session: session.session,
			},
		});
	});
}
