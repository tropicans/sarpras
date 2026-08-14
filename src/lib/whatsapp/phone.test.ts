import assert from "node:assert";
import test from "node:test";
import { normalizePhoneNumber, sanitizeTarget } from "./phone";

test("WhatsApp Phone Normalization & Target Sanitization (WA-01, WA-02)", async (t) => {
	await t.test("Single phone number normalization", () => {
		// Standard 08... format
		assert.strictEqual(normalizePhoneNumber("081234567890"), "6281234567890");
		// International with plus +628...
		assert.strictEqual(normalizePhoneNumber("+6281234567890"), "6281234567890");
		// Standard 628... format
		assert.strictEqual(normalizePhoneNumber("6281234567890"), "6281234567890");
		// Starting with 8...
		assert.strictEqual(normalizePhoneNumber("81234567890"), "6281234567890");
		// Formatted with spaces, dashes, dots, parentheses
		assert.strictEqual(normalizePhoneNumber("0812-3456-7890"), "6281234567890");
		assert.strictEqual(
			normalizePhoneNumber("+62 (812) 3456.7890"),
			"6281234567890",
		);
		assert.strictEqual(
			normalizePhoneNumber(" 0812 3456 7890 "),
			"6281234567890",
		);
	});

	await t.test("Invalid phone numbers return null", () => {
		// Null / empty / blank
		assert.strictEqual(normalizePhoneNumber(null), null);
		assert.strictEqual(normalizePhoneNumber(""), null);
		assert.strictEqual(normalizePhoneNumber("   "), null);
		// Too short
		assert.strictEqual(normalizePhoneNumber("081234"), null);
		// Too long
		assert.strictEqual(normalizePhoneNumber("0812345678901234567"), null);
		// Landline or non-mobile (021..., 022...)
		assert.strictEqual(normalizePhoneNumber("02112345678"), null);
		// Letters / special characters only
		assert.strictEqual(normalizePhoneNumber("abcdef"), null);
	});

	await t.test("WhatsApp Group ID sanitization", () => {
		assert.strictEqual(sanitizeTarget("120363000@g.us"), "120363000@g.us");
		assert.strictEqual(
			sanitizeTarget("120363123456789-123456@g.us"),
			"120363123456789-123456@g.us",
		);
		assert.strictEqual(sanitizeTarget("  120363000@g.us  "), "120363000@g.us");
	});

	await t.test("Comma-separated target list sanitization", () => {
		assert.strictEqual(
			sanitizeTarget("081234567890, +628987654321"),
			"6281234567890,628987654321",
		);
		assert.strictEqual(
			sanitizeTarget("081234567890, invalid_phone, 089876543210"),
			"6281234567890,6289876543210",
		);
		assert.strictEqual(
			sanitizeTarget("120363000@g.us, 081234567890"),
			"120363000@g.us,6281234567890",
		);
		assert.strictEqual(sanitizeTarget("invalid1, invalid2"), null);
	});
});
