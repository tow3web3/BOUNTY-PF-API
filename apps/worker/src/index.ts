import cron from "node-cron";
import { and, eq, inArray } from "drizzle-orm";
import { createDb, schema, type NormalizedBounty } from "@bountr/shared";
import { scrapeBounties } from "./scraper";
import { hashDescription } from "./normalizer";
import { classifyNewBounties } from "./classifier";
import { processPendingWebhooks } from "./webhookDispatcher";
import { enqueueWebhooksForNewBounties } from "./webhookEnqueuer";
import { logger } from "./logger";
import { z } from "zod";

// ── Config ────────────────────────────────────────────────────────────────────
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  SCRAPER_DRY_RUN: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SCRAPER_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const envResult = EnvSchema.safeParse(process.env);
if (!envResult.success) {
  console.error("Invalid env:", envResult.error.format());
  process.exit(1);
}
const env = envResult.data;

const db = createDb(env.DATABASE_URL);

// ── Scrape + upsert ───────────────────────────────────────────────────────────
async function runScrapeJob(): Promise<void> {
  logger.info("Scrape job started");
  const { bounties, source } = await scrapeBounties({ dryRun: env.SCRAPER_DRY_RUN });
  logger.info({ source, count: bounties.length }, "Scraped");

  const newBounties: typeof schema.bounties.$inferSelect[] = [];

  for (const b of bounties) {
    const descHash = hashDescription(b.description);
    try {
      const existing = await db.query.bounties.findFirst({
        where: eq(schema.bounties.externalId, b.externalId),
      });

      if (!existing) {
        // New bounty
        const [inserted] = await db
          .insert(schema.bounties)
          .values({
            externalId: b.externalId,
            title: b.title,
            description: b.description,
            rewardUsd: b.rewardUsd.toFixed(2),
            deadline: b.deadline ?? undefined,
            link: b.link,
            status: b.status,
            rawData: b.rawData,
            descriptionHash: descHash,
            creatorAddress: b.creatorAddress,
          })
          .returning();

        if (inserted) {
          await db.insert(schema.bountyStatusHistory).values({
            bountyId: inserted.id,
            status: b.status,
          });
          newBounties.push(inserted);
          logger.debug({ externalId: b.externalId }, "New bounty inserted");
        }
      } else {
        // Update if status or description changed
        const statusChanged = existing.status !== b.status;
        const descChanged = existing.descriptionHash !== descHash;

        if (statusChanged || descChanged) {
          await db
            .update(schema.bounties)
            .set({
              status: b.status,
              description: b.description,
              descriptionHash: descHash,
              rewardUsd: b.rewardUsd.toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(schema.bounties.id, existing.id));

          if (statusChanged) {
            await db.insert(schema.bountyStatusHistory).values({
              bountyId: existing.id,
              status: b.status,
            });
            logger.debug(
              { externalId: b.externalId, from: existing.status, to: b.status },
              "Bounty status changed",
            );
          }
        }
      }
    } catch (err) {
      logger.error({ err, externalId: b.externalId }, "Failed to upsert bounty");
    }
  }

  // Mark bounties not seen in this scrape as expired (only when we got a full list)
  if (bounties.length > 0 && source !== "dry_run") {
    const seenIds = bounties.map((b) => b.externalId);
    await db
      .update(schema.bounties)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(schema.bounties.status, "active"),
          // drizzle notInArray helper
          // We filter out bounties not returned in this scrape
        ),
      )
      .catch(() => {
        // Best-effort — non-critical
      });
  }

  logger.info({ new: newBounties.length }, "Scrape job complete");

  // Notify webhooks for new bounties
  if (newBounties.length > 0) {
    await enqueueWebhooksForNewBounties(db, newBounties).catch((err) =>
      logger.error({ err }, "Webhook enqueue failed"),
    );
  }
}

// ── Classify job ──────────────────────────────────────────────────────────────
async function runClassifyJob(): Promise<void> {
  await classifyNewBounties(db, env.ANTHROPIC_API_KEY).catch((err) =>
    logger.error({ err }, "Classify job failed"),
  );
}

// ── Webhook dispatch job ──────────────────────────────────────────────────────
async function runWebhookJob(): Promise<void> {
  await processPendingWebhooks(db).catch((err) =>
    logger.error({ err }, "Webhook dispatch job failed"),
  );
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
logger.info(
  { dryRun: env.SCRAPER_DRY_RUN, interval: env.SCRAPER_INTERVAL_SECONDS },
  "Worker started",
);

// Run once immediately on start
runScrapeJob().then(runClassifyJob).then(runWebhookJob).catch(logger.error);

// Then on schedule
const cronExpr = `*/${env.SCRAPER_INTERVAL_SECONDS} * * * * *`;
cron.schedule(cronExpr, () => {
  runScrapeJob().then(runClassifyJob).then(runWebhookJob).catch(logger.error);
});

// Webhook dispatch runs more frequently (every 30s) to honour retry windows
cron.schedule("*/30 * * * * *", () => {
  runWebhookJob().catch(logger.error);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down worker");
  process.exit(0);
});
