import { Hono } from "hono";
import type { DB } from "@bountr/shared";
import { sql } from "drizzle-orm";
import { getRevenueStats } from "../services/revenue";

export function createHealthRouter(db: DB) {
  const router = new Hono();

  router.get("/", async (c) => {
    let dbOk = false;
    try {
      await db.execute(sql`SELECT 1`);
      dbOk = true;
    } catch {
      // db unreachable
    }

    const revenue = dbOk ? await getRevenueStats(db).catch(() => ({})) : {};

    return c.json({
      status: dbOk ? "ok" : "degraded",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      db: dbOk ? "connected" : "unreachable",
      revenue,
    });
  });

  return router;
}
