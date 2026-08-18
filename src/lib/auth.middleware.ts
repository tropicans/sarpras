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
			const u = session.user as any;
			const effectiveRole = resolveEffectiveRole(u);
			if (u.role !== effectiveRole) {
				u.role = effectiveRole;
				await db
					.update(users)
					.set({ role: effectiveRole })
					.where(eq(users.id, u.id));
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

	const user = session.user as any;

	if (user.status === "inactive") {
		throw new Error("Unauthorized");
	}

	user.role = resolveEffectiveRole(user);

	return next({
		context: {
			user,
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

		const user = session.user as any;

		if (user.status === "inactive") {
			throw new Error("Unauthorized");
		}

		const effectiveRole = resolveEffectiveRole(user);
		user.role = effectiveRole;

		if (ROLE_RANK[effectiveRole] < ROLE_RANK[minRole]) {
			throw new Error("Forbidden");
		}

		return next({
			context: {
				user,
				session: session.session,
			},
		});
	});
}
