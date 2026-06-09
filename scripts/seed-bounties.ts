/**
 * Full seed: fetch ALL bounties from pump.fun GO (all phases) and upsert into DB.
 * Run: DATABASE_URL=... npx tsx scripts/seed-bounties.ts
 */
import { createDb, schema } from "@agent-go/shared";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://gabrieldevarine@localhost:5432/agentgo";
const LIVESTREAM = "https://livestream-api.pump.fun";
const HDR = {
  "Origin": "https://pump.fun",
  "Referer": "https://pump.fun/go",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Accept": "application/json",
};

// All phases that contain claimable / recently active bounties
const PHASES = ["OPEN", "PENDING_RESOLUTION", "IN_DISPUTE_PERIOD", "CLOSED"];

interface Task {
  taskId:         string;
  title:          string;
  bodyMarkdown?:  string;
  status?:        string;
  rewardTotalUsd?: number;
  expiresAt?:     string;
  createdAt?:     string;
  creatorAddress?: string;
  rewardLegs?:    unknown[];
  coinAddress?:   string;
  counts?:        { submissionCount?: number; disputeCount?: number };
}

interface PageResp { items: Task[]; nextCursor?: string | null; }

async function fetchPage(phase: string, cursor?: string): Promise<PageResp> {
  const url = new URL(`${LIVESTREAM}/bounties/v2/tasks`);
  url.searchParams.set("phase", phase);
  url.searchParams.set("sort", "rewardTotalUsd");
  url.searchParams.set("order", "desc");
  url.searchParams.set("limit", "50");
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), { headers: HDR });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} — ${txt.slice(0, 100)}`);
  }
  return res.json() as Promise<PageResp>;
}

async function fetchPhase(phase: string): Promise<Task[]> {
  const all: Task[] = [];
  let cursor: string | undefined;
  let page = 0;

  do {
    const data = await fetchPage(phase, cursor);
    const items = data.items ?? [];
    all.push(...items);
    cursor = data.nextCursor ?? undefined;
    page++;
    process.stdout.write(`    page ${String(page).padStart(2)}: +${String(items.length).padStart(2)}  total: ${all.length}\n`);
    if (!cursor || items.length === 0) break;
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 80));
  } while (cursor);

  return all;
}

function toStatus(raw = "open"): "active" | "completed" | "expired" | "cancelled" {
  const s = raw.toLowerCase();
  if (["open","active","live","pending_resolution","in_dispute_period"].includes(s)) return "active";
  if (["closed","done","completed","paid","winner_payout"].includes(s)) return "completed";
  if (s === "expired") return "expired";
  if (["cancelled","canceled"].includes(s)) return "cancelled";
  return "active";
}

function hashDesc(text: string) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Agent GO — Full Pump.fun GO Seed (all phases)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── 1. Fetch stats ──────────────────────────────────────────────────────────
  try {
    const statsRes = await fetch(`${LIVESTREAM}/bounties/v2/stats`, { headers: HDR });
    const stats = await statsRes.json() as Record<string, number>;
    console.log("[stats] from pump.fun GO:");
    for (const [k, v] of Object.entries(stats)) {
      console.log(`  ${k.padEnd(28)} ${typeof v === "number" ? (String(Math.round(v as number)).padStart(8)) : v}`);
    }
    console.log();
  } catch {/* ignore */}

  // ── 2. Fetch all phases ─────────────────────────────────────────────────────
  const allTasks = new Map<string, Task>();

  for (const phase of PHASES) {
    console.log(`[fetch] phase: ${phase}`);
    try {
      const tasks = await fetchPhase(phase);
      let added = 0;
      for (const t of tasks) {
        if (t.taskId && !allTasks.has(t.taskId)) {
          allTasks.set(t.taskId, t);
          added++;
        }
      }
      console.log(`  → ${tasks.length} fetched, ${added} new unique\n`);
    } catch (err) {
      console.error(`  ✗ phase ${phase} failed: ${(err as Error).message}\n`);
    }
  }

  const tasks = [...allTasks.values()];
  console.log(`\n[total] ${tasks.length} unique bounties across all phases\n`);

  // ── 3. Upsert into DB ───────────────────────────────────────────────────────
  console.log("[upsert] writing to database...\n");
  const db = createDb(DATABASE_URL);
  let inserted = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  for (const task of tasks) {
    if (!task.taskId || !task.title) { skipped++; continue; }
    const reward = task.rewardTotalUsd ?? 0;
    if (reward <= 0) { skipped++; continue; }

    const description = (task.bodyMarkdown ?? "").trim();
    const link = `https://pump.fun/go/${task.taskId}`;
    const deadline = task.expiresAt ? new Date(task.expiresAt) : null;
    const status = toStatus(task.status);
    const descriptionHash = hashDesc(description);

    try {
      const existing = await db.query.bounties.findFirst({
        where: (t, { eq }) => eq(t.externalId, task.taskId),
        columns: { id: true },
      });

      if (existing) {
        await db.update(schema.bounties)
          .set({
            title: task.title,
            description,
            rewardUsd: String(reward),
            status,
            deadline,
            link,
            descriptionHash,
            updatedAt: new Date(),
          })
          .where(eq(schema.bounties.externalId, task.taskId));
        updated++;
      } else {
        await db.insert(schema.bounties).values({
          externalId: task.taskId,
          title: task.title,
          description,
          rewardUsd: String(reward),
          status,
          deadline,
          link,
          creatorAddress: task.creatorAddress ?? null,
          descriptionHash,
          rawData: task as unknown as Record<string, unknown>,
        });
        inserted++;
      }
    } catch (err) {
      skipped++;
      const msg = `${task.taskId}: ${(err as Error).message.slice(0, 60)}`;
      errors.push(msg);
    }
  }

  console.log(`  ✓ inserted : ${inserted}`);
  console.log(`  ↻ updated  : ${updated}`);
  console.log(`  ○ skipped  : ${skipped}`);
  if (errors.length) {
    console.log(`  ✗ errors   : ${errors.length}`);
    errors.slice(0, 3).forEach(e => console.log(`    ${e}`));
  }

  // ── 4. Summary ──────────────────────────────────────────────────────────────
  const allInDb = await db.select({ id: schema.bounties.id }).from(schema.bounties);
  const topRows = await db
    .select({ title: schema.bounties.title, rewardUsd: schema.bounties.rewardUsd, status: schema.bounties.status, link: schema.bounties.link })
    .from(schema.bounties)
    .orderBy(schema.bounties.rewardUsd)
    .limit(1000); // get all, sort in JS

  const sorted = topRows
    .filter(r => r.rewardUsd)
    .sort((a, b) => parseFloat(b.rewardUsd) - parseFloat(a.rewardUsd))
    .slice(0, 20);

  console.log(`\n[db total] ${allInDb.length} bounties\n`);
  console.log("[preview] top 20 by reward:\n");
  for (const b of sorted) {
    const r = `$${parseFloat(b.rewardUsd).toFixed(0)}`.padStart(8);
    const s = b.status.padEnd(10);
    const t = b.title.length > 55 ? b.title.slice(0, 52) + "..." : b.title;
    console.log(`  ${r}  ${s}  ${t}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(0);
}

main().catch(err => {
  console.error("\n✗ Fatal:", err.message);
  process.exit(1);
});
