import assert from "node:assert";
import test from "node:test";
import { auth } from "../../db/auth.server";

test("OAuth Account Linking Configuration Test", () => {
	// Better Auth options should have account linking enabled with Google as a trusted provider
	const options = (auth as any).options;
	assert.ok(options, "Better Auth options must exist");
	assert.ok(
		options.account?.accountLinking?.enabled,
		"account.accountLinking.enabled must be true to allow pre-registered whitelist users to login with Google",
	);
	assert.ok(
		options.account?.accountLinking?.trustedProviders?.includes("google"),
		"account.accountLinking.trustedProviders must include 'google'",
	);
});
