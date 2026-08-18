import assert from "node:assert";
import test from "node:test";
import { auth } from "../../db/auth.server";

test("Two-Factor Authentication allows passwordless / OAuth users to enable 2FA", () => {
	const options = (auth as any).options;
	assert.ok(options, "Better Auth options must exist");

	const plugins = options.plugins || [];
	const twoFactorPlugin = plugins.find((p: any) => p.id === "two-factor");
	assert.ok(twoFactorPlugin, "twoFactor plugin must be registered in Better Auth");

	// To enable 2FA for Google OAuth / passwordless users without 400 Bad Request error,
	// Better Auth requires allowPasswordless: true in twoFactor plugin options.
	assert.strictEqual(
		twoFactorPlugin.options?.allowPasswordless,
		true,
		"twoFactor plugin must have allowPasswordless: true to support Google OAuth / passwordless users enabling 2FA",
	);
});
