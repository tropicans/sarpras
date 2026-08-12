import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Users & Auth (Better Auth Schema mapping to "user" table) ---
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("operator").notNull(), // admin, operator, pimpinan
  legacyId: text("legacy_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: text("actor_id").notNull(),
  actorType: text("actor_type").notNull(), // system, user
  action: text("action").notNull(), // e.g. "migration.import", "booking.create", etc.
  entityType: text("entity_type").notNull(), // user, asset, booking
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<any>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Relations ---

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const assetRelations = relations(assets, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingRelations = relations(bookings, ({ one }) => ({
  asset: one(assets, { fields: [bookings.assetId], references: [assets.id] }),
}));
