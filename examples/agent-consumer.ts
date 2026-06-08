/**
 * Agent Consumer Example
 *
 * Demonstrates how an AI agent pays for and consumes the Agent GO API using
 * the @x402/fetch wrapper and a Solana wallet.
 *
 * Usage:
 *   npx tsx examples/agent-consumer.ts
 *
 * Requirements:
 *   npm install @x402/fetch @solana/kit
 *   Set env vars: AGENT_WALLET_PRIVATE_KEY, API_BASE_URL
 */

import { wrapFetchWithPayment } from "@x402/fetch";

// ── Configuration ─────────────────────────────────────────────────────────────
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3000";
const WALLET_PRIVATE_KEY = process.env.AGENT_WALLET_PRIVATE_KEY;

if (!WALLET_PRIVATE_KEY) {
  console.error("Set AGENT_WALLET_PRIVATE_KEY env var to a base58-encoded Solana private key.");
  process.exit(1);
}

// ── x402-enabled fetch ────────────────────────────────────────────────────────
// wrapFetchWithPayment intercepts 402 responses, signs the payment with the
// provided wallet, and retries automatically.
async function createAgentFetch() {
  const { Keypair } = await import("@solana/kit");
  const keypair = Keypair.fromSecretKey(
    Buffer.from(WALLET_PRIVATE_KEY!, "base58"),
  );

  return wrapFetchWithPayment(fetch, {
    wallet: keypair,
    onPayment: (details) => {
      console.log(`  [x402] Paid ${details.amount} ${details.asset} — tx: ${details.txHash}`);
    },
  });
}

// ── Example 1: Fetch automatable bounties ─────────────────────────────────────
async function fetchAutomatableBounties(agentFetch: typeof fetch) {
  console.log("\n=== Fetching automatable bounties ($0.05) ===");

  const res = await agentFetch(`${API_BASE}/v1/bounties/automatable?limit=10`);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${await res.text()}`);
  }

  const { data } = (await res.json()) as {
    data: Array<{
      id: string;
      title: string;
      rewardUsd: string;
      classification: {
        category: string;
        confidence: number;
        effortEstimate: string;
        rewardToEffortRatio: number;
        reasoning: string;
      };
    }>;
  };

  console.log(`Found ${data.length} automatable bounties:\n`);
  for (const b of data) {
    console.log(
      `  [${b.rewardUsd} USD | ratio: ${b.classification.rewardToEffortRatio}] ${b.title}`,
    );
    console.log(
      `    effort: ${b.classification.effortEstimate} | confidence: ${(b.classification.confidence * 100).toFixed(0)}%`,
    );
    console.log(`    ${b.classification.reasoning}\n`);
  }

  return data;
}

// ── Example 2: Subscribe to new bounties ─────────────────────────────────────
async function subscribeToNewBounties(agentFetch: typeof fetch) {
  console.log("\n=== Creating webhook subscription ($0.10) ===");

  const res = await agentFetch(`${API_BASE}/v1/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      webhookUrl: "https://your-agent-endpoint.example.com/webhook",
      filters: {
        categories: ["digital_automatable"],
        minReward: 10,
        keywords: ["scraping", "research", "on-chain", "analysis", "content"],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${await res.text()}`);
  }

  const sub = await res.json();
  console.log("Subscription created:");
  console.log(`  ID:         ${sub.id}`);
  console.log(`  Expires:    ${sub.expiresAt}`);
  console.log(`  HMAC secret: ${sub.hmacSecret}`);
  console.log("\nVerify incoming webhooks with:");
  console.log(
    `  HMAC-SHA256(secret="${sub.hmacSecret}", body=<payload>) === X-Agent-Go-Signature header`,
  );

  return sub;
}

// ── Example 3: Health check (free) ───────────────────────────────────────────
async function checkHealth() {
  console.log("\n=== Health check (free) ===");
  const res = await fetch(`${API_BASE}/v1/health`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await checkHealth();

  const agentFetch = await createAgentFetch();

  await fetchAutomatableBounties(agentFetch);
  await subscribeToNewBounties(agentFetch);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
