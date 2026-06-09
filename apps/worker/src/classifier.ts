import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import type { DB } from "@bountr/shared";
import { schema, LlmClassificationOutputSchema, type ClassificationResult } from "@bountr/shared";
import { logger } from "./logger";

// Re-uses the same classification logic as the API service.
// The worker classifies all new bounties in the background so
// /v1/bounties/automatable is always pre-populated.

const CLASSIFICATION_SYSTEM_PROMPT = `You are a bounty classification system. Given a bounty title and description, output ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON.

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

let client: Anthropic | null = null;

function getClient(apiKey: string): Anthropic {
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export async function classifyNewBounties(db: DB, anthropicApiKey: string): Promise<void> {
  // Find bounties that have no classification or whose description changed
  const unclassified = await db
    .select({ bounty: schema.bounties, cls: schema.bountyClassifications })
    .from(schema.bounties)
    .leftJoin(
      schema.bountyClassifications,
      eq(schema.bounties.id, schema.bountyClassifications.bountyId),
    )
    .where(eq(schema.bounties.status, "active"))
    .limit(20); // Process in batches

  const toClassify = unclassified.filter(
    ({ bounty, cls }) =>
      !cls || cls.descriptionHashAtClassification !== bounty.descriptionHash,
  );

  if (toClassify.length === 0) return;

  logger.info({ count: toClassify.length }, "Classifying bounties");

  for (const { bounty } of toClassify) {
    try {
      await classifyOne(db, anthropicApiKey, bounty);
    } catch (err) {
      logger.error({ err, bountyId: bounty.id }, "Classification failed — skipping");
    }
  }
}

async function classifyOne(
  db: DB,
  anthropicApiKey: string,
  bounty: typeof schema.bounties.$inferSelect,
): Promise<ClassificationResult> {
  const llm = getClient(anthropicApiKey);

  const message = await llm.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: CLASSIFICATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Title: ${bounty.title}\n\nDescription: ${bounty.description}`,
      },
    ],
  });

  const rawText =
    message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

  const parsed = LlmClassificationOutputSchema.safeParse(JSON.parse(rawText));
  if (!parsed.success) {
    throw new Error(`Invalid LLM output: ${parsed.error.message}`);
  }

  const result: ClassificationResult = {
    category: parsed.data.category,
    confidence: parsed.data.confidence,
    effortEstimate: parsed.data.effort_estimate,
    reasoning: parsed.data.reasoning,
  };

  await db
    .insert(schema.bountyClassifications)
    .values({
      bountyId: bounty.id,
      category: result.category,
      confidence: result.confidence.toFixed(2),
      effortEstimate: result.effortEstimate,
      reasoning: result.reasoning,
      descriptionHashAtClassification: bounty.descriptionHash,
    })
    .onConflictDoUpdate({
      target: schema.bountyClassifications.bountyId,
      set: {
        category: result.category,
        confidence: result.confidence.toFixed(2),
        effortEstimate: result.effortEstimate,
        reasoning: result.reasoning,
        classifiedAt: new Date(),
        descriptionHashAtClassification: bounty.descriptionHash,
      },
    });

  logger.debug({ bountyId: bounty.id, category: result.category }, "Classified");
  return result;
}
