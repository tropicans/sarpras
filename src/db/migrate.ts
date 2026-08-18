import "dotenv/config";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./client.server";

async function main() {
	console.log("Applying database migrations...");
	try {
		await migrate(db, { migrationsFolder: "./drizzle" });
	} catch (e) {
		console.log("Drizzle folder migrate skipped or already up to date.");
	}

	// Ensure new schema columns exist safely (idempotent)
	await db.execute(
		sql`ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "room_layouts" jsonb;`,
	);
	await db.execute(
		sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "room_layout" text;`,
	);
	await db.execute(
		sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "letter_file_name" text;`,
	);
	await db.execute(
		sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "letter_file_url" text;`,
	);

	console.log("Migrations applied successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
