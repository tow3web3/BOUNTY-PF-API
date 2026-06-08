import { createHash } from "crypto";
import { z } from "zod";
import type { NormalizedBounty, BountyStatus } from "@agent-go/shared";

// Raw schema from go.pump.fun (best-effort — fields may change)
export const RawBountySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().optional().default("Untitled"),
  description: z.string().optional().default(""),
  reward: z.union([z.string(), z.number()]).transform(Number).optional(),
  reward_usd: z.union([z.string(), z.number()]).transform(Number).optional(),
  amount: z.union([z.string(), z.number()]).transform(Number).optional(),
  deadline: z.union([z.string(), z.number(), z.null()]).optional(),
  url: z.string().optional(),
  link: z.string().optional(),
  slug: z.string().optional(),
  status: z.string().optional().default("active"),
  creator: z
    .union([z.string(), z.object({ address: z.string() })])
    .optional(),
});

export type RawBounty = z.infer<typeof RawBountySchema>;

const STATUS_MAP: Record<string, BountyStatus> = {
  active: "active",
  open: "active",
  live: "active",
  completed: "completed",
  done: "completed",
  paid: "completed",
  expired: "expired",
  closed: "expired",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export function normalizeBounty(raw: unknown): NormalizedBounty | null {
  const parsed = RawBountySchema.safeParse(raw);
  if (!parsed.success) return null;

  const d = parsed.data;
  const rewardUsd = d.reward_usd ?? d.reward ?? d.amount ?? 0;
  if (rewardUsd <= 0) return null;

  const link =
    d.url ?? d.link ?? (d.slug ? `https://go.pump.fun/bounty/${d.slug}` : null);
  if (!link) return null;

  const deadline = parseDeadline(d.deadline);
  const status = STATUS_MAP[d.status.toLowerCase()] ?? "active";
  const creatorAddress =
    typeof d.creator === "string"
      ? d.creator
      : d.creator?.address ?? null;

  return {
    externalId: d.id,
    title: d.title.trim(),
    description: d.description.trim(),
    rewardUsd,
    deadline,
    link,
    status,
    creatorAddress,
    rawData: raw as Record<string, unknown>,
  };
}

function parseDeadline(value: string | number | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function hashDescription(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
