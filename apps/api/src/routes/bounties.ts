import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@bountr/shared";
import {
  schema,
  PaginationQuerySchema,
  BountyStatusSchema,
} from "@bountr/shared";
import { classifyBounty } from "../services/classification";
import { logger } from "../logger";

export function createBountiesRouter(db: DB) {
  const router = new Hono();

  // GET /v1/bounties — paginated list of active bounties
  router.get(
    "/",
    zValidator(
      "query",
      PaginationQuerySchema.extend({
        status: BountyStatusSchema.optional(),
      }),
    ),
    async (c) => {
      const { page, limit, status } = c.req.valid("query");
      const offset = (page - 1) * limit;

      // Always filter $0 bounties; default to active if no status specified
      const statusFilter = status
        ? eq(schema.bounties.status, status)
        : eq(schema.bounties.status, "active");
      const conditions = [statusFilter, gt(schema.bounties.rewardUsd, "0")];

      const [rows, countRows] = await Promise.all([
        db
          .select()
          .from(schema.bounties)
          .where(and(...conditions))
          .orderBy(desc(sql`cast(${schema.bounties.rewardUsd} as numeric)`))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: schema.bounties.id })
          .from(schema.bounties)
          .where(and(...conditions)),
      ]);

      const total = countRows.length;

      return c.json({
        data: rows.map(serializeBounty),
        pagination: {
          page,
          limit,
          total,
          hasNext: offset + rows.length < total,
        },
      });
    },
  );

  // GET /v1/bounties/automatable — AI-classified bounties sorted by reward/effort ratio
  router.get("/automatable", async (c) => {
    const query = PaginationQuerySchema.safeParse(c.req.query());
    const { page, limit } = query.success ? query.data : { page: 1, limit: 20 };
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        bounty: schema.bounties,
        classification: schema.bountyClassifications,
      })
      .from(schema.bounties)
      .innerJoin(
        schema.bountyClassifications,
        eq(schema.bounties.id, schema.bountyClassifications.bountyId),
      )
      .where(
        and(
          eq(schema.bounties.status, "active"),
          eq(schema.bountyClassifications.category, "digital_automatable"),
        ),
      )
      .orderBy(desc(schema.bounties.rewardUsd))
      .limit(limit)
      .offset(offset);

    const enriched = rows.map(({ bounty, classification }) => {
      const effortWeight =
        classification.effortEstimate === "low"
          ? 1
          : classification.effortEstimate === "medium"
            ? 2
            : 4;
      const rewardToEffortRatio = parseFloat(bounty.rewardUsd) / effortWeight;

      return {
        ...serializeBounty(bounty),
        classification: {
          category: classification.category,
          confidence: parseFloat(classification.confidence),
          effortEstimate: classification.effortEstimate,
          reasoning: classification.reasoning,
          rewardToEffortRatio: Math.round(rewardToEffortRatio * 100) / 100,
        },
      };
    });

    // Sort by ratio desc (DB can't easily do this without computed col)
    enriched.sort((a, b) => b.classification.rewardToEffortRatio - a.classification.rewardToEffortRatio);

    return c.json({ data: enriched, pagination: { page, limit, total: enriched.length, hasNext: false } });
  });

  // GET /v1/bounties/:id — bounty detail + status history
  router.get("/:id", async (c) => {
    const id = c.req.param("id");

    const [bounty] = await db
      .select()
      .from(schema.bounties)
      .where(eq(schema.bounties.id, id))
      .limit(1);

    if (!bounty) {
      return c.json({ error: "Bounty not found" }, 404);
    }

    const [history, classification] = await Promise.all([
      db
        .select()
        .from(schema.bountyStatusHistory)
        .where(eq(schema.bountyStatusHistory.bountyId, id))
        .orderBy(schema.bountyStatusHistory.changedAt),
      db.query.bountyClassifications.findFirst({
        where: eq(schema.bountyClassifications.bountyId, id),
      }),
    ]);

    // Trigger classification in background if not yet classified
    if (!classification && bounty.descriptionHash) {
      classifyBounty(db, id, bounty.title, bounty.description, bounty.descriptionHash).catch(
        (err) => logger.error({ err, bountyId: id }, "Background classification failed"),
      );
    }

    return c.json({
      ...serializeBounty(bounty),
      statusHistory: history.map((h) => ({
        status: h.status,
        changedAt: h.changedAt.toISOString(),
      })),
      classification: classification
        ? {
            category: classification.category,
            confidence: parseFloat(classification.confidence),
            effortEstimate: classification.effortEstimate,
            reasoning: classification.reasoning,
          }
        : null,
    });
  });

  return router;
}

function serializeBounty(b: typeof schema.bounties.$inferSelect) {
  return {
    id: b.id,
    externalId: b.externalId,
    title: b.title,
    description: b.description,
    rewardUsd: b.rewardUsd,
    deadline: b.deadline?.toISOString() ?? null,
    link: b.link,
    status: b.status,
    creatorAddress: b.creatorAddress,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}
