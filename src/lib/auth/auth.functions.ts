import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client.server";
import { accounts, auditLogs, sessions, users } from "../../db/schema";
import { requireMinRole } from "../auth.middleware";

export const getAdminsListFn = createServerFn({ method: "GET" })
	.middleware([requireMinRole("admin")])
	.handler(async () => {
		return await db.select().from(users).orderBy(desc(users.createdAt));
	});

export const CreateGoogleUserInputSchema = z.object({
	name: z.string().min(1, "Nama lengkap wajib diisi"),
	email: z.string().email("Format email Google tidak valid"),
	role: z.enum(["admin", "operator", "pimpinan"]).default("operator"),
});

export const createGoogleUserFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("admin")])
	.validator((data: z.infer<typeof CreateGoogleUserInputSchema>) =>
		CreateGoogleUserInputSchema.parse(data),
	)
	.handler(async ({ data, context }) => {
		const cleanEmail = data.email.trim().toLowerCase();

		// Check if user already exists
		const existing = await db
			.select()
			.from(users)
			.where(eq(users.email, cleanEmail))
			.limit(1);
		if (existing.length > 0) {
			throw new Error(`Pengguna dengan email "${cleanEmail}" sudah terdaftar.`);
		}

		const [newUser] = await db
			.insert(users)
			.values({
				id: crypto.randomUUID(),
				name: data.name.trim(),
				email: cleanEmail,
				role: data.role,
				status: "active",
				mustResetPassword: false,
				emailVerified: true,
			})
			.returning();

		// Log audit
		await db.insert(auditLogs).values({
			actorId: context.user.id,
			actorType: "user",
			action: "user.create",
			entityType: "user",
			entityId: newUser.id,
			metadata: {
				registeredEmail: cleanEmail,
				assignedRole: data.role,
				createdBy: context.user.name || context.user.email,
				timestamp: new Date().toISOString(),
			},
		});

		return newUser;
	});

export const ToggleUserStatusInputSchema = z.object({
	userId: z.string().min(1),
	status: z.enum(["active", "inactive"]),
});

export const toggleUserStatusFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("admin")])
	.validator((data: z.infer<typeof ToggleUserStatusInputSchema>) =>
		ToggleUserStatusInputSchema.parse(data),
	)
	.handler(async ({ data, context }) => {
		if (data.userId === context.user.id) {
			throw new Error("Anda tidak dapat mengubah status akun Anda sendiri.");
		}

		await db
			.update(users)
			.set({ status: data.status })
			.where(eq(users.id, data.userId));

		if (data.status === "inactive") {
			await db.delete(sessions).where(eq(sessions.userId, data.userId));
		}

		await db.insert(auditLogs).values({
			actorId: context.user.id,
			actorType: "user",
			action: `user.${data.status === "active" ? "activate" : "deactivate"}`,
			entityType: "user",
			entityId: data.userId,
			metadata: {
				status: data.status,
				updatedBy: context.user.name || context.user.email,
				timestamp: new Date().toISOString(),
			},
		});

		return { success: true };
	});

export const deleteUserFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("admin")])
	.validator((userId: string) => userId)
	.handler(async ({ data: userId, context }) => {
		if (userId === context.user.id) {
			throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
		}

		// Delete related sessions & accounts first
		await db.delete(sessions).where(eq(sessions.userId, userId));
		await db.delete(accounts).where(eq(accounts.userId, userId));
		await db.delete(users).where(eq(users.id, userId));

		await db.insert(auditLogs).values({
			actorId: context.user.id,
			actorType: "user",
			action: "user.delete",
			entityType: "user",
			entityId: userId,
			metadata: {
				deletedBy: context.user.name || context.user.email,
				timestamp: new Date().toISOString(),
			},
		});

		return { success: true };
	});
