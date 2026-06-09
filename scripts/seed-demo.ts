/**
 * Seed the local DB with demo bounties + classifications for local testing.
 * Usage: npx tsx scripts/seed-demo.ts
 */
import { createDb, schema } from "../packages/shared/src/index";

const db = createDb(
  process.env.DATABASE_URL ??
    "postgresql://gabrieldevarine@localhost:5432/bountr",
);

const DEMO_BOUNTIES = [
  {
    externalId: "demo-001",
    title: "Scrape top 100 Solana wallets by PnL this week",
    description:
      "Use Solana RPC + a DEX indexer to extract the top 100 wallets ranked by realized PnL over the last 7 days. Return a JSON file with address, total_pnl_usd, trade_count.",
    rewardUsd: "75.00",
    link: "https://go.pump.fun/bounty/demo-001",
    status: "active",
    descriptionHash: "aabbcc001122",
    creatorAddress: "DemoCreator1111111111111111111111111111",
  },
  {
    externalId: "demo-002",
    title: "Generate 50 tweet threads about Pump.fun token launches",
    description:
      "Write 50 Twitter/X thread templates (3–5 tweets each) announcing new token launches on pump.fun. Tone: hype but factual. Include placeholder for token name, symbol and supply.",
    rewardUsd: "40.00",
    link: "https://go.pump.fun/bounty/demo-002",
    status: "active",
    descriptionHash: "aabbcc002233",
    creatorAddress: "DemoCreator2222222222222222222222222222",
  },
  {
    externalId: "demo-003",
    title: "On-chain analysis: find wallets that bought BONK before 10x",
    description:
      "Query Solana transaction history to identify wallets that purchased BONK within 24h of launch and held through a 10x price increase. Export as CSV: wallet, buy_time, buy_price, sell_time, sell_price, pnl_usd.",
    rewardUsd: "120.00",
    link: "https://go.pump.fun/bounty/demo-003",
    status: "active",
    descriptionHash: "aabbcc003344",
    creatorAddress: "DemoCreator3333333333333333333333333333",
  },
  {
    externalId: "demo-004",
    title: "Build a simple Telegram bot that alerts on new pump.fun launches",
    description:
      "Create a Telegram bot using the pump.fun websocket feed that sends a message to a channel for every new token with market cap > $10k within 5 min of launch. Open source, MIT license.",
    rewardUsd: "200.00",
    link: "https://go.pump.fun/bounty/demo-004",
    status: "active",
    descriptionHash: "aabbcc004455",
    creatorAddress: "DemoCreator4444444444444444444444444444",
  },
  {
    externalId: "demo-005",
    title: "Design a logo for my Solana meme coin PEPE2",
    description:
      "Need a professional logo for a Solana-based meme token named PEPE2. Must be original, no copyrighted assets. Deliver SVG + PNG 512×512 and 1024×1024.",
    rewardUsd: "30.00",
    link: "https://go.pump.fun/bounty/demo-005",
    status: "active",
    descriptionHash: "aabbcc005566",
    creatorAddress: "DemoCreator5555555555555555555555555555",
  },
  {
    externalId: "demo-006",
    title: "Deliver marketing flyers door-to-door in Miami Beach",
    description:
      "Print and distribute 500 double-sided A5 flyers promoting a Solana hackathon in the South Beach area. Must be completed by June 15. Photos of distribution required as proof.",
    rewardUsd: "150.00",
    link: "https://go.pump.fun/bounty/demo-006",
    status: "active",
    descriptionHash: "aabbcc006677",
    creatorAddress: "DemoCreator6666666666666666666666666666",
  },
  {
    externalId: "demo-007",
    title: "Summarize the top 20 AI research papers published this week",
    description:
      "Search arXiv for the top 20 most-cited AI/ML papers published in the last 7 days. Write a 100-word summary for each. Output as Markdown with links.",
    rewardUsd: "15.00",
    link: "https://go.pump.fun/bounty/demo-007",
    status: "active",
    descriptionHash: "aabbcc007788",
    creatorAddress: "DemoCreator7777777777777777777777777777",
  },
];

const DEMO_CLASSIFICATIONS: Record<
  string,
  {
    category: string;
    confidence: string;
    effortEstimate: string;
    reasoning: string;
  }
> = {
  "demo-001": {
    category: "digital_automatable",
    confidence: "0.97",
    effortEstimate: "medium",
    reasoning: "Pure on-chain data extraction via Solana RPC — no human required.",
  },
  "demo-002": {
    category: "digital_automatable",
    confidence: "0.91",
    effortEstimate: "low",
    reasoning: "Template generation is a straightforward LLM text task.",
  },
  "demo-003": {
    category: "digital_automatable",
    confidence: "0.95",
    effortEstimate: "high",
    reasoning:
      "Requires querying and joining large amounts of historical Solana TX data.",
  },
  "demo-004": {
    category: "digital_automatable",
    confidence: "0.88",
    effortEstimate: "high",
    reasoning: "Code generation + integration with websocket feed, multi-step pipeline.",
  },
  "demo-005": {
    category: "digital_human",
    confidence: "0.82",
    effortEstimate: "high",
    reasoning: "Logo design requires creative judgment and artistic skill.",
  },
  "demo-006": {
    category: "physical",
    confidence: "0.99",
    effortEstimate: "high",
    reasoning: "Requires physical presence and manual distribution in Miami.",
  },
  "demo-007": {
    category: "digital_automatable",
    confidence: "0.93",
    effortEstimate: "low",
    reasoning: "arXiv search + summarization is a simple LLM pipeline.",
  },
};

async function seed() {
  console.log("Seeding demo bounties…");

  for (const b of DEMO_BOUNTIES) {
    const [inserted] = await db
      .insert(schema.bounties)
      .values(b)
      .onConflictDoUpdate({
        target: schema.bounties.externalId,
        set: { title: b.title, updatedAt: new Date() },
      })
      .returning();

    if (!inserted) continue;

    const cls = DEMO_CLASSIFICATIONS[b.externalId];
    if (cls) {
      await db
        .insert(schema.bountyClassifications)
        .values({
          bountyId: inserted.id,
          category: cls.category,
          confidence: cls.confidence,
          effortEstimate: cls.effortEstimate,
          reasoning: cls.reasoning,
          descriptionHashAtClassification: b.descriptionHash,
        })
        .onConflictDoUpdate({
          target: schema.bountyClassifications.bountyId,
          set: { category: cls.category },
        });
    }

    console.log(`  ✓ ${b.externalId} — ${b.title.slice(0, 50)}`);
  }

  console.log("\nDone! Run: npm run dev -w apps/api");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
