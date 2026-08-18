import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

// --- Users & Auth (Better Auth Schema mapping to "user" table) ---
export const users = pgTable("user", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	role: text("role").default("operator").notNull(), // admin, operator, pimpinan
	status: text("status").default("active").notNull(), // active, inactive
	mustResetPassword: boolean("must_reset_password").default(false).notNull(),
	twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
	legacyId: text("legacy_id").unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const sessions = pgTable("session", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", {
		withTimezone: true,
	}),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
		withTimezone: true,
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const verifications = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const twoFactors = pgTable("two_factor", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	secret: text("secret").notNull(),
	backupCodes: text("backup_codes").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

// --- Sarpras PPKASN Core Tables ---

export const assets = pgTable("assets", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	type: text("type").notNull(), // room, dormitory
	location: text("location"),
	capacity: integer("capacity").notNull(),
	status: text("status").default("active").notNull(), // active, archived, inactive
	legacyId: text("legacy_id").unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const bookings = pgTable("bookings", {
	id: uuid("id").defaultRandom().primaryKey(),
	assetId: uuid("asset_id")
		.notNull()
		.references(() => assets.id, { onDelete: "restrict" }),
	requesterName: text("requester_name").notNull(),
	requesterEmail: text("requester_email").notNull(),
	requesterPhone: text("requester_phone"),
	requesterOrganization: text("requester_organization"),
	purpose: text("purpose"),
	attendance: integer("attendance"),
	startDate: timestamp("start_date", { withTimezone: true }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true }).notNull(),
	timezone: text("timezone").default("Asia/Jakarta").notNull(),
	status: text("status").default("pending").notNull(), // pending, approved, rejected, cancelled
	rejectionReason: text("rejection_reason"),
	legacyId: text("legacy_id").unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const auditLogs = pgTable("audit_logs", {
	id: uuid("id").defaultRandom().primaryKey(),
	actorId: text("actor_id").notNull(),
	actorType: text("actor_type").notNull(), // system, user
	action: text("action").notNull(), // e.g. "migration.import", "booking.create", etc.
	entityType: text("entity_type").notNull(), // user, asset, booking
	entityId: text("entity_id"),
	metadata: jsonb("metadata").$type<any>(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const assetAvailability = pgTable("asset_availability", {
	id: uuid("id").defaultRandom().primaryKey(),
	assetId: uuid("asset_id")
		.notNull()
		.references(() => assets.id, { onDelete: "cascade" }),
	dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
	openTime: text("open_time").notNull(), // "HH:MM" e.g., "08:00"
	closeTime: text("close_time").notNull(), // "HH:MM" e.g., "16:00"
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const assetClosures = pgTable("asset_closures", {
	id: uuid("id").defaultRandom().primaryKey(),
	assetId: uuid("asset_id")
		.notNull()
		.references(() => assets.id, { onDelete: "cascade" }),
	date: timestamp("date", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

// --- Relations ---

export const userRelations = relations(users, ({ many, one }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	twoFactor: one(twoFactors),
}));

export const twoFactorRelations = relations(twoFactors, ({ one }) => ({
	user: one(users, { fields: [twoFactors.userId], references: [users.id] }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const assetRelations = relations(assets, ({ many }) => ({
	bookings: many(bookings),
	availability: many(assetAvailability),
	closures: many(assetClosures),
}));

export const bookingRelations = relations(bookings, ({ one }) => ({
	asset: one(assets, { fields: [bookings.assetId], references: [assets.id] }),
}));

export const assetAvailabilityRelations = relations(
	assetAvailability,
	({ one }) => ({
		asset: one(assets, {
			fields: [assetAvailability.assetId],
			references: [assets.id],
		}),
	}),
);

export const assetClosuresRelations = relations(assetClosures, ({ one }) => ({
	asset: one(assets, {
		fields: [assetClosures.assetId],
		references: [assets.id],
	}),
}));
