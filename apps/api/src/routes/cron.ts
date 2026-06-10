import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import type { DB } from "@bountr/shared";
import { schema } from "@bountr/shared";
import type { Config } from "../config";

const LIVESTREAM_API = "https://livestream-api.pump.fun";
const PAGE_SIZE = 50;
const TIMEOUT_MS = 15_000;

const STATUS_MAP: Record<string, string> = {
  open: "active", active: "active", live: "active",
  pending_resolution: "active", in_dispute_period: "active",
  closed: "expired", completed: "completed", done: "completed",
  paid: "completed", expired: "expired", cancelled: "cancelled",
};

const CLASSIFICATION_PROMPT = `You are a bounty classification system. Given a bounty title and description, output ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON.

Output schema:
{
  "category": "digital_automatable" | "digital_human" | "physical",
  "confidence": <number 0.0–1.0>,
  "effort_estimate": "low" | "medium" | "high",
  "reasoning": "<one sentence>"
}

Category definitions:
- digital_automatable: Can be completed by an AI agent with no human intervention (scraping, research, data extraction, content generation, on-chain analysis, code generation, summarization).
- digital_human: Digital task requiring a human (creative judgment, legal review, account ownership, identity verification, real-time human interaction).
- physical: Requires physical presence or physical-world action.

Effort estimates (for digital_automatable; otherwise use "high"):
- low: < 1 min AI processing
- medium: 1–10 min AI processing
- high: > 10 min or multi-step pipeline`;

// ── Scraper ───────────────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Origin": "https://pump.fun",
        "Referer": "https://pump.fun/go",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(t);
  }
}

function normalize(raw: unknown): null | {
  externalId: string; title: string; description: string;
  rewardUsd: number; status: string; link: string; descriptionHash: string;
  deadline: Date | null; creatorAddress: string | null; rawData: Record<string, unknown>;
} {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const externalId = (d.taskId ?? (d.id != null ? String(d.id) : null)) as string | null;
  if (!externalId) return null;
  const title = ((d.title as string) ?? "").trim();
  if (!title) return null;
  const rewardUsd = typeof d.rewardTotalUsd === "number" && d.rewardTotalUsd > 0
    ? d.rewardTotalUsd
    : Number(d.reward_usd ?? d.reward ?? d.amount ?? 0);
  if (rewardUsd <= 0) return null;
  const description = ((d.bodyMarkdown ?? d.description ?? "") as string).trim();
  const rawStatus = ((d.status ?? "active") as string).toLowerCase();
  const status = STATUS_MAP[rawStatus] ?? "active";
  const link = (d.url ?? d.link ??
    (d.taskId ? `https://pump.fun/go/${d.taskId}` : null) ??
    (d.slug ? `https://pump.fun/go/${d.slug}` : null)) as string | null;
  if (!link) return null;
  const expiresAt = d.expiresAt as string | undefined;
  const deadline = expiresAt ? new Date(expiresAt) : null;
  const creatorAddress = (typeof d.creator === "string" ? d.creator
    : (d.creator as { address?: string })?.address ?? d.creatorAddress ?? null) as string | null;
  const descriptionHash = createHash("sha256").update(description).digest("hex").slice(0, 16);
  return { externalId, title, description, rewardUsd, status, link, descriptionHash, deadline, creatorAddress, rawData: d };
}

async function scrape() {
  const phases = ["OPEN", "PENDING_RESOLUTION"];
  const all: ReturnType<typeof normalize>[] = [];
  for (const phase of phases) {
    let offset = 0;
    while (true) {
      const url = `${LIVESTREAM_API}/bounties/v2/tasks?phase=${phase}&sort=rewardTotalUsd&order=desc&limit=${PAGE_SIZE}&offset=${offset}`;
      const data = await fetchJson(url) as { items?: unknown[] };
      const items = data.items ?? [];
      all.push(...items.map(normalize));
      if (items.length < PAGE_SIZE || offset >= 500) break;
      offset += PAGE_SIZE;
    }
  }
  return all.filter(Boolean) as NonNullable<ReturnType<typeof normalize>>[];
}

// ── Upsert ────────────────────────────────────────────────────────────────────

async function upsertBounties(db: DB, bounties: NonNullable<ReturnType<typeof normalize>>[]) {
  let newCount = 0;
  for (const b of bounties) {
    const existing = await db.query.bounties.findFirst({
      where: eq(schema.bounties.externalId, b.externalId),
    });
    if (!existing) {
      await db.insert(schema.bounties).values({
        externalId: b.externalId,
        title: b.title,
        description: b.description,
        rewardUsd: b.rewardUsd.toFixed(2),
        deadline: b.deadline ?? undefined,
        link: b.link,
        status: b.status as "active",
        rawData: b.rawData,
        descriptionHash: b.descriptionHash,
        creatorAddress: b.creatorAddress,
      });
      newCount++;
    } else if (existing.status !== b.status || existing.descriptionHash !== b.descriptionHash) {
      await db.update(schema.bounties)
        .set({ status: b.status as "active", description: b.description, descriptionHash: b.descriptionHash, rewardUsd: b.rewardUsd.toFixed(2), updatedAt: new Date() })
        .where(eq(schema.bounties.id, existing.id));
    }
  }
  return newCount;
}

// ── Classifier ────────────────────────────────────────────────────────────────

async function classifyPending(db: DB, openaiApiKey: string, max = 10) {
  if (!openaiApiKey) return 0;
  const rows = await db.select({ bounty: schema.bounties, cls: schema.bountyClassifications })
    .from(schema.bounties)
    .leftJoin(schema.bountyClassifications, eq(schema.bounties.id, schema.bountyClassifications.bountyId))
    .where(eq(schema.bounties.status, "active"))
    .limit(30);

  const toClassify = rows
    .filter(({ cls, bounty }) => !cls || cls.descriptionHashAtClassification !== bounty.descriptionHash)
    .slice(0, max);

  if (toClassify.length === 0) return 0;

  const llm = new OpenAI({ apiKey: openaiApiKey });
  let classified = 0;

  for (const { bounty } of toClassify) {
    try {
      const resp = await llm.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 256,
        messages: [
          { role: "system", content: CLASSIFICATION_PROMPT },
          { role: "user", content: `Title: ${bounty.title}\n\nDescription: ${bounty.description}` },
        ],
      });
      const parsed = JSON.parse(resp.choices[0]?.message?.content?.trim() ?? "{}");
      if (parsed.category) {
        await db.insert(schema.bountyClassifications).values({
          bountyId: bounty.id,
          category: parsed.category,
          confidence: String(parsed.confidence ?? 0.5),
          effortEstimate: parsed.effort_estimate ?? "medium",
          reasoning: parsed.reasoning ?? "",
          descriptionHashAtClassification: bounty.descriptionHash,
        }).onConflictDoUpdate({
          target: schema.bountyClassifications.bountyId,
          set: { category: parsed.category, confidence: String(parsed.confidence ?? 0.5), effortEstimate: parsed.effort_estimate ?? "medium", reasoning: parsed.reasoning ?? "", classifiedAt: new Date(), descriptionHashAtClassification: bounty.descriptionHash },
        });
        classified++;
      }
    } catch { /* skip failed classifications */ }
  }
  return classified;
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createCronRouter(db: DB, config: Config) {
  const router = new Hono();

  router.post("/scrape", async (c) => {
    const secret = c.req.header("x-cron-secret");
    if (config.CRON_SECRET && secret !== config.CRON_SECRET) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const bounties = await scrape();
      const newCount = await upsertBounties(db, bounties);
      const classified = await classifyPending(db, config.OPENAI_API_KEY ?? "", 10);
      return c.json({ ok: true, scraped: bounties.length, new: newCount, classified });
    } catch (err) {
      return c.json({ ok: false, error: String(err) }, 500);
    }
  });

  return router;
}
