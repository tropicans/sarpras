import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./client.server";
import { users } from "./schema";

async function seedAdmin() {
	console.log("Seeding Google OAuth admin accounts...");

	const rawAdminEmails = process.env.ADMIN_DEFAULT_EMAIL || "admin@ppkasn.go.id";
	const adminEmails = rawAdminEmails
		.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);

	for (const adminEmail of adminEmails) {
		const existing = await db
			.select()
			.from(users)
			.where(eq(users.email, adminEmail))
			.limit(1);

		if (existing.length === 0) {
			await db.insert(users).values({
				id: crypto.randomUUID(),
				name: `Admin (${adminEmail.split("@")[0]})`,
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
					emailVerified: true,
				})
				.where(eq(users.email, adminEmail));

			console.log(`✅ Akun ${adminEmail} dipastikan aktif sebagai Admin`);
		}
	}

	console.log("Google Admin seeding completed successfully!");
	process.exit(0);
}

seedAdmin().catch((err) => {
	console.error("Error seeding Google admin:", err);
	process.exit(1);
});
