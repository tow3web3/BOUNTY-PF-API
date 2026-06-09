import { createHmac, randomBytes } from "crypto";
import type { DB } from "@bountr/shared";
import {
  schema,
  type SubscriptionFilters,
  type BountyRow,
} from "@bountr/shared";
import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { logger } from "../logger";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000];

export function generateHmacSecret(): string {
  return randomBytes(32).toString("hex");
}

export function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function matchesBountyFilters(
  bounty: Pick<BountyRow, "title" | "description" | "rewardUsd">,
  filters: SubscriptionFilters,
  category?: string,
): boolean {
  if (filters.minReward !== undefined) {
    if (parseFloat(bounty.rewardUsd) < filters.minReward) return false;
  }

  if (filters.categories && filters.categories.length > 0) {
    if (!category || !filters.categories.includes(category as BountyRow["status"] & string)) {
      return false;
    }
  }

  if (filters.keywords && filters.keywords.length > 0) {
    const text = `${bounty.title} ${bounty.description}`.toLowerCase();
    const match = filters.keywords.some((kw) => text.includes(kw.toLowerCase()));
    if (!match) return false;
  }

  return true;
}

export async function enqueueWebhooksForBounty(
  db: DB,
  bounty: BountyRow,
  category: string | undefined,
): Promise<void> {
  const now = new Date();

  const activeSubs = await db
    .select()
    .from(schema.subscriptions)
    .where(and(eq(schema.subscriptions.active, true), gt(schema.subscriptions.expiresAt, now)));

  const matchingSubs = activeSubs.filter((sub) =>
    matchesBountyFilters(bounty, sub.filters as SubscriptionFilters, category),
  );

  if (matchingSubs.length === 0) return;

  const payload = {
    event: "bounty.new",
    subscriptionId: "", // set per sub below
    bounty: {
      id: bounty.id,
      externalId: bounty.externalId,
      title: bounty.title,
      description: bounty.description,
      rewardUsd: bounty.rewardUsd,
      deadline: bounty.deadline?.toISOString() ?? null,
      link: bounty.link,
      status: bounty.status,
      createdAt: bounty.createdAt.toISOString(),
      updatedAt: bounty.updatedAt.toISOString(),
    },
    matchedFilters: {},
    timestamp: now.toISOString(),
  };

  for (const sub of matchingSubs) {
    payload.subscriptionId = sub.id;
    payload.matchedFilters = sub.filters as SubscriptionFilters;

    await db.insert(schema.webhookDeliveries).values({
      subscriptionId: sub.id,
      bountyId: bounty.id,
      payload: { ...payload },
      status: "pending",
      nextRetryAt: now,
    });
  }

  logger.info(
    { bountyId: bounty.id, count: matchingSubs.length },
    "Webhook deliveries enqueued",
  );
}

export async function processPendingWebhooks(db: DB): Promise<void> {
  const now = new Date();

  const pending = await db
    .select({
      delivery: schema.webhookDeliveries,
      sub: schema.subscriptions,
    })
    .from(schema.webhookDeliveries)
    .innerJoin(
      schema.subscriptions,
      eq(schema.webhookDeliveries.subscriptionId, schema.subscriptions.id),
    )
    .where(
      and(
        eq(schema.webhookDeliveries.status, "pending"),
        or(
          isNull(schema.webhookDeliveries.nextRetryAt),
          lte(schema.webhookDeliveries.nextRetryAt, now),
        ),
      ),
    )
    .limit(50);

  for (const { delivery, sub } of pending) {
    await deliverWebhook(db, delivery, sub.webhookUrl, sub.hmacSecret);
  }
}

async function deliverWebhook(
  db: DB,
  delivery: typeof schema.webhookDeliveries.$inferSelect,
  webhookUrl: string,
  hmacSecret: string,
): Promise<void> {
  const body = JSON.stringify(delivery.payload);
  const signature = signPayload(hmacSecret, body);
  const attempt = delivery.attempts + 1;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bountr-Signature": `sha256=${signature}`,
        "X-Bountr-Attempt": String(attempt),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      await db
        .update(schema.webhookDeliveries)
        .set({ status: "delivered", attempts: attempt, lastAttemptAt: new Date() })
        .where(eq(schema.webhookDeliveries.id, delivery.id));
    } else {
      await scheduleRetry(db, delivery, attempt);
    }
  } catch (err) {
    logger.warn({ err, deliveryId: delivery.id, attempt }, "Webhook delivery failed");
    await scheduleRetry(db, delivery, attempt);
  }
}

async function scheduleRetry(
  db: DB,
  delivery: typeof schema.webhookDeliveries.$inferSelect,
  attempt: number,
): Promise<void> {
  if (attempt >= MAX_ATTEMPTS) {
    await db
      .update(schema.webhookDeliveries)
      .set({ status: "failed", attempts: attempt, lastAttemptAt: new Date(), nextRetryAt: null })
      .where(eq(schema.webhookDeliveries.id, delivery.id));
    return;
  }

  const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  const nextRetryAt = new Date(Date.now() + delayMs);

  await db
    .update(schema.webhookDeliveries)
    .set({ attempts: attempt, lastAttemptAt: new Date(), nextRetryAt })
    .where(eq(schema.webhookDeliveries.id, delivery.id));
}
