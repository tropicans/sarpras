import "dotenv/config";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./client.server";

export async function runMigrations() {
	console.log("Applying database migrations...");
	try {
		await migrate(db, { migrationsFolder: "./drizzle" });
	} catch (e) {
		console.log("Drizzle folder migrate note:", (e as Error).message);
	}

	// Ensure new schema columns exist safely (idempotent)
	await db.execute(
		sql`ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "room_layouts" jsonb;`,
	);
	await db.execute(
		sql`ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "facilities" jsonb;`,
	);
	await db.execute(
		sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "room_layout" text;`,
	);
	await db.execute(
		sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "group_id" text;`,
	);
	await db.execute(
		sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "letter_file_name" text;`,
	);
	await db.execute(
		sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "letter_file_url" text;`,
	);
	await db.execute(
		sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false NOT NULL;`,
	);
	await db.execute(
		sql`CREATE TABLE IF NOT EXISTS "two_factor" (
			"id" text PRIMARY KEY NOT NULL,
			"secret" text NOT NULL,
			"backup_codes" text NOT NULL,
			"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
			"verified" boolean DEFAULT false,
			"failed_verification_count" integer DEFAULT 0,
			"locked_until" timestamp with time zone
		);`,
	);
	await db.execute(
		sql`ALTER TABLE "two_factor" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false;`,
	);
	await db.execute(
		sql`ALTER TABLE "two_factor" ADD COLUMN IF NOT EXISTS "failed_verification_count" integer DEFAULT 0;`,
	);
	await db.execute(
		sql`ALTER TABLE "two_factor" ADD COLUMN IF NOT EXISTS "locked_until" timestamp with time zone;`,
	);
	// Nullify obsolete credential passwords to ensure Google OAuth SSO accounts can seamlessly enable/disable 2FA without password prompt
	await db.execute(
		sql`UPDATE "account" SET "password" = NULL WHERE "password" IS NOT NULL;`,
	);

	console.log("Migrations applied successfully!");
}

if (
	process.argv[1]?.endsWith("migrate.ts") ||
	process.argv[1]?.endsWith("migrate.js")
) {
	runMigrations()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Migration failed:", err);
			process.exit(1);
		});
}
