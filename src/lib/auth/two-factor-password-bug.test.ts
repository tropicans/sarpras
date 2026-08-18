import assert from "node:assert";
import test from "node:test";
import { eq } from "drizzle-orm";
import { auth } from "../../db/auth.server";
import { db } from "../../db/client.server";
import { accounts, sessions, twoFactors, users } from "../../db/schema";

async function createSignedSessionHeader(
	token: string,
	secret: string,
): Promise<Headers> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(token),
	);
	const cookieVal = encodeURIComponent(
		`${token}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`,
	);
	return new Headers({
		cookie: `better-auth.session_token=${cookieVal}`,
	});
}

test("Two-Factor Authentication: Auto-cleanup of legacy passwords and passwordless Google OAuth 2FA flow", async () => {
	const testUserId = `test-2fa-user-${Date.now()}`;
	const testEmail = `test2fa-${Date.now()}@ppkasn.gov.id`;
	const authCtx = await (auth as any).$context;

	try {
		// 1. Create a test user with active status
		await db.insert(users).values({
			id: testUserId,
			name: "Test User 2FA",
			email: testEmail,
			emailVerified: true,
			role: "admin",
			status: "active",
			mustResetPassword: false,
		});

		// 2. Insert a legacy credential account row with a password (as from old migration)
		const hashedPassword = await authCtx.password.hash(
			"hashed_legacy_password_123",
		);
		await db.insert(accounts).values({
			id: `acc-${testUserId}`,
			accountId: "credential",
			providerId: "credential",
			userId: testUserId,
			password: hashedPassword,
		});

		// 3. User signs in (session created) -> session.create.before hook cleanses legacy password
		const session = await authCtx.internalAdapter.createSession(
			testUserId,
			false,
		);
		const headers = await createSignedSessionHeader(
			session.token,
			authCtx.secret,
		);

		// Verify that the account password was automatically sanitized to null
		const [acc] = await db
			.select()
			.from(accounts)
			.where(eq(accounts.userId, testUserId));
		assert.strictEqual(
			acc.password,
			null,
			"Account password should be nullified by session.create hook",
		);

		// 4. enableTwoFactor succeeds without password prompt/error
		const enableRes = await auth.api.enableTwoFactor({
			headers,
			body: {},
		});

		assert.ok(enableRes, "enableTwoFactor should return response");
		assert.ok(enableRes.totpURI, "enableTwoFactor should return valid totpURI");
		assert.ok(
			enableRes.totpURI.includes("SARPRAS"),
			"totpURI must contain issuer SARPRAS",
		);
		assert.ok(
			Array.isArray(enableRes.backupCodes) && enableRes.backupCodes.length > 0,
			"enableTwoFactor should return generated backupCodes",
		);

		// Verify two_factor database record has verified=false before verification
		const [tfRecord] = await db
			.select()
			.from(twoFactors)
			.where(eq(twoFactors.userId, testUserId));
		assert.ok(tfRecord, "twoFactor record must exist in database");
		assert.strictEqual(
			tfRecord.verified,
			false,
			"verified must be false initially",
		);

		// 5. disableTwoFactor also succeeds without password
		const disableRes = await auth.api.disableTwoFactor({
			headers,
			body: {},
		});
		assert.strictEqual(
			disableRes.status,
			true,
			"disableTwoFactor should successfully disable 2FA without password",
		);
	} finally {
		// Cleanup test data
		await db.delete(twoFactors).where(eq(twoFactors.userId, testUserId));
		await db.delete(sessions).where(eq(sessions.userId, testUserId));
		await db.delete(accounts).where(eq(accounts.userId, testUserId));
		await db.delete(users).where(eq(users.id, testUserId));
	}
});
