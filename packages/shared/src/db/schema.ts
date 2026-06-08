import {
  pgTable,
  uuid,
  text,
  decimal,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { SubscriptionFilters } from "../types";

export const bounties = pgTable(
  "bounties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    rewardUsd: decimal("reward_usd", { precision: 10, scale: 2 }).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }),
    link: text("link").notNull(),
    status: text("status").notNull().default("active"),
    rawData: jsonb("raw_data"),
    descriptionHash: text("description_hash"),
    creatorAddress: text("creator_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_bounties_status").on(t.status),
    index("idx_bounties_external_id").on(t.externalId),
    index("idx_bounties_updated_at").on(t.updatedAt),
  ],
);

export const bountyStatusHistory = pgTable(
  "bounty_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bountyId: uuid("bounty_id")
      .notNull()
      .references(() => bounties.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_bsh_bounty_id").on(t.bountyId)],
);

export const bountyClassifications = pgTable(
  "bounty_classifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bountyId: uuid("bounty_id")
      .notNull()
      .references(() => bounties.id, { onDelete: "cascade" })
      .unique(),
    category: text("category").notNull(),
    confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
    effortEstimate: text("effort_estimate").notNull(),
    reasoning: text("reasoning").notNull(),
    classifiedAt: timestamp("classified_at", { withTimezone: true }).notNull().defaultNow(),
    descriptionHashAtClassification: text("description_hash_at_classification"),
  },
  (t) => [
    index("idx_bc_category").on(t.category),
    index("idx_bc_bounty_id").on(t.bountyId),
    check(
      "category_check",
      sql`${t.category} IN ('digital_automatable', 'digital_human', 'physical')`,
    ),
    check(
      "effort_check",
      sql`${t.effortEstimate} IN ('low', 'medium', 'high')`,
    ),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    payerAddress: text("payer_address").notNull(),
    webhookUrl: text("webhook_url").notNull(),
    filters: jsonb("filters").notNull().$type<SubscriptionFilters>().default({}),
    hmacSecret: text("hmac_secret").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_subs_active").on(t.active, t.expiresAt),
    index("idx_subs_payer").on(t.payerAddress),
  ],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    bountyId: uuid("bounty_id")
      .notNull()
      .references(() => bounties.id, { onDelete: "cascade" }),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_wd_status_retry").on(t.status, t.nextRetryAt),
    index("idx_wd_subscription_id").on(t.subscriptionId),
  ],
);

export const revenueEvents = pgTable(
  "revenue_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpoint: text("endpoint").notNull(),
    payerAddress: text("payer_address").notNull(),
    amountUsd: decimal("amount_usd", { precision: 10, scale: 6 }).notNull(),
    txHash: text("tx_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_rev_endpoint_date").on(t.endpoint, t.createdAt)],
);

