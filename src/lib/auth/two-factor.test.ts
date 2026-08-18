import assert from "node:assert";
import test from "node:test";
import { auth } from "../../db/auth.server";
import { twoFactors, users } from "../../db/schema";

test("Two-Factor Authentication (TOTP) Server Configuration & Schema Tests", () => {
	const options = (auth as any).options;
	assert.ok(options, "Better Auth options must exist");

	// 1. Verify twoFactor plugin is registered
	const plugins = options.plugins || [];
	const twoFactorPlugin = plugins.find((p: any) => p.id === "two-factor");
	assert.ok(
		twoFactorPlugin,
		"twoFactor plugin must be registered in Better Auth",
	);

	// 2. Verify issuer and allowPasswordless are configured
	assert.strictEqual(
		twoFactorPlugin.options?.issuer,
		"SARPRAS PPKASN",
		"twoFactor issuer should be 'SARPRAS PPKASN'",
	);
	assert.strictEqual(
		twoFactorPlugin.options?.allowPasswordless,
		true,
		"twoFactor allowPasswordless should be true to support OAuth / passwordless 2FA enablement",
	);

	// 3. Verify two_factor schema table definition
	assert.ok(twoFactors, "twoFactors schema table must be defined");
	assert.ok(twoFactors.secret, "twoFactors.secret column must exist");
	assert.ok(twoFactors.backupCodes, "twoFactors.backupCodes column must exist");
	assert.ok(twoFactors.userId, "twoFactors.userId column must exist");

	// 4. Verify twoFactorEnabled column on users table
	assert.ok(
		users.twoFactorEnabled,
		"users.twoFactorEnabled column must exist in schema",
	);
});
