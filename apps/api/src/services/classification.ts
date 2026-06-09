import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import type { DB } from "@bountr/shared";
import { schema, LlmClassificationOutputSchema, type ClassificationResult } from "@bountr/shared";
import { config } from "../config";
import { logger } from "../logger";

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
- digital_human: Digital task that requires a human (creative judgment, legal review, account ownership, identity verification, real-time human interaction).
- physical: Requires physical presence or physical-world action (delivery, photography, hardware, etc.).

Effort estimates (for digital_automatable only, otherwise use "high"):
- low: < 1 min AI processing
- medium: 1–10 min AI processing
- high: > 10 min AI processing or multi-step pipelines`;

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export async function classifyBounty(
  db: DB,
  bountyId: string,
  title: string,
  description: string,
  descriptionHash: string,
): Promise<ClassificationResult> {
  // Check cache: only re-classify if description changed
  const existing = await db.query.bountyClassifications.findFirst({
    where: eq(schema.bountyClassifications.bountyId, bountyId),
  });

  if (existing && existing.descriptionHashAtClassification === descriptionHash) {
    return {
      category: existing.category as ClassificationResult["category"],
      confidence: parseFloat(existing.confidence),
      effortEstimate: existing.effortEstimate as ClassificationResult["effortEstimate"],
      reasoning: existing.reasoning,
    };
  }

  const result = await callLlm(title, description);

  await db
    .insert(schema.bountyClassifications)
    .values({
      bountyId,
      category: result.category,
      confidence: result.confidence.toFixed(2),
      effortEstimate: result.effortEstimate,
      reasoning: result.reasoning,
      descriptionHashAtClassification: descriptionHash,
    })
    .onConflictDoUpdate({
      target: schema.bountyClassifications.bountyId,
      set: {
        category: result.category,
        confidence: result.confidence.toFixed(2),
        effortEstimate: result.effortEstimate,
        reasoning: result.reasoning,
        classifiedAt: new Date(),
        descriptionHashAtClassification: descriptionHash,
      },
    });

  logger.debug({ bountyId, category: result.category }, "Bounty classified");
  return result;
}

export async function callLlm(title: string, description: string): Promise<ClassificationResult> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: CLASSIFICATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Title: ${title}\n\nDescription: ${description}`,
      },
    ],
  });

  const rawText =
    message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

  const parsed = LlmClassificationOutputSchema.safeParse(JSON.parse(rawText));
  if (!parsed.success) {
    logger.error({ rawText, issues: parsed.error.issues }, "LLM returned invalid classification");
    throw new Error(`Invalid LLM classification output: ${parsed.error.message}`);
  }

  return {
    category: parsed.data.category,
    confidence: parsed.data.confidence,
    effortEstimate: parsed.data.effort_estimate,
    reasoning: parsed.data.reasoning,
  };
}
