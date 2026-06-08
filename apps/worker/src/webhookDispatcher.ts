import { createHmac } from "crypto";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import type { DB } from "@agent-go/shared";
import { schema } from "@agent-go/shared";
import { logger } from "./logger";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000];

function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
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

  if (pending.length > 0) {
    logger.debug({ count: pending.length }, "Processing webhook deliveries");
  }

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
        "X-Agent-Go-Signature": `sha256=${signature}`,
        "X-Agent-Go-Attempt": String(attempt),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      await db
        .update(schema.webhookDeliveries)
        .set({ status: "delivered", attempts: attempt, lastAttemptAt: new Date() })
        .where(eq(schema.webhookDeliveries.id, delivery.id));

      logger.debug({ deliveryId: delivery.id, attempt }, "Webhook delivered");
    } else {
      logger.warn({ deliveryId: delivery.id, attempt, httpStatus: res.status }, "Webhook rejected");
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
    logger.warn({ deliveryId: delivery.id }, "Webhook permanently failed after max attempts");
    return;
  }

  const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  const nextRetryAt = new Date(Date.now() + delayMs);

  await db
    .update(schema.webhookDeliveries)
    .set({ attempts: attempt, lastAttemptAt: new Date(), nextRetryAt })
    .where(eq(schema.webhookDeliveries.id, delivery.id));
}
