import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { DB } from "@bountr/shared";
import { schema, CreateSubscriptionBodySchema } from "@bountr/shared";
import { generateHmacSecret } from "../services/webhook";
import { logger } from "../logger";

// Subscriptions are valid for 24 h (paid micro-subscription model)
const SUBSCRIPTION_TTL_MS = 24 * 60 * 60 * 1000;

export function createSubscriptionsRouter(db: DB) {
  const router = new Hono();

  router.post(
    "/",
    zValidator("json", CreateSubscriptionBodySchema),
    async (c) => {
      const { webhookUrl, filters } = c.req.valid("json");
      const payerAddress = (c.get("payerAddress") as string | undefined) ?? "unknown";

      const expiresAt = new Date(Date.now() + SUBSCRIPTION_TTL_MS);
      const hmacSecret = generateHmacSecret();

      const [sub] = await db
        .insert(schema.subscriptions)
        .values({
          payerAddress,
          webhookUrl,
          filters,
          hmacSecret,
          expiresAt,
        })
        .returning();

      if (!sub) throw new Error("Insert returned no rows");

      logger.info({ subscriptionId: sub.id, payerAddress }, "Subscription created");

      return c.json(
        {
          id: sub.id,
          webhookUrl: sub.webhookUrl,
          filters: sub.filters,
          expiresAt: sub.expiresAt.toISOString(),
          hmacSecret: sub.hmacSecret,
          createdAt: sub.createdAt.toISOString(),
        },
        201,
      );
    },
  );

  return router;
}
