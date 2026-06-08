import { createHash } from "crypto";
import type { NormalizedBounty, BountyStatus } from "@agent-go/shared";

// Shape returned by livestream-api.pump.fun/bounties/v2/tasks
interface LivestreamTask {
  taskId: string;
  title: string;
  bodyMarkdown?: string;
  creatorAddress?: string;
  status?: string;               // "OPEN" | "PENDING_RESOLUTION" | "CLOSED" | "IN_DISPUTE_PERIOD"
  expiresAt?: string;
  rewardTotalUsd?: number;
  rewardLegs?: Array<{
    amountAtomic?: string;
    mintAddress?: string;
    decimalsSnapshot?: number;
  }>;
  coinAddress?: string;
  // fields from older API versions (fallback)
  id?: string | number;
  description?: string;
  reward_usd?: number | string;
  reward?: number | string;
  amount?: number | string;
  url?: string;
  link?: string;
  slug?: string;
  creator?: string | { address: string };
}

const STATUS_MAP: Record<string, BountyStatus> = {
  open: "active",
  active: "active",
  live: "active",
  pending_resolution: "active",   // still claimable
  in_dispute_period: "active",
  closed: "expired",
  completed: "completed",
  done: "completed",
  paid: "completed",
  expired: "expired",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export function normalizeBounty(raw: unknown): NormalizedBounty | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as LivestreamTask;

  // ── ID ───────────────────────────────────────────────────────────────────
  const externalId = d.taskId ?? (d.id != null ? String(d.id) : null);
  if (!externalId) return null;

  // ── Title ────────────────────────────────────────────────────────────────
  const title = (d.title ?? "").trim();
  if (!title) return null;

  // ── Description — prefer bodyMarkdown, fall back to description field ────
  const description = (d.bodyMarkdown ?? d.description ?? "").trim();

  // ── Reward USD ───────────────────────────────────────────────────────────
  let rewardUsd: number;
  if (typeof d.rewardTotalUsd === "number" && d.rewardTotalUsd > 0) {
    rewardUsd = d.rewardTotalUsd;
  } else {
    const fallback = d.reward_usd ?? d.reward ?? d.amount ?? 0;
    rewardUsd = Number(fallback);
  }
  if (rewardUsd <= 0) return null;

  // ── Status ───────────────────────────────────────────────────────────────
  const rawStatus = (d.status ?? "active").toLowerCase();
  const status = STATUS_MAP[rawStatus] ?? "active";

  // ── Link ─────────────────────────────────────────────────────────────────
  const link =
    d.url ??
    d.link ??
    (d.taskId ? `https://pump.fun/go/${d.taskId}` : null) ??
    (d.slug ? `https://pump.fun/go/${d.slug}` : null);

  if (!link) return null;

  // ── Deadline — expiresAt (new API) or deadline (old API) ─────────────────
  const deadlineRaw = (d as unknown as Record<string, unknown>).deadline;
  const deadline = d.expiresAt
    ? parseDate(d.expiresAt)
    : deadlineRaw != null
      ? parseDate(deadlineRaw as string | number)
      : null;

  // ── Creator address ───────────────────────────────────────────────────────
  const creatorAddress =
    typeof d.creator === "string"
      ? d.creator
      : d.creator?.address ?? d.creatorAddress ?? null;

  return {
    externalId,
    title,
    description,
    rewardUsd,
    deadline,
    link,
    status,
    creatorAddress,
    rawData: raw as Record<string, unknown>,
  };
}

function parseDate(value: string | number | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function hashDescription(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// Keep RawBounty export for backward compat with tests
export type RawBounty = LivestreamTask;
