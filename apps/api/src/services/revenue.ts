import type { DB } from "@bountr/shared";
import { schema } from "@bountr/shared";
import { logger } from "../logger";

export async function trackRevenue(
  db: DB,
  endpoint: string,
  payerAddress: string,
  amountUsd: string,
  txHash?: string,
) {
  try {
    await db.insert(schema.revenueEvents).values({
      endpoint,
      payerAddress,
      amountUsd,
      txHash: txHash ?? null,
    });
  } catch (err) {
    // Revenue tracking failure must never break the response
    logger.error({ err, endpoint, payerAddress }, "Failed to track revenue event");
  }
}

export async function getRevenueStats(db: DB) {
  const rows = await db
    .select({
      endpoint: schema.revenueEvents.endpoint,
      totalUsd: schema.revenueEvents.amountUsd,
    })
    .from(schema.revenueEvents);

  const stats: Record<string, number> = {};
  for (const row of rows) {
    stats[row.endpoint] = (stats[row.endpoint] ?? 0) + parseFloat(row.totalUsd);
  }
  return stats;
}
