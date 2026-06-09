import { useState, type ReactNode } from "react";

// ─── Section registry ─────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "overview",      num: "00", label: "Overview" },
  { id: "pumpfun",       num: "01", label: "Pump.fun GO" },
  { id: "why-x402",      num: "02", label: "Why x402" },
  { id: "architecture",  num: "03", label: "Architecture" },
  { id: "x402-deep",     num: "04", label: "x402 Deep Dive" },
  { id: "ai",            num: "05", label: "AI Classification" },
  { id: "worker",        num: "06", label: "Worker & Scraper" },
  { id: "api",           num: "07", label: "API Reference" },
  { id: "build",         num: "08", label: "Build an Agent" },
  { id: "deploy",        num: "09", label: "Deployment" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ─── Primitives ───────────────────────────────────────────────────────────────

function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[18px] font-black tracking-tight uppercase mb-6 pb-4 border-b border-[#1e1e1e]"
      style={{ color: "#e8e8e8" }}>
      {children}
    </h2>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold tracking-widest uppercase mt-8 mb-3" style={{ color: "#c8ff00" }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-6 mb-4" style={{ color: "#666" }}>{children}</p>;
}

function Code({ children }: { children: ReactNode }) {
  return <code className="px-1 text-[12px]" style={{ color: "#c8ff00" }}>{children}</code>;
}

function Block({ lang = "sh", children }: { lang?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-4 border border-[#1a1a1a]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1a1a1a]"
        style={{ background: "#080808" }}>
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#2e2e2e" }}>{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-[10px] transition-colors duration-150"
          style={{ color: copied ? "#c8ff00" : "#2e2e2e" }}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-5" style={{ background: "#040404", color: "#888" }}>
        {children.trim()}
      </pre>
    </div>
  );
}

function Note({ kind = "info", children }: { kind?: "info" | "warn" | "danger"; children: ReactNode }) {
  const colors = {
    info:   { bar: "#00d4ff", text: "#00d4ff", label: "NOTE" },
    warn:   { bar: "#c8ff00", text: "#c8ff00", label: "WARN" },
    danger: { bar: "#ff4444", text: "#ff4444", label: "CRITICAL" },
  }[kind];
  return (
    <div className="flex gap-0 my-4 border border-[#1a1a1a]">
      <div className="w-1 shrink-0" style={{ background: colors.bar }} />
      <div className="flex-1 p-3" style={{ background: "#0a0a0a" }}>
        <span className="text-[10px] font-bold tracking-widest" style={{ color: colors.text }}>{colors.label} </span>
        <span className="text-[12px] leading-5" style={{ color: "#666" }}>{children}</span>
      </div>
    </div>
  );
}

function KV({ rows }: { rows: [string, string, boolean?][] }) {
  return (
    <div className="my-4 border border-[#1a1a1a]">
      {rows.map(([k, v, accent]) => (
        <div key={k} className="flex border-b border-[#111] last:border-0">
          <div className="w-40 shrink-0 px-3 py-2 text-[11px] border-r border-[#111]"
            style={{ color: "#2e2e2e", background: "#080808" }}>{k}</div>
          <div className="flex-1 px-3 py-2 text-[12px]"
            style={{ color: accent ? "#c8ff00" : "#777" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function Grid({ heads, rows }: { heads: string[]; rows: string[][] }) {
  return (
    <div className="my-4 border border-[#1a1a1a] overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[#1a1a1a]" style={{ background: "#080808" }}>
            {heads.map(h => (
              <th key={h} className="text-left px-3 py-2 text-[10px] tracking-widest font-normal"
                style={{ color: "#2e2e2e" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#0d0d0d] last:border-0"
              style={{ background: i % 2 === 0 ? "transparent" : "#050505" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2"
                  style={{ color: j === 0 ? "#c0c0c0" : "#555" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section content ──────────────────────────────────────────────────────────

function S00() {
  return <>
    <H>Overview</H>
    <P>Bountr is an open REST API that sits in front of Pump.fun GO bounty data and classifies which bounties AI agents can actually execute autonomously.</P>
    <KV rows={[
      ["Protocol",    "x402 v2 — HTTP 402 native micropayments", true],
      ["Chain",       "Solana (devnet: EtWT… / mainnet: 5eykt…)"],
      ["AI Engine",   "claude-sonnet-4-6 — bounty classification"],
      ["DB",          "PostgreSQL 15 + Drizzle ORM"],
      ["API Server",  "Hono · port 4021"],
      ["Frontend",    "Vite + React 18 + Tailwind"],
      ["Source",      "livestream-api.pump.fun (undocumented, intercepted via Playwright)"],
    ]} />
    <P>The monorepo has three apps sharing one database schema package:</P>
    <Block lang="txt">{`
apps/api     Hono API server — port 4021
apps/worker  Background scraper + classifier — cron every 60s
apps/web     Vite + React frontend — port 5173
packages/shared  Drizzle schema, types, Zod schemas
    `}</Block>
  </>;
}

function S01() {
  return <>
    <H>Pump.fun GO Bounties</H>
    <P>Pump.fun GO is a decentralized task marketplace on Solana. Creators post bounties with USDC or SOL rewards. There is <strong style={{ color: "#e8e8e8" }}>no public API</strong> — Bountr discovered the internal API by intercepting network calls via Playwright.</P>
    <Block lang="sh">{`
# Discovered internal API — no auth required
GET https://livestream-api.pump.fun/bounties/v2/tasks
  ?phase=OPEN&sort=rewardTotalUsd&order=desc&limit=50

GET https://livestream-api.pump.fun/bounties/v2/stats
# → { liveCount: 907, unclaimedRewardTotalUsd: 208743, ... }
    `}</Block>
    <Sub>Bounty categories</Sub>
    <Grid
      heads={["category", "automatable?", "examples"]}
      rows={[
        ["digital_automatable", "YES ✓", "On-chain analysis, code gen, LLM pipelines, data scraping"],
        ["digital_human",       "NO",    "Logo design, copywriting, video editing, creative work"],
        ["physical",            "NO",    "Go to a location IRL, attend an event, film yourself"],
      ]}
    />
    <P>The insight: Pump.fun GO has no filter for automatable tasks. Bountr adds a Claude classification layer so agents only see opportunities they can act on.</P>
    <Note kind="info"><Code>PENDING_RESOLUTION</Code> and <Code>IN_DISPUTE_PERIOD</Code> phases are also scraped — bounties remain claimable during those windows.</Note>
  </>;
}

function S02() {
  return <>
    <H>Why x402</H>
    <P>Traditional API monetization requires sign up → email → billing → key → rate plan. That's a 5-step human flow. AI agents don't have email addresses.</P>
    <P>x402 revives HTTP 402 "Payment Required". The entire negotiation happens in headers. No session, no state, no identity.</P>
    <Grid
      heads={["concern", "API keys", "x402"]}
      rows={[
        ["Identity",    "Email + account required",   "None — pay and go"],
        ["Billing",     "Monthly invoice / Stripe",   "On-chain per-request"],
        ["Rate limits", "Quota plans",                "Price signal"],
        ["Agents",      "Manual key injection",       "Native — reads header, builds tx"],
        ["Revocation",  "Delete key in dashboard",    "No keys to revoke"],
        ["Idle cost",   "$0 or plan minimum",         "$0 — only pay when calling"],
      ]}
    />
    <Note kind="info">Bountr currently runs with all endpoints <strong style={{ color: "#c8ff00" }}>free</strong>. The x402 middleware is preserved in the codebase for future monetization — flip <Code>PAYMENT_ENABLED=true</Code> to activate it.</Note>
  </>;
}

function S03() {
  return <>
    <H>Architecture</H>
    <Block lang="txt">{`
monorepo/
├── apps/api/
│   ├── routes/     bounties, subscriptions, health, landing
│   ├── services/   classification (Claude), revenue, webhook
│   └── middleware/ rateLimiter (30 req/min/payer)
│
├── apps/worker/
│   ├── scraper.ts       livestream-api.pump.fun pagination
│   ├── normalizer.ts    field mapping + SHA-256 hash
│   └── classifier.ts    Claude classification pipeline
│
├── apps/web/            Vite + React frontend
│
└── packages/shared/     Drizzle schema, DB client, Zod, types


             ┌──────────────┐
  agent ──►  │  Hono API    │ ── DB query ──► PostgreSQL
             │  :4021       │
             └──────────────┘
                    ▲
                    │ upsert every 60s
             ┌──────────────┐
             │  worker      │ ──► livestream-api.pump.fun
             │  cron 60s    │ ──► Claude (classification)
             └──────────────┘
    `}</Block>
    <Sub>Database — 6 tables</Sub>
    <Grid
      heads={["table", "purpose"]}
      rows={[
        ["bounties",                 "Canonical bounty records with status and reward"],
        ["bounty_status_history",    "Audit trail of every status transition"],
        ["bounty_classifications",   "Claude output: category, confidence, reasoning"],
        ["subscriptions",            "24h webhook subscriptions with filters"],
        ["webhook_deliveries",       "Outbound delivery log with retry state"],
        ["revenue_events",           "Per-call payment + wallet tracking"],
      ]}
    />
  </>;
}

function S04() {
  return <>
    <H>x402 Deep Dive</H>
    <Sub>Phase 1 — discovery</Sub>
    <Block lang="http">{`
GET /v1/bounties HTTP/1.1
Host: localhost:4021

HTTP/1.1 402 Payment Required
payment-required: eyJ4NDAyVmVyc2lvbiI6Mi...
content-length: 2

{}
    `}</Block>
    <Sub>Decoded payment-required header</Sub>
    <Block lang="json">{`
{
  "x402Version": 2,
  "accepts": [{
    "scheme":            "exact",
    "network":           "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    "amount":            "10000",
    "asset":             "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    "payTo":             "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "maxTimeoutSeconds": 300
  }]
}
    `}</Block>
    <Sub>Phase 2 — authenticated request</Sub>
    <Block lang="http">{`
GET /v1/bounties HTTP/1.1
X-PAYMENT: <base64 SignedPayment>

HTTP/1.1 200 OK
X-PAYMENT-RESPONSE: <base64 SettleResponse>
{ "data": [...bounties] }
    `}</Block>
    <Sub>Server setup</Sub>
    <Block lang="typescript">{`
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
// ⚠ Must use /exact/server — NOT @x402/svm (client-only, lacks parsePrice)
import { ExactSvmScheme } from "@x402/svm/exact/server";

const resourceServer = new x402ResourceServer(facilitator)
  .register("solana:EtWT...", new ExactSvmScheme());

// Route keys must be "METHOD /path"
const routes = {
  "GET /v1/bounties": { accepts: { scheme: "exact", price: "$0.01", ... } },
};
app.use(paymentMiddleware(routes, resourceServer));
    `}</Block>
    <Note kind="danger">Always import <Code>ExactSvmScheme</Code> from <Code>@x402/svm/exact/server</Code>. The root <Code>@x402/svm</Code> export is the client-side wallet adapter and lacks <Code>parsePrice</Code>.</Note>
  </>;
}

function S05() {
  return <>
    <H>AI Classification</H>
    <P>Every new bounty is classified by <Code>claude-sonnet-4-6</Code> via structured JSON output. Re-classification triggers only when the description hash changes.</P>
    <Sub>Prompt</Sub>
    <Block lang="typescript">{`
const system = \`You are an expert at classifying tasks for AI agents.

Classify into exactly one of:
  digital_automatable  — completable 100% by code/LLM
  digital_human        — requires human creativity or assets
  physical             — requires real-world presence

Effort estimate:
  low     < 1h compute, simple pipeline
  medium  1–4h, multi-step pipeline
  high    > 4h, complex integration

Respond ONLY with valid JSON.\`;
    `}</Block>
    <Sub>Output schema</Sub>
    <Block lang="json">{`
{
  "category":       "digital_automatable",
  "confidence":     0.94,
  "effortEstimate": "low",
  "reasoning":      "arXiv search + summarization is a simple LLM pipeline"
}
    `}</Block>
    <Sub>Content-hash dedup</Sub>
    <Block lang="typescript">{`
// SHA-256[:16] stored with each classification
export function hashDescription(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
// Worker: if hash changed → trigger re-classification
    `}</Block>
    <Note kind="warn">Classification requires <Code>ANTHROPIC_API_KEY</Code> in <Code>.env</Code>. Without it the worker runs but skips the classify step — all bounties stay unclassified and the AUTOMATABLE tab shows 0.</Note>
  </>;
}

function S06() {
  return <>
    <H>Worker & Scraper</H>
    <P>The <Code>apps/worker</Code> process runs independently from the API — they share only the database. It scrapes pump.fun GO every 60 seconds and normalizes the data.</P>
    <Sub>Scraper strategy</Sub>
    <Block lang="typescript">{`
// Primary: livestream-api direct fetch (all phases)
const PHASES = ["OPEN", "PENDING_RESOLUTION", "IN_DISPUTE_PERIOD", "CLOSED"];

for (const phase of PHASES) {
  let cursor;
  do {
    const data = await fetch(
      \`https://livestream-api.pump.fun/bounties/v2/tasks?phase=\${phase}&limit=50&cursor=\${cursor}\`,
      { headers: { "Origin": "https://pump.fun", "Referer": "https://pump.fun/go" } }
    ).then(r => r.json());
    // upsert data.items...
    cursor = data.nextCursor;
  } while (cursor);
}

// Fallback: Playwright headless browser (if primary fails)
    `}</Block>
    <Sub>Normalizer field mapping</Sub>
    <Grid
      heads={["canonical", "new API (v2)", "old API fallback"]}
      rows={[
        ["externalId",  "taskId",        "id"],
        ["description", "bodyMarkdown",  "description"],
        ["rewardUsd",   "rewardTotalUsd","reward_usd / reward / amount"],
        ["status",      "OPEN → active", "open/active/live → active"],
        ["deadline",    "expiresAt",     "deadline (unix or ISO)"],
        ["link",        "auto: pump.fun/go/:taskId", "url / link / slug"],
      ]}
    />
    <Sub>Environment</Sub>
    <Block lang="sh">{`
SCRAPER_DRY_RUN=false          # set to true to disable actual scraping
SCRAPER_INTERVAL_SECONDS=60    # cron interval
ANTHROPIC_API_KEY=sk-...       # required for classification
    `}</Block>
  </>;
}

function S07() {
  return <>
    <H>API Reference</H>
    <P>Base URL: <Code>http://localhost:4021</Code> · All endpoints free · No auth required</P>
    {[
      {
        method: "GET", path: "/v1/health", free: true,
        desc: "Liveness probe. Returns API status, DB connectivity, and revenue summary.",
        curl: `curl http://localhost:4021/v1/health`,
        res:  `{ "status": "ok", "version": "1.0.0", "db": "connected" }`,
      },
      {
        method: "GET", path: "/v1/bounties", free: true,
        desc: "Paginated active bounties sorted by reward DESC. Params: page, limit (max 100), status.",
        curl: `curl "http://localhost:4021/v1/bounties?limit=25&page=1"`,
        res:  `{ "data": [Bounty], "pagination": { "total": 907, "hasNext": true } }`,
      },
      {
        method: "GET", path: "/v1/bounties/automatable", free: true,
        desc: "AI-verified digital_automatable bounties sorted by rewardToEffortRatio DESC.",
        curl: `curl "http://localhost:4021/v1/bounties/automatable?limit=25"`,
        res:  `{ "data": [Bounty & { classification: { rewardToEffortRatio: 150.0 } }] }`,
      },
      {
        method: "GET", path: "/v1/bounties/:id", free: true,
        desc: "Full bounty detail with statusHistory[] and classification reasoning.",
        curl: `curl "http://localhost:4021/v1/bounties/abc-123"`,
        res:  `{ ...Bounty, "statusHistory": [...], "classification": { "reasoning": "..." } }`,
      },
      {
        method: "POST", path: "/v1/subscriptions", free: true,
        desc: "24h webhook subscription. Returns HMAC secret. Filters: minRewardUsd, categories, maxEffort.",
        curl: `curl -X POST http://localhost:4021/v1/subscriptions \\\n  -H "Content-Type: application/json" \\\n  -d '{"webhookUrl":"https://my-agent.example/hook","filters":{"minRewardUsd":50}}'`,
        res:  `{ "id": "sub_01J...", "expiresAt": "...", "hmacSecret": "..." }`,
      },
    ].map((ep, i) => {
      const [open, setOpen] = useState(i === 1);
      return (
        <div key={ep.path} className="border border-[#1a1a1a] mb-2">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-[#0a0a0a]"
          >
            <span
              className="text-[10px] font-bold px-2 py-0.5 shrink-0"
              style={{
                color: ep.method === "POST" ? "#fbbf24" : "#3c9eff",
                border: `1px solid ${ep.method === "POST" ? "#fbbf2430" : "#3c9eff30"}`,
              }}
            >
              {ep.method}
            </span>
            <code className="text-[12px] flex-1" style={{ color: "#c8c8c8" }}>{ep.path}</code>
            <span className="text-[10px] font-bold" style={{ color: "#00ff88" }}>FREE</span>
            <span className="text-[10px]" style={{ color: "#2e2e2e", transform: open ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▶</span>
          </button>
          {open && (
            <div className="border-t border-[#111] px-4 pb-4 pt-3" style={{ background: "#060606" }}>
              <p className="text-[12px] leading-5 mb-4" style={{ color: "#555" }}>{ep.desc}</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5" style={{ color: "#2e2e2e" }}>REQUEST</div>
                  <pre className="p-3 text-[11px] border border-[#111] overflow-x-auto" style={{ background: "#020202", color: "#777" }}>{ep.curl}</pre>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5" style={{ color: "#2e2e2e" }}>RESPONSE</div>
                  <pre className="p-3 text-[11px] border border-[#111] overflow-x-auto" style={{ background: "#020202", color: "#c8ff00" }}>{ep.res}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    })}
  </>;
}

function S08() {
  return <>
    <H>Build an Agent</H>
    <P>Use <Code>@x402/fetch</Code> to wrap native <Code>fetch()</Code> with automatic 402 handling. Your agent just needs a funded Solana devnet wallet.</P>
    <Block lang="typescript">{`
import { wrapFetch } from "@x402/fetch";
import { createSolanaWallet } from "@x402/svm/wallet";

const wallet = createSolanaWallet(process.env.SOLANA_PRIVATE_KEY!);
const pay = wrapFetch(fetch, wallet); // drop-in replacement

// 1. Get best automatable bounty
const { data } = await pay(
  "http://localhost:4021/v1/bounties/automatable"
).then(r => r.json());
const best = data[0]; // sorted by rewardToEffortRatio

// 2. Get full detail
const bounty = await pay(
  \`http://localhost:4021/v1/bounties/\${best.id}\`
).then(r => r.json());

// 3. Subscribe to webhook alerts (24h)
await pay("http://localhost:4021/v1/subscriptions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    webhookUrl: "https://my-agent.example.com/hook",
    filters: { minRewardUsd: 50, categories: ["digital_automatable"] },
  }),
});
    `}</Block>
    <Sub>Wallet-based fee tracking</Sub>
    <Block lang="sh">{`
# Pass your Solana wallet to track calls for fee distribution
curl "http://localhost:4021/v1/bounties?wallet=YOUR_SOLANA_WALLET"

# or via header
curl http://localhost:4021/v1/bounties \\
  -H "X-WALLET: YOUR_SOLANA_WALLET"

# 50% of token fees distributed pro-rata to tracked wallets weekly
    `}</Block>
    <Note kind="info">The <Code>feePayer</Code> field in the x402 payment option means your agent wallet only needs USDC — no SOL for transaction fees. The facilitator fronts the gas.</Note>
  </>;
}

function S09() {
  return <>
    <H>Deployment</H>
    <Sub>Local dev</Sub>
    <Block lang="sh">{`
npm install
cp .env.example .env
# Fill in: DATABASE_URL, PAYMENT_ADDRESS, ANTHROPIC_API_KEY

npm run db:migrate
npm run dev                  # API + worker on :4021
npm run dev -w apps/web      # Frontend on :5173

# Seed bounties from pump.fun GO
DATABASE_URL=... npx tsx scripts/seed-bounties.ts
    `}</Block>
    <Sub>Switch to Solana mainnet</Sub>
    <Block lang="sh">{`
# .env
X402_NETWORK=solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
PAYMENT_ADDRESS=<your-wallet>
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    `}</Block>
    <Sub>Docker</Sub>
    <Block lang="yaml">{`
services:
  db:
    image: postgres:15-alpine
    environment: { POSTGRES_DB: bountr }
  api:
    build: apps/api
    env_file: .env
    ports: ["4021:4021"]
    depends_on: [db]
  worker:
    build: apps/worker
    env_file: .env
    depends_on: [db]
    `}</Block>
    <Note kind="warn">Set <Code>SCRAPER_DRY_RUN=false</Code> in production to enable live scraping.</Note>
    <div className="mt-8 border border-[#1a1a1a] p-4" style={{ background: "#040404" }}>
      <div className="text-[10px] tracking-widest mb-2" style={{ color: "#2e2e2e" }}>REPOSITORY</div>
      <a href="https://github.com/tow3web3/x402" target="_blank" rel="noreferrer"
        className="text-[13px] transition-colors duration-150"
        style={{ color: "#c8ff00" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        github.com/tow3web3/x402 →
      </a>
    </div>
  </>;
}

const CONTENT: Record<SectionId, () => ReactNode> = {
  overview:     () => <S00 />,
  pumpfun:      () => <S01 />,
  "why-x402":   () => <S02 />,
  architecture: () => <S03 />,
  "x402-deep":  () => <S04 />,
  ai:           () => <S05 />,
  worker:       () => <S06 />,
  api:          () => <S07 />,
  build:        () => <S08 />,
  deploy:       () => <S09 />,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Docs({ onBack }: { onBack?: () => void }) {
  const [active, setActive] = useState<SectionId>("overview");

  const activeIdx  = SECTIONS.findIndex(s => s.id === active);
  const prev       = activeIdx > 0 ? SECTIONS[activeIdx - 1] : null;
  const next       = activeIdx < SECTIONS.length - 1 ? SECTIONS[activeIdx + 1] : null;

  return (
    <div className="min-h-screen pt-10 flex flex-col" style={{ background: "#060606" }}>
      <div className="rule-accent" />

      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a] shrink-0"
        style={{ background: "#060606" }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-[10px] tracking-widest pr-4 border-r border-[#1a1a1a] transition-colors duration-100"
            style={{ color: "#2e2e2e" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
            onMouseLeave={e => (e.currentTarget.style.color = "#2e2e2e")}
          >
            ← HOME
          </button>
          <span className="text-[11px] font-bold tracking-widest" style={{ color: "#e8e8e8" }}>
            DOCS
          </span>
          <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
            {SECTIONS.find(s => s.id === active)?.num} / {SECTIONS.find(s => s.id === active)?.label}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: "#1e1e1e" }}>
          rev 1.0 · 2026
        </span>
      </div>

      <div className="flex flex-1 max-w-[1400px] w-full mx-auto overflow-hidden">

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside
          className="w-48 shrink-0 border-r border-[#1a1a1a] overflow-y-auto"
          style={{ background: "#040404" }}
        >
          <nav className="py-4">
            {SECTIONS.map((s) => {
              const isActive = s.id === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100 relative"
                  style={{
                    background: isActive ? "rgba(200,255,0,0.05)" : "transparent",
                    borderLeft: isActive ? "2px solid #c8ff00" : "2px solid transparent",
                  }}
                >
                  <span className="text-[10px] shrink-0 w-5" style={{ color: isActive ? "#c8ff00" : "#222" }}>
                    {s.num}
                  </span>
                  <span
                    className="text-[11px] leading-4"
                    style={{ color: isActive ? "#e8e8e8" : "#3a3a3a" }}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Content ────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
          <div className="flex-1 px-10 py-8 max-w-3xl">
            {CONTENT[active]?.()}
          </div>

          {/* Prev / Next */}
          <div
            className="flex items-center justify-between px-10 py-4 border-t border-[#1a1a1a] shrink-0"
            style={{ background: "#040404" }}
          >
            {prev ? (
              <button
                onClick={() => setActive(prev.id)}
                className="flex items-center gap-2 text-[11px] transition-colors duration-100"
                style={{ color: "#333" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
                onMouseLeave={e => (e.currentTarget.style.color = "#333")}
              >
                ← <span style={{ color: "#2e2e2e" }}>{prev.num}</span> {prev.label}
              </button>
            ) : <div />}

            <span className="text-[10px]" style={{ color: "#1e1e1e" }}>
              {activeIdx + 1} / {SECTIONS.length}
            </span>

            {next ? (
              <button
                onClick={() => setActive(next.id)}
                className="flex items-center gap-2 text-[11px] transition-colors duration-100"
                style={{ color: "#333" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
                onMouseLeave={e => (e.currentTarget.style.color = "#333")}
              >
                {next.label} <span style={{ color: "#2e2e2e" }}>{next.num}</span> →
              </button>
            ) : <div />}
          </div>
        </main>
      </div>
    </div>
  );
}
