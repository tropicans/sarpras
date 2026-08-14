import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./client.server";

async function main() {
	console.log("Applying database migrations...");
	await migrate(db, { migrationsFolder: "./drizzle" });
	console.log("Migrations applied successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
