import assert from "node:assert";
import test from "node:test";
import { ROLE_RANK, resolveEffectiveRole } from "./role-helper";

test("Role-Based Access Control (RBAC) Logic Tests", async (t) => {
	await t.test("Role Hierarchy Rank Assertions", () => {
		assert.strictEqual(ROLE_RANK.admin, 3);
		assert.strictEqual(ROLE_RANK.operator, 2);
		assert.strictEqual(ROLE_RANK.pimpinan, 1);

		// Assert ranks relative to each other
		assert.ok(ROLE_RANK.admin > ROLE_RANK.operator);
		assert.ok(ROLE_RANK.operator > ROLE_RANK.pimpinan);
		assert.ok(ROLE_RANK.admin > ROLE_RANK.pimpinan);
	});

	await t.test("resolveEffectiveRole resolution rules", () => {
		// Default admin email should resolve to admin role regardless of user's DB role
		const adminDefault = resolveEffectiveRole({
			email: "admin@ppkasn.go.id",
			role: "operator",
		});
		assert.strictEqual(adminDefault, "admin");

		// Non-default emails should resolve to their DB role
		const operatorUser = resolveEffectiveRole({
			email: "operator1@ppkasn.go.id",
			role: "operator",
		});
		assert.strictEqual(operatorUser, "operator");

		const pimpinanUser = resolveEffectiveRole({
			email: "pimpinan1@ppkasn.go.id",
			role: "pimpinan",
		});
		assert.strictEqual(pimpinanUser, "pimpinan");

		// Missing/unrecognized role should fallback to operator
		const unknownUser = resolveEffectiveRole({
			email: "guest@ppkasn.go.id",
			role: "invalid-role" as any,
		});
		assert.strictEqual(unknownUser, "operator");

		const noRoleUser = resolveEffectiveRole({
			email: "guest2@ppkasn.go.id",
			role: null,
		});
		assert.strictEqual(noRoleUser, "operator");
	});

	await t.test("Mock Role Middleware Rank Checking Logic", () => {
		const checkRoleAccess = (userRole: string, minRole: string): boolean => {
			const resolvedUserRole = resolveEffectiveRole({
				email: "test@example.com",
				role: userRole,
			});
			const userRank = ROLE_RANK[resolvedUserRole];
			const minRank = ROLE_RANK[minRole as keyof typeof ROLE_RANK];
			return userRank >= minRank;
		};

		// Admin role checks
		assert.strictEqual(checkRoleAccess("admin", "admin"), true);
		assert.strictEqual(checkRoleAccess("admin", "operator"), true);
		assert.strictEqual(checkRoleAccess("admin", "pimpinan"), true);

		// Operator role checks
		assert.strictEqual(checkRoleAccess("operator", "admin"), false);
		assert.strictEqual(checkRoleAccess("operator", "operator"), true);
		assert.strictEqual(checkRoleAccess("operator", "pimpinan"), true);

		// Pimpinan role checks
		assert.strictEqual(checkRoleAccess("pimpinan", "admin"), false);
		assert.strictEqual(checkRoleAccess("pimpinan", "operator"), false);
		assert.strictEqual(checkRoleAccess("pimpinan", "pimpinan"), true);
	});
});
