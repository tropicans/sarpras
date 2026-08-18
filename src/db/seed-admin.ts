import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./client.server";
import { users } from "./schema";

async function seedAdmin() {
	console.log("Seeding Google OAuth admin accounts...");

	const adminEmail = (
		process.env.ADMIN_DEFAULT_EMAIL || "admin@ppkasn.go.id"
	).trim().toLowerCase();

	// Check if admin already exists in whitelist
	const existing = await db
		.select()
		.from(users)
		.where(eq(users.email, adminEmail))
		.limit(1);

	if (existing.length === 0) {
		await db.insert(users).values({
			id: crypto.randomUUID(),
			name: "Admin Utama (Google)",
			email: adminEmail,
			emailVerified: true,
			role: "admin",
			status: "active",
			mustResetPassword: false,
		});

		console.log(`✅ Berhasil mendaftarkan whitelist Google Admin: ${adminEmail}`);
	} else {
		await db
			.update(users)
			.set({
				role: "admin",
				status: "active",
				mustResetPassword: false,
			})
			.where(eq(users.email, adminEmail));

		console.log(`✅ Akun ${adminEmail} dipastikan aktif sebagai Admin`);
	}

	console.log("Google Admin seeding completed successfully!");
	process.exit(0);
}

seedAdmin().catch((err) => {
	console.error("Error seeding Google admin:", err);
	process.exit(1);
});
