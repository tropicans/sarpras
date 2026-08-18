import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { auth } from "./auth.server";
import { db } from "./client.server";
import { accounts, users } from "./schema";

async function seedAdmin() {
	console.log("Seeding admin accounts...");

	const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@ppkasn.go.id";
	const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "Password123!";

	// Check if admin already exists
	const existing = await db
		.select()
		.from(users)
		.where(eq(users.email, adminEmail))
		.limit(1);

	if (existing.length === 0) {
		// Create via Better Auth API
		await auth.api.signUpEmail({
			body: {
				email: adminEmail,
				name: "Admin Utama",
				password: defaultPassword,
			},
		});

		await db
			.update(users)
			.set({
				role: "admin",
				status: "active",
				mustResetPassword: false,
			})
			.where(eq(users.email, adminEmail));

		console.log(
			`Created admin ${adminEmail} with password: ${defaultPassword}`,
		);
	} else {
		// Ensure active and admin role
		await db
			.update(users)
			.set({
				role: "admin",
				status: "active",
				mustResetPassword: false,
			})
			.where(eq(users.email, adminEmail));

		// Update password hash in accounts table using Better Auth internal hasher or recreation
		const passwordHash = await hashPassword(defaultPassword);
		await db
			.update(accounts)
			.set({
				password: passwordHash,
			})
			.where(eq(accounts.userId, existing[0].id));

		console.log(`Updated admin ${adminEmail} password to: ${defaultPassword}`);
	}

	// Also seed/update operator account
	const opEmail = "staff@ppkasn.go.id";
	const existingOp = await db
		.select()
		.from(users)
		.where(eq(users.email, opEmail))
		.limit(1);

	if (existingOp.length === 0) {
		await auth.api.signUpEmail({
			body: {
				email: opEmail,
				name: "Staf Pengelola",
				password: defaultPassword,
			},
		});

		await db
			.update(users)
			.set({
				role: "operator",
				status: "active",
				mustResetPassword: false,
			})
			.where(eq(users.email, opEmail));

		console.log(
			`Created operator ${opEmail} with password: ${defaultPassword}`,
		);
	} else {
		await db
			.update(users)
			.set({
				role: "operator",
				status: "active",
				mustResetPassword: false,
			})
			.where(eq(users.email, opEmail));

		const passwordHash = await hashPassword(defaultPassword);
		await db
			.update(accounts)
			.set({
				password: passwordHash,
			})
			.where(eq(accounts.userId, existingOp[0].id));

		console.log(`Updated operator ${opEmail} password to: ${defaultPassword}`);
	}

	console.log("Admin seeding completed!");
	process.exit(0);
}

seedAdmin().catch((err) => {
	console.error("Error seeding admin:", err);
	process.exit(1);
});
