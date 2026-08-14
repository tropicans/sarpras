import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { toDate } from "date-fns-tz";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./client.server";
import { accounts, assets, auditLogs, bookings, users } from "./schema";

// --- Zod Validation Schemas ---

const LegacyAssetSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	type: z.enum(["room", "dormitory"]),
	location: z.string().optional().nullable(),
	capacity: z.number().int().positive(),
	bookable: z.boolean().default(true),
});

const LegacyAdminSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	email: z.string().email(),
	password_hash: z.string().min(1),
	role: z.string().default("operator"),
	status: z.enum(["active", "inactive"]).default("active"),
});

const LegacyBookingSchema = z.object({
	id: z.string(),
	asset_id: z.string(),
	requester_name: z.string().min(1),
	requester_email: z.string().email(),
	requester_phone: z.string().optional().nullable(),
	requester_organization: z.string().optional().nullable(),
	purpose: z.string().optional().nullable(),
	attendance: z.number().int().nonnegative().optional().nullable(),
	start_date: z.string(),
	end_date: z.string(),
	status: z.enum(["pending", "approved", "rejected", "cancelled"]),
	rejection_reason: z.string().optional().nullable(),
	created_at: z.string().optional().nullable(),
	updated_at: z.string().optional().nullable(),
});

type LegacyAsset = z.infer<typeof LegacyAssetSchema>;
type LegacyAdmin = z.infer<typeof LegacyAdminSchema>;
type LegacyBooking = z.infer<typeof LegacyBookingSchema>;

// --- Helper: Redact sensitive information ---
function redactSensitive(obj: any): any {
	const result = { ...obj };
	if (result.password_hash) result.password_hash = "[REDACTED]";
	if (result.password) result.password = "[REDACTED]";
	return result;
}

// --- Main Migration Logic ---

async function main() {
	const legacyDataDir = path.join(process.cwd(), "legacy-data");
	const assetsFile = path.join(legacyDataDir, "legacy_assets.json");
	const adminsFile = path.join(legacyDataDir, "legacy_admins.json");
	const bookingsFile = path.join(legacyDataDir, "legacy_bookings.json");

	console.log("Starting legacy data migration...");

	// Verify legacy folder and files exist
	if (!fs.existsSync(legacyDataDir)) {
		console.error(
			`Error: Directory 'legacy-data' does not exist in workspace root.`,
		);
		process.exit(1);
	}

	// Load and parse JSON helpers
	const loadJSON = (filePath: string): any[] => {
		if (!fs.existsSync(filePath)) {
			console.warn(
				`Warning: File '${path.basename(filePath)}' not found. Skipping.`,
			);
			return [];
		}
		try {
			const content = fs.readFileSync(filePath, "utf-8");
			return JSON.parse(content);
		} catch (e: any) {
			console.error(`Error reading ${path.basename(filePath)}:`, e.message);
			return [];
		}
	};

	const rawAssets = loadJSON(assetsFile);
	const rawAdmins = loadJSON(adminsFile);
	const rawBookings = loadJSON(bookingsFile);

	const stats = {
		assets: {
			total: rawAssets.length,
			imported: 0,
			skipped: 0,
			rejected: 0,
			errors: [] as string[],
		},
		admins: {
			total: rawAdmins.length,
			imported: 0,
			skipped: 0,
			rejected: 0,
			errors: [] as string[],
		},
		bookings: {
			total: rawBookings.length,
			imported: 0,
			skipped: 0,
			rejected: 0,
			errors: [] as string[],
		},
	};

	const migrationBatchId = `batch-${Date.now()}`;

	// 1. Migrate Assets
	for (const rawAsset of rawAssets) {
		try {
			const parsed = LegacyAssetSchema.safeParse(rawAsset);
			if (!parsed.success) {
				stats.assets.rejected++;
				stats.assets.errors.push(
					`Asset ${rawAsset.id || "unknown"}: Validation failed - ${parsed.error.message}`,
				);
				continue;
			}

			const assetData = parsed.data;

			// Idempotency check: check if already exists
			const existing = await db
				.select()
				.from(assets)
				.where(eq(assets.legacyId, assetData.id))
				.limit(1);

			if (existing.length > 0) {
				stats.assets.skipped++;
				continue;
			}

			// Insert asset
			await db.transaction(async (tx) => {
				const newAsset = await tx
					.insert(assets)
					.values({
						name: assetData.name,
						type: assetData.type,
						location: assetData.location,
						capacity: assetData.capacity,
						status: assetData.bookable ? "active" : "inactive",
						legacyId: assetData.id,
					})
					.returning();

				// Write audit log
				await tx.insert(auditLogs).values({
					actorId: "system:migration",
					actorType: "system",
					action: "migration.import",
					entityType: "asset",
					entityId: newAsset[0].id,
					metadata: {
						migrationBatchId,
						legacyData: redactSensitive(assetData),
					},
				});
			});

			stats.assets.imported++;
		} catch (e: any) {
			stats.assets.rejected++;
			stats.assets.errors.push(
				`Asset ${rawAsset.id || "unknown"}: Exception - ${e.message}`,
			);
		}
	}

	// 2. Migrate Admins/Users
	for (const rawAdmin of rawAdmins) {
		try {
			const parsed = LegacyAdminSchema.safeParse(rawAdmin);
			if (!parsed.success) {
				stats.admins.rejected++;
				stats.admins.errors.push(
					`Admin ${rawAdmin.id || "unknown"}: Validation failed - ${parsed.error.message}`,
				);
				continue;
			}

			const adminData = parsed.data;

			// Idempotency check
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.legacyId, adminData.id))
				.limit(1);

			const existingEmail = await db
				.select()
				.from(users)
				.where(eq(users.email, adminData.email))
				.limit(1);

			if (existingUser.length > 0 || existingEmail.length > 0) {
				stats.admins.skipped++;
				continue;
			}

			// Insert User and Account details in transaction
			await db.transaction(async (tx) => {
				// Better Auth mapping id is string
				const targetUserId = `migrated-${adminData.id}`;

				await tx.insert(users).values({
					id: targetUserId,
					name: adminData.name,
					email: adminData.email,
					emailVerified: true,
					role: adminData.role,
					status: adminData.status,
					mustResetPassword: true,
					legacyId: adminData.id,
				});

				// Insert credentials account row
				await tx.insert(accounts).values({
					id: `account-${adminData.id}`,
					accountId: "credential",
					providerId: "credential",
					userId: targetUserId,
					password: adminData.password_hash,
				});

				// Write audit log
				await tx.insert(auditLogs).values({
					actorId: "system:migration",
					actorType: "system",
					action: "migration.import",
					entityType: "user",
					entityId: targetUserId,
					metadata: {
						migrationBatchId,
						legacyData: redactSensitive(adminData),
					},
				});
			});

			stats.admins.imported++;
		} catch (e: any) {
			stats.admins.rejected++;
			stats.admins.errors.push(
				`Admin ${rawAdmin.id || "unknown"}: Exception - ${e.message}`,
			);
		}
	}

	// Load imported assets map for quick lookup
	const dbAssets = await db.select().from(assets);
	const assetLegacyMap = new Map<string, string>(); // legacyId -> canonical uuid
	for (const asset of dbAssets) {
		if (asset.legacyId) {
			assetLegacyMap.set(asset.legacyId, asset.id);
		}
	}

	// 3. Migrate Bookings
	for (const rawBooking of rawBookings) {
		try {
			const parsed = LegacyBookingSchema.safeParse(rawBooking);
			if (!parsed.success) {
				stats.bookings.rejected++;
				stats.bookings.errors.push(
					`Booking ${rawBooking.id || "unknown"}: Validation failed - ${parsed.error.message}`,
				);
				continue;
			}

			const bookingData = parsed.data;

			// Check asset mapping
			const canonicalAssetId = assetLegacyMap.get(bookingData.asset_id);
			if (!canonicalAssetId) {
				stats.bookings.rejected++;
				stats.bookings.errors.push(
					`Booking ${bookingData.id}: Refused - Legacy asset ID '${bookingData.asset_id}' has no migrated target`,
				);
				continue;
			}

			// Idempotency check
			const existing = await db
				.select()
				.from(bookings)
				.where(eq(bookings.legacyId, bookingData.id))
				.limit(1);

			if (existing.length > 0) {
				stats.bookings.skipped++;
				continue;
			}

			// Parse dates explicitly in Asia/Jakarta timezone
			const startDateZoned = toDate(bookingData.start_date, {
				timeZone: "Asia/Jakarta",
			});
			const endDateZoned = toDate(bookingData.end_date, {
				timeZone: "Asia/Jakarta",
			});

			if (
				Number.isNaN(startDateZoned.getTime()) ||
				Number.isNaN(endDateZoned.getTime())
			) {
				stats.bookings.rejected++;
				stats.bookings.errors.push(
					`Booking ${bookingData.id}: Date parsing exception - Start: ${bookingData.start_date}, End: ${bookingData.end_date}`,
				);
				continue;
			}

			// Insert Booking
			await db.transaction(async (tx) => {
				const newBooking = await tx
					.insert(bookings)
					.values({
						assetId: canonicalAssetId,
						requesterName: bookingData.requester_name,
						requesterEmail: bookingData.requester_email,
						requesterPhone: bookingData.requester_phone,
						requesterOrganization: bookingData.requester_organization,
						purpose: bookingData.purpose,
						attendance: bookingData.attendance,
						startDate: startDateZoned,
						endDate: endDateZoned,
						timezone: "Asia/Jakarta",
						status: bookingData.status,
						rejectionReason: bookingData.rejection_reason,
						legacyId: bookingData.id,
						createdAt: bookingData.created_at
							? toDate(bookingData.created_at, { timeZone: "Asia/Jakarta" })
							: undefined,
						updatedAt: bookingData.updated_at
							? toDate(bookingData.updated_at, { timeZone: "Asia/Jakarta" })
							: undefined,
					})
					.returning();

				// Write audit log
				await tx.insert(auditLogs).values({
					actorId: "system:migration",
					actorType: "system",
					action: "migration.import",
					entityType: "booking",
					entityId: newBooking[0].id,
					metadata: {
						migrationBatchId,
						legacyData: redactSensitive(bookingData),
					},
				});
			});

			stats.bookings.imported++;
		} catch (e: any) {
			stats.bookings.rejected++;
			stats.bookings.errors.push(
				`Booking ${rawBooking.id || "unknown"}: Exception - ${e.message}`,
			);
		}
	}

	// --- Print Reconciliation Report (Structured CLI ASCII Table) ---

	const lineSeparator =
		"+-------------------+-------------+--------------+--------------+--------------+";
	console.log("\nLEGACY MIGRATION RECONCILIATION REPORT");
	console.log(lineSeparator);
	console.log(
		"| Entity            | Source Count| Imported     | Skipped      | Rejected     |",
	);
	console.log(lineSeparator);
	console.log(
		`| Assets            | ${stats.assets.total.toString().padEnd(12)}| ${stats.assets.imported.toString().padEnd(13)}| ${stats.assets.skipped.toString().padEnd(13)}| ${stats.assets.rejected.toString().padEnd(13)}|`,
	);
	console.log(
		`| Admins            | ${stats.admins.total.toString().padEnd(12)}| ${stats.admins.imported.toString().padEnd(13)}| ${stats.admins.skipped.toString().padEnd(13)}| ${stats.admins.rejected.toString().padEnd(13)}|`,
	);
	console.log(
		`| Bookings          | ${stats.bookings.total.toString().padEnd(12)}| ${stats.bookings.imported.toString().padEnd(13)}| ${stats.bookings.skipped.toString().padEnd(13)}| ${stats.bookings.rejected.toString().padEnd(13)}|`,
	);
	console.log(lineSeparator);

	// Print exceptions if any
	const allErrors = [
		...stats.assets.errors,
		...stats.admins.errors,
		...stats.bookings.errors,
	];

	if (allErrors.length > 0) {
		console.log("\nMIGRATION EXCEPTION DETAILS");
		console.log("===========================");
		for (const err of allErrors) {
			console.log(`- ${err}`);
		}
	} else {
		console.log("\nMigration completed with zero exceptions.");
	}

	process.exit(0);
}

main().catch((err) => {
	console.error("Migration fatal error:", err);
	process.exit(1);
});
