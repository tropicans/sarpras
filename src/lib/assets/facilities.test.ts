import assert from "node:assert";
import test from "node:test";
import {
	CATEGORY_FACILITY_PRESETS,
	getAssetFacilities,
	sanitizeFacilities,
} from "./facilities";

test("Facility Tag Sanitization & Fallback Resolver", async (t) => {
	await t.test("sanitizeFacilities: handles dirty inputs, non-arrays, and invalid elements", () => {
		assert.deepStrictEqual(sanitizeFacilities(null), []);
		assert.deepStrictEqual(sanitizeFacilities(undefined), []);
		assert.deepStrictEqual(sanitizeFacilities("not-an-array"), []);
		assert.deepStrictEqual(sanitizeFacilities(123), []);
		assert.deepStrictEqual(
			sanitizeFacilities(["  AC Dingin  ", "", null, 42, "  Wi-Fi 5G  "]),
			["AC Dingin", "Wi-Fi 5G"],
		);
	});

	await t.test("sanitizeFacilities: case-insensitive deduplication and trimming", () => {
		const input = ["Proyektor", "  proyektor  ", "PROYEKTOR", "Sound System"];
		const sanitized = sanitizeFacilities(input);
		assert.deepStrictEqual(sanitized, ["Proyektor", "Sound System"]);
	});

	await t.test("sanitizeFacilities: enforces length limits per tag and total tag caps", () => {
		const longTag = "A".repeat(60);
		const sanitized = sanitizeFacilities([longTag]);
		assert.strictEqual(sanitized[0].length, 40);

		const manyTags = Array.from({ length: 30 }, (_, i) => `Fasilitas ${i + 1}`);
		const capped = sanitizeFacilities(manyTags);
		assert.strictEqual(capped.length, 20);
		assert.strictEqual(capped[0], "Fasilitas 1");
		assert.strictEqual(capped[19], "Fasilitas 20");
	});

	await t.test("getAssetFacilities: returns custom sanitized facilities when present", () => {
		const custom = ["Smart TV 75\"", "Mic Wireless", "Papan Tulis"];
		const result = getAssetFacilities({
			type: "room",
			facilities: custom,
		});
		assert.deepStrictEqual(result, custom);
	});

	await t.test("getAssetFacilities: falls back to category defaults when facilities is null, undefined, or empty", () => {
		assert.deepStrictEqual(
			getAssetFacilities({ type: "room", facilities: null }),
			CATEGORY_FACILITY_PRESETS.room,
		);
		assert.deepStrictEqual(
			getAssetFacilities({ type: "room", facilities: [] }),
			CATEGORY_FACILITY_PRESETS.room,
		);
		assert.deepStrictEqual(
			getAssetFacilities({ type: "dormitory", facilities: undefined }),
			CATEGORY_FACILITY_PRESETS.dormitory,
		);
		assert.deepStrictEqual(
			getAssetFacilities({ type: "vehicle" }),
			CATEGORY_FACILITY_PRESETS.vehicle,
		);
		assert.deepStrictEqual(
			getAssetFacilities({ type: "field" }),
			CATEGORY_FACILITY_PRESETS.field,
		);
		assert.deepStrictEqual(
			getAssetFacilities({ type: "equipment" }),
			CATEGORY_FACILITY_PRESETS.equipment,
		);
	});

	await t.test("getAssetFacilities: falls back to room defaults if unknown asset type is encountered", () => {
		assert.deepStrictEqual(
			getAssetFacilities({ type: "unknown_type", facilities: null }),
			CATEGORY_FACILITY_PRESETS.room,
		);
	});
});
