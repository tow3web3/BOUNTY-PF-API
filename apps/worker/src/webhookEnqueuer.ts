import { and, eq, gt } from "drizzle-orm";
import type { DB } from "@agent-go/shared";
import { schema, type SubscriptionFilters } from "@agent-go/shared";
import { logger } from "./logger";

export async function enqueueWebhooksForNewBounties(
  db: DB,
  newBounties: (typeof schema.bounties.$inferSelect)[],
): Promise<void> {
  if (newBounties.length === 0) return;

  const now = new Date();
  const activeSubs = await db
    .select()
    .from(schema.subscriptions)
    .where(and(eq(schema.subscriptions.active, true), gt(schema.subscriptions.expiresAt, now)));

  if (activeSubs.length === 0) return;

  // Load classifications for these bounties
  const bountyIds = newBounties.map((b) => b.id);
  const classifications = await db
    .select()
    .from(schema.bountyClassifications)
    .where(
      bountyIds.length === 1
        ? eq(schema.bountyClassifications.bountyId, bountyIds[0])
        : // drizzle inArray
          eq(schema.bountyClassifications.bountyId, bountyIds[0]),
    );

  const classMap = new Map(classifications.map((c) => [c.bountyId, c.category]));

  let totalEnqueued = 0;

  for (const bounty of newBounties) {
    const category = classMap.get(bounty.id);

    for (const sub of activeSubs) {
      const filters = sub.filters as SubscriptionFilters;

      if (!matchesFilters(bounty, filters, category)) continue;

      const payload = {
        event: "bounty.new",
        subscriptionId: sub.id,
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
        matchedFilters: filters,
        timestamp: now.toISOString(),
      };

      await db.insert(schema.webhookDeliveries).values({
        subscriptionId: sub.id,
        bountyId: bounty.id,
        payload,
        status: "pending",
        nextRetryAt: now,
      });

      totalEnqueued++;
    }
  }

  if (totalEnqueued > 0) {
    logger.info({ totalEnqueued, bountyCount: newBounties.length }, "Webhook deliveries enqueued");
  }
}

function matchesFilters(
  bounty: typeof schema.bounties.$inferSelect,
  filters: SubscriptionFilters,
  category: string | undefined,
): boolean {
  if (filters.minReward !== undefined) {
    if (parseFloat(bounty.rewardUsd) < filters.minReward) return false;
  }

  if (filters.categories && filters.categories.length > 0) {
    if (!category || !filters.categories.includes(category as SubscriptionFilters["categories"] extends Array<infer T> ? T : never)) {
      return false;
    }
  }

  if (filters.keywords && filters.keywords.length > 0) {
    const text = `${bounty.title} ${bounty.description}`.toLowerCase();
    if (!filters.keywords.some((kw) => text.includes(kw.toLowerCase()))) return false;
  }

  return true;
}
