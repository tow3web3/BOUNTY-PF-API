import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a single shared messages.create mock
const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

// Stub config and logger before importing the service
vi.mock("../config", () => ({
  config: {
    ANTHROPIC_API_KEY: "test-key",
    NODE_ENV: "test",
    PORT: 3000,
    DATABASE_URL: "postgresql://test:test@localhost/test",
    PAYMENT_ADDRESS: "TestAddr",
    X402_FACILITATOR_URL: "https://x402.org/facilitator",
    X402_NETWORK: "solana:devnet",
  },
}));

vi.mock("../logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { callLlm } from "../services/classification";

function setLlmResponse(text: string) {
  mockCreate.mockResolvedValue({ content: [{ type: "text", text }] });
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("callLlm", () => {
  it("parses a valid digital_automatable response", async () => {
    setLlmResponse(
      JSON.stringify({
        category: "digital_automatable",
        confidence: 0.95,
        effort_estimate: "low",
        reasoning: "Simple scraping task completable by an AI agent.",
      }),
    );

    const result = await callLlm("Scrape 100 tweets", "Collect top 100 tweets about Solana");
    expect(result.category).toBe("digital_automatable");
    expect(result.confidence).toBe(0.95);
    expect(result.effortEstimate).toBe("low");
    expect(result.reasoning).toContain("scraping");
  });

  it("parses a physical category response", async () => {
    setLlmResponse(
      JSON.stringify({
        category: "physical",
        confidence: 0.99,
        effort_estimate: "high",
        reasoning: "Task requires physical delivery to a location.",
      }),
    );

    const result = await callLlm("Deliver a package", "Physical delivery to NYC");
    expect(result.category).toBe("physical");
    expect(result.effortEstimate).toBe("high");
  });

  it("parses a digital_human response", async () => {
    setLlmResponse(
      JSON.stringify({
        category: "digital_human",
        confidence: 0.87,
        effort_estimate: "medium",
        reasoning: "Requires human creative judgment.",
      }),
    );

    const result = await callLlm("Write a viral tweet", "Create a tweet that goes viral");
    expect(result.category).toBe("digital_human");
  });

  it("throws on malformed JSON from LLM", async () => {
    setLlmResponse("not json at all {broken");
    await expect(callLlm("Test", "Test")).rejects.toThrow();
  });

  it("throws on missing required fields", async () => {
    setLlmResponse(JSON.stringify({ category: "digital_automatable" }));
    await expect(callLlm("Test", "Test")).rejects.toThrow(/Invalid LLM/);
  });

  it("throws on invalid category value", async () => {
    setLlmResponse(
      JSON.stringify({
        category: "unknown_category",
        confidence: 0.8,
        effort_estimate: "low",
        reasoning: "Something.",
      }),
    );
    await expect(callLlm("Test", "Test")).rejects.toThrow();
  });

  it("throws on out-of-range confidence", async () => {
    setLlmResponse(
      JSON.stringify({
        category: "digital_automatable",
        confidence: 1.5,
        effort_estimate: "low",
        reasoning: "Something.",
      }),
    );
    await expect(callLlm("Test", "Test")).rejects.toThrow();
  });
});
