import { logger } from "./logger";
import { normalizeBounty, type RawBounty } from "./normalizer";
import type { NormalizedBounty } from "@agent-go/shared";

// Candidate REST endpoints — tried in order; first successful one wins.
const REST_CANDIDATES = [
  "https://go.pump.fun/api/bounties",
  "https://go-api.pump.fun/bounties",
  "https://frontend-api-v3.pump.fun/bounties",
  "https://frontend-api-v3.pump.fun/go/bounties",
];

const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "AgentGO-Worker/1.0 (+https://github.com/your-org/agent-go; bounty-indexer; respects robots.txt)";

export interface ScraperResult {
  bounties: NormalizedBounty[];
  source: "rest" | "playwright" | "dry_run";
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function scrapeBounties(opts: { dryRun?: boolean } = {}): Promise<ScraperResult> {
  if (opts.dryRun) {
    logger.info("Scraper dry-run mode — returning empty set");
    return { bounties: [], source: "dry_run" };
  }

  // 1. Try REST endpoints
  const restResult = await tryRestEndpoints();
  if (restResult !== null) {
    return { bounties: restResult, source: "rest" };
  }

  // 2. Fall back to Playwright
  logger.warn("All REST endpoints failed — falling back to Playwright headless scraper");
  try {
    const pwResult = await scrapeWithPlaywright();
    return { bounties: pwResult, source: "playwright" };
  } catch (err) {
    logger.error({ err }, "Playwright scraper failed — degraded mode, returning empty set");
    return { bounties: [], source: "playwright" };
  }
}

// ── REST probing ──────────────────────────────────────────────────────────────

async function tryRestEndpoints(): Promise<NormalizedBounty[] | null> {
  for (const url of REST_CANDIDATES) {
    try {
      const raw = await fetchJson(url);
      const items = extractArray(raw);
      if (items.length > 0) {
        const bounties = items.flatMap((item) => {
          const b = normalizeBounty(item);
          return b ? [b] : [];
        });
        logger.info({ url, count: bounties.length }, "Fetched bounties via REST");
        return bounties;
      }
    } catch (err) {
      logger.debug({ url, err: (err as Error).message }, "REST endpoint miss");
    }
  }
  return null;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        Origin: "https://go.pump.fun",
        Referer: "https://go.pump.fun/",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of ["bounties", "data", "items", "results", "list"]) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

// ── Playwright fallback ───────────────────────────────────────────────────────

async function scrapeWithPlaywright(): Promise<NormalizedBounty[]> {
  // Dynamically import playwright so the worker still boots if it's not installed
  const { chromium } = await import("playwright").catch(() => {
    throw new Error("playwright package not available — install it or fix REST endpoints");
  });

  const browser = await chromium.launch({ headless: true });
  const intercepted: unknown[] = [];

  try {
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({ "User-Agent": USER_AGENT });

    // Intercept XHR/fetch calls that look like bounty API responses
    page.on("response", async (response) => {
      const url = response.url();
      const ct = response.headers()["content-type"] ?? "";
      if (ct.includes("application/json") && /bounti|go\.pump|go-api/i.test(url)) {
        try {
          const json = await response.json();
          const items = extractArray(json);
          intercepted.push(...items);
        } catch {
          // not parseable
        }
      }
    });

    await page.goto("https://go.pump.fun", { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(3_000);

    if (intercepted.length > 0) {
      logger.info({ count: intercepted.length }, "Intercepted bounties via Playwright network");
      return intercepted.flatMap((item) => {
        const b = normalizeBounty(item);
        return b ? [b] : [];
      });
    }

    // DOM fallback: parse bounty cards
    const domBounties = await page.evaluate(() => {
      const cards = document.querySelectorAll("[data-bounty-id], .bounty-card, [class*='bounty']");
      return Array.from(cards).map((el) => ({
        id: el.getAttribute("data-bounty-id") ?? el.id ?? Math.random().toString(36).slice(2),
        title: el.querySelector("h1,h2,h3,[class*='title']")?.textContent?.trim() ?? "",
        description: el.querySelector("p,[class*='desc']")?.textContent?.trim() ?? "",
        reward_usd:
          parseFloat(
            el.querySelector("[class*='reward'],[class*='amount']")?.textContent?.replace(/[^0-9.]/g, "") ?? "0",
          ) || 0,
        url: (el.querySelector("a") as HTMLAnchorElement | null)?.href ?? window.location.href,
        status: "active",
      }));
    });

    logger.info({ count: domBounties.length }, "Scraped bounties via Playwright DOM");
    return domBounties.flatMap((item) => {
      const b = normalizeBounty(item);
      return b ? [b] : [];
    });
  } finally {
    await browser.close();
  }
}
