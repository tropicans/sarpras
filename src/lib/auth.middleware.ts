import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/db/auth.server";

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  return session;
});

export const authMiddleware = createMiddleware().register({
  before: async ({ next }) => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw new Error("Unauthorized");
    }

    if (session.user.status === "inactive") {
      throw new Error("Unauthorized");
    }

    return next({
      context: {
        user: session.user,
        session: session.session,
      },
    });
  },
});

const ROLE_RANK = {
  admin: 3,
  operator: 2,
  pimpinan: 1,
} as const;

export function requireMinRole(minRole: "admin" | "operator" | "pimpinan") {
  return createMiddleware().register({
    before: async ({ next }) => {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session) {
        throw new Error("Unauthorized");
      }

      if (session.user.status === "inactive") {
        throw new Error("Unauthorized");
      }

      const userRole = (session.user.role || "operator") as "admin" | "operator" | "pimpinan";
      if (ROLE_RANK[userRole] < ROLE_RANK[minRole]) {
        throw new Error("Forbidden");
      }

      return next({
        context: {
          user: session.user,
          session: session.session,
        },
      });
    },
  });
}
