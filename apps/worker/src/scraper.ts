import { logger } from "./logger";
import { normalizeBounty } from "./normalizer";
import type { NormalizedBounty } from "@bountr/shared";

// ── Official undocumented API (discovered via Playwright network intercept) ───
const LIVESTREAM_API = "https://livestream-api.pump.fun";

// Batch size — API supports up to 50 per page
const PAGE_SIZE = 50;
const FETCH_TIMEOUT_MS = 15_000;

export interface ScraperResult {
  bounties: NormalizedBounty[];
  source: "livestream-api" | "playwright" | "dry_run";
  stats?: PumpFunStats;
}

export interface PumpFunStats {
  liveCount: number;
  unclaimedRewardTotalUsd: number;
  submissionCount: number;
  paidOutTotalUsd: number;
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function scrapeBounties(opts: { dryRun?: boolean } = {}): Promise<ScraperResult> {
  if (opts.dryRun) {
    logger.info("Scraper dry-run mode — returning empty set");
    return { bounties: [], source: "dry_run" };
  }

  try {
    const [bounties, stats] = await Promise.all([
      fetchAllBounties(),
      fetchStats(),
    ]);
    logger.info({ count: bounties.length, stats }, "Fetched bounties via livestream-api.pump.fun");
    return { bounties, source: "livestream-api", stats };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "livestream-api failed — falling back to Playwright");
    try {
      const pwResult = await scrapeWithPlaywright();
      return { bounties: pwResult, source: "playwright" };
    } catch (pwErr) {
      logger.error({ err: pwErr }, "Playwright scraper also failed — returning empty set");
      return { bounties: [], source: "playwright" };
    }
  }
}

export async function fetchStats(): Promise<PumpFunStats | undefined> {
  try {
    const data = await fetchJson(`${LIVESTREAM_API}/bounties/v2/stats`) as PumpFunStats;
    return data;
  } catch {
    return undefined;
  }
}

// ── livestream-api pagination ─────────────────────────────────────────────────

async function fetchAllBounties(): Promise<NormalizedBounty[]> {
  const phases = ["OPEN", "PENDING_RESOLUTION"] as const;
  const allItems: unknown[] = [];

  for (const phase of phases) {
    let offset = 0;
    while (true) {
      const url = `${LIVESTREAM_API}/bounties/v2/tasks?phase=${phase}&sort=rewardTotalUsd&order=desc&limit=${PAGE_SIZE}&offset=${offset}`;
      const data = await fetchJson(url) as { items?: unknown[]; total?: number };
      const items = data.items ?? [];
      allItems.push(...items);

      // Stop if we got a partial page (no more data)
      if (items.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;

      // Safety cap — max 500 bounties per cycle
      if (offset >= 500) break;
    }
  }

  return allItems.flatMap((item) => {
    const b = normalizeBounty(item);
    return b ? [b] : [];
  });
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Mimic the browser request pump.fun makes
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Origin": "https://pump.fun",
        "Referer": "https://pump.fun/go",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Playwright fallback ───────────────────────────────────────────────────────

async function scrapeWithPlaywright(): Promise<NormalizedBounty[]> {
  const { chromium } = await import("playwright").catch(() => {
    throw new Error("playwright not available");
  });

  const browser = await chromium.launch({ headless: true });
  const intercepted: unknown[] = [];

  try {
    const page = await browser.newPage();

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("livestream-api.pump.fun/bounties") && url.includes("tasks")) {
        try {
          const json = await response.json() as { items?: unknown[] };
          if (json.items) intercepted.push(...json.items);
        } catch { /* ignore */ }
      }
    });

    await page.goto("https://pump.fun/go", { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(3_000);
    logger.info({ count: intercepted.length }, "Intercepted via Playwright");

    return intercepted.flatMap((item) => {
      const b = normalizeBounty(item);
      return b ? [b] : [];
    });
  } finally {
    await browser.close();
  }
}
