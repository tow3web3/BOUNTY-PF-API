import { z } from "zod";

// ── Enums ────────────────────────────────────────────────────────────────────

export const BountyStatusSchema = z.enum(["active", "completed", "expired", "cancelled"]);

export const BountyCategorySchema = z.enum([
  "digital_automatable",
  "digital_human",
  "physical",
]);

export const EffortEstimateSchema = z.enum(["low", "medium", "high"]);

// ── Bounty ───────────────────────────────────────────────────────────────────

export const NormalizedBountySchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  rewardUsd: z.number().positive(),
  deadline: z.date().nullable(),
  link: z.string().url(),
  status: BountyStatusSchema,
  creatorAddress: z.string().nullable(),
  rawData: z.record(z.unknown()),
});

export const BountyResponseSchema = z.object({
  id: z.string().uuid(),
  externalId: z.string(),
  title: z.string(),
  description: z.string(),
  rewardUsd: z.string(),
  deadline: z.string().datetime().nullable(),
  link: z.string().url(),
  status: BountyStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const BountyWithClassificationSchema = BountyResponseSchema.extend({
  classification: z
    .object({
      category: BountyCategorySchema,
      confidence: z.number(),
      effortEstimate: EffortEstimateSchema,
      reasoning: z.string(),
      rewardToEffortRatio: z.number(),
    })
    .nullable(),
});

// ── Classification ───────────────────────────────────────────────────────────

export const ClassificationResultSchema = z.object({
  category: BountyCategorySchema,
  confidence: z.number().min(0).max(1),
  effortEstimate: EffortEstimateSchema,
  reasoning: z.string().min(1),
});

// The strict LLM output schema (subset without reasoning for the JSON block)
export const LlmClassificationOutputSchema = z.object({
  category: BountyCategorySchema,
  confidence: z.number().min(0).max(1),
  effort_estimate: EffortEstimateSchema,
  reasoning: z.string().min(1),
});

// ── Subscriptions ────────────────────────────────────────────────────────────

export const SubscriptionFiltersSchema = z.object({
  keywords: z.array(z.string()).optional(),
  minReward: z.number().positive().optional(),
  categories: z.array(BountyCategorySchema).optional(),
});

export const CreateSubscriptionBodySchema = z.object({
  webhookUrl: z.string().url(),
  filters: SubscriptionFiltersSchema.optional().default({}),
});

export const SubscriptionResponseSchema = z.object({
  id: z.string().uuid(),
  webhookUrl: z.string().url(),
  filters: SubscriptionFiltersSchema,
  expiresAt: z.string().datetime(),
  hmacSecret: z.string(),
  createdAt: z.string().datetime(),
});

// ── Pagination ────────────────────────────────────────────────────────────────

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── Webhook payload ───────────────────────────────────────────────────────────

export const WebhookPayloadSchema = z.object({
  event: z.literal("bounty.new"),
  subscriptionId: z.string().uuid(),
  bounty: BountyResponseSchema,
  matchedFilters: SubscriptionFiltersSchema,
  timestamp: z.string().datetime(),
});
