import { relations } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// --- Enums -----------------------------------------------------------------
// The AI agent (milestone 3) fills in `category`; until then it stays null.
export const messageCategory = pgEnum("message_category", [
  "repair",
  "payment",
  "question",
  "other",
]);

// Lifecycle of a tenant message: new -> drafted (AI wrote a reply) -> answered.
export const messageStatus = pgEnum("message_status", [
  "new",
  "drafted",
  "answered",
]);

// How quickly the landlord should react. Set by the AI agent.
export const messageUrgency = pgEnum("message_urgency", [
  "low",
  "normal",
  "high",
]);

// Lifecycle of a reply: draft (AI wrote it) -> approved -> sent.
export const replyStatus = pgEnum("reply_status", ["draft", "approved", "sent"]);

// --- Tables ----------------------------------------------------------------
// A building owned by the landlord.
export const properties = pgTable("properties", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  street: text().notNull(),
  postalCode: text("postal_code").notNull(),
  city: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// A flat inside a property.
export const units = pgTable("units", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  label: text().notNull(), // e.g. "2. OG links"
  rooms: numeric({ precision: 3, scale: 1 }).notNull(), // 2.5 rooms is common in Germany
  areaSqm: numeric("area_sqm", { precision: 6, scale: 2 }).notNull(),
  // Money is stored as integer cents to avoid floating point rounding errors.
  coldRentCents: integer("cold_rent_cents").notNull(),
});

// The person renting a unit.
export const tenants = pgTable("tenants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text().notNull().unique(),
  phone: text(),
  moveInDate: date("move_in_date").notNull(),
});

// An incoming message from a tenant.
export const messages = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  subject: text().notNull(),
  body: text().notNull(),
  // The next three columns are filled in by the AI agent.
  category: messageCategory(),
  urgency: messageUrgency(),
  summary: text(),
  status: messageStatus().notNull().default("new"),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Set by the background workflow some time after the reply was sent, to
  // remind the landlord to check whether the issue is really resolved.
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
});

// The reply to a message. Each message has at most one reply (unique).
export const replies = pgTable("replies", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  messageId: integer("message_id")
    .notNull()
    .unique()
    .references(() => messages.id, { onDelete: "cascade" }),
  body: text().notNull(),
  status: replyStatus().notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Relations -------------------------------------------------------------
// These don't change the database. They let Drizzle's query API load nested
// data, e.g. a message together with its tenant, unit and property.
export const propertiesRelations = relations(properties, ({ many }) => ({
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
  tenants: many(tenants),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  unit: one(units, { fields: [tenants.unitId], references: [units.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [messages.tenantId],
    references: [tenants.id],
  }),
  reply: one(replies),
}));

export const repliesRelations = relations(replies, ({ one }) => ({
  message: one(messages, {
    fields: [replies.messageId],
    references: [messages.id],
  }),
}));

// --- Types -----------------------------------------------------------------
export type Property = typeof properties.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Reply = typeof replies.$inferSelect;
