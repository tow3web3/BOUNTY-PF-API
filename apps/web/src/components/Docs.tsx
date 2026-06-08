import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "pumpfun-go", label: "Pump.fun GO Bounties" },
  { id: "why-x402", label: "Why x402?" },
  { id: "architecture", label: "Architecture" },
  { id: "x402-deep-dive", label: "x402 Protocol Deep Dive" },
  { id: "ai-classification", label: "AI Classification" },
  { id: "worker", label: "Worker & Scraper" },
  { id: "endpoints-ref", label: "API Reference" },
  { id: "integration", label: "Build an Agent" },
  { id: "deploy", label: "Deployment" },
];

function Code({ children, lang = "" }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a12] border border-border rounded-t-lg border-b-0">
        <span className="text-[11px] text-slate-600 font-mono uppercase tracking-wider">{lang || "code"}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-[11px] text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre className="bg-[#050508] border border-border rounded-b-lg p-4 overflow-x-auto font-mono text-[12.5px] leading-6 text-slate-300">
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "warn" | "tip" | "danger"; children: React.ReactNode }) {
  const styles = {
    info: "border-cyan/30 bg-cyan/5 text-cyan",
    warn: "border-yellow/30 bg-yellow/5 text-yellow",
    tip: "border-purple/30 bg-purple/5 text-purple",
    danger: "border-red-400/30 bg-red-400/5 text-red-400",
  };
  const icons = { info: "ℹ", warn: "⚠", tip: "💡", danger: "🚨" };
  return (
    <div className={`flex gap-3 p-4 rounded-xl border my-4 ${styles[type]}`}>
      <span className="text-lg shrink-0">{icons[type]}</span>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-black tracking-tight text-white mt-16 mb-6 flex items-center gap-3 group">
      <a href={`#${id}`} className="text-slate-700 hover:text-purple transition-colors opacity-0 group-hover:opacity-100 text-lg">#</a>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-white mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-slate-400 leading-7 mb-4">{children}</p>;
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const c: Record<string, string> = {
    purple: "bg-purple/10 text-purple border-purple/30",
    green: "bg-green/10 text-green border-green/30",
    cyan: "bg-cyan/10 text-cyan border-cyan/30",
    yellow: "bg-yellow/10 text-yellow border-yellow/30",
    red: "bg-red-400/10 text-red-400 border-red-400/30",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold ${c[color]}`}>{children}</span>;
}

export default function Docs() {
  const [active, setActive] = useState("overview");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* Top border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16 flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">On this page</div>
          <nav className="flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`text-[13px] py-1.5 px-3 rounded-lg transition-all duration-150 ${
                  active === s.id
                    ? "text-white bg-purple/10 border border-purple/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/3"
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-[11px] text-slate-600 mb-3">Stack</div>
            {["Hono", "@x402/hono", "Drizzle ORM", "claude-sonnet-4-6", "Vite + React"].map((t) => (
              <div key={t} className="text-[12px] text-slate-500 py-0.5 font-mono">{t}</div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main ref={contentRef} className="flex-1 min-w-0 max-w-3xl">

          {/* ── OVERVIEW ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-dim border border-purple/30 text-purple text-[11px] font-semibold mb-4">
                Technical Documentation
              </div>
              <h1 id="overview" className="text-4xl font-black tracking-tight text-white mb-4 scroll-mt-24">
                Agent GO — <span className="text-gradient">Architecture & Internals</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                A paywall-as-middleware API that sits in front of Pump.fun GO bounty data.
                AI agents pay fractions of a cent per request using on-chain Solana USDC —
                zero OAuth, zero API keys, zero billing dashboards.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-12">
              {[
                { label: "Protocol", value: "x402 v2", color: "purple" },
                { label: "Chain", value: "Solana devnet", color: "cyan" },
                { label: "Payment", value: "USDC SPL", color: "green" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-surface-2 p-4 text-center">
                  <Badge color={s.color}>{s.value}</Badge>
                  <div className="text-xs text-slate-600 mt-2">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── PUMP.FUN GO ──────────────────────────────────── */}
          <H2 id="pumpfun-go">What are Pump.fun GO Bounties?</H2>
          <P>
            <a href="https://go.pump.fun" target="_blank" rel="noreferrer" className="text-cyan hover:underline">Pump.fun GO</a> is a decentralized task marketplace on Solana,
            built on top of the Pump.fun meme-token ecosystem. Creators post bounties —
            tasks with a USDC or SOL reward — that anyone can claim and execute.
          </P>
          <P>
            Bounties cover a wide spectrum:
          </P>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
            {[
              { icon: "🤖", title: "Digital / Automatable", desc: "On-chain data analysis, code generation, LLM tasks, web scraping. No human needed — a well-prompted agent can complete these.", color: "purple" },
              { icon: "👤", title: "Digital / Human", desc: "Creative work: logo design, copywriting, video editing. Requires judgment and taste a current LLM can't fully replace.", color: "yellow" },
              { icon: "📦", title: "Physical", desc: "IRL tasks: print and distribute flyers, attend events. Requires a human on the ground.", color: "red" },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-surface-2 p-4">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-sm font-bold text-white mb-1">{c.title}</div>
                <p className="text-[12px] text-slate-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <P>
            The core insight: <span className="text-white font-semibold">most bounties are digital and automatable</span>, but the Pump.fun GO UI has no filtering for that.
            An AI agent browsing raw bounties wastes compute scanning physical tasks it can never complete.
            Agent GO adds a classification layer so agents only see what they can act on.
          </P>
          <Callout type="info">
            Pump.fun GO has no public REST API. Agent GO scrapes the platform using a cascading strategy: 4 REST endpoint variants → Playwright headless fallback. The scraper is configurable and rate-limited.
          </Callout>

          {/* ── WHY X402 ─────────────────────────────────────── */}
          <H2 id="why-x402">Why x402 Instead of API Keys?</H2>
          <P>
            Traditional API monetization requires: sign up → email verification → billing setup → key generation → rate-limit dashboard → invoice emails.
            That's a 5-step human flow. AI agents don't have email addresses.
          </P>
          <P>
            <strong className="text-white">x402</strong> is an open protocol that revives the original HTTP 402 "Payment Required" status code.
            The entire payment negotiation happens in HTTP headers — no session, no state, no identity.
          </P>
          <div className="my-6 overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">Concern</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">API Keys</th>
                  <th className="text-left py-2 px-3 text-purple font-semibold">x402</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Identity", "Email + account required", "None — pay-and-go"],
                  ["Billing", "Monthly invoice / Stripe", "On-chain per-request"],
                  ["Rate limits", "Soft limits, quota plans", "Price signal (pay more → access)"],
                  ["Agent support", "Manual key injection", "Native — reads header, builds tx"],
                  ["Latency overhead", "DB lookup on every request", "Facilitator verifies on-chain proof"],
                  ["Revocation", "Delete key in dashboard", "No keys to revoke"],
                ].map(([c, a, b], i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-white/2">
                    <td className="py-2.5 px-3 text-slate-400 font-medium">{c}</td>
                    <td className="py-2.5 px-3 text-slate-500">{a}</td>
                    <td className="py-2.5 px-3 text-slate-300">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── ARCHITECTURE ─────────────────────────────────── */}
          <H2 id="architecture">Architecture</H2>
          <P>Agent GO is a Node.js monorepo split into three apps sharing a common database schema package.</P>

          {/* Architecture diagram */}
          <div className="my-6 rounded-xl border border-border bg-[#050508] p-6 font-mono text-[12px] leading-6 overflow-x-auto">
            <pre className="text-slate-400">{`
┌─────────────────────────────────────────────────────────┐
│                    MONOREPO ROOT                         │
├──────────────┬──────────────────┬───────────────────────┤
│  apps/api    │   apps/worker    │      apps/web          │
│  (Hono)      │   (node-cron)    │   (Vite + React)      │
│  port 4021   │   background     │      port 5173         │
├──────────────┴──────────────────┴───────────────────────┤
│                 packages/shared                          │
│         (Drizzle schema + DB client + types)             │
└─────────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    ┌─────────────┐    ┌──────────────────┐
    │  PostgreSQL  │    │  Pump.fun GO      │
    │  (local 15) │    │  (scraped)        │
    └─────────────┘    └──────────────────┘
           │
           ▼
    ┌─────────────────────────────────────┐
    │           x402 Flow                  │
    │                                      │
    │  AI Agent ──GET /v1/bounties──►     │
    │           ◄── 402 payment-required   │
    │  Agent ──signs USDC tx──►           │
    │           ──X-PAYMENT header──►     │
    │  Facilitator ──verify+settle──►     │
    │           ◄── 200 + bounties JSON   │
    └─────────────────────────────────────┘
`}</pre>
          </div>

          <H3>packages/shared</H3>
          <P>Central package imported by both <code className="text-cyan text-[12px] bg-surface px-1 rounded">apps/api</code> and <code className="text-cyan text-[12px] bg-surface px-1 rounded">apps/worker</code>. Contains:</P>
          <ul className="list-none my-4 flex flex-col gap-2">
            {[
              ["Drizzle ORM schema", "6 tables: bounties, bounty_status_history, bounty_classifications, subscriptions, webhook_deliveries, revenue_events"],
              ["createDb(url)", "Wraps drizzle-orm/node-postgres, returns typed DB instance"],
              ["Zod schemas", "PaginationQuerySchema, BountyStatusSchema, CreateSubscriptionSchema"],
              ["TypeScript types", "Bounty, Classification, SubscriptionFilters, …"],
            ].map(([name, desc]) => (
              <li key={name as string} className="flex gap-3 text-[13px]">
                <code className="text-purple font-mono shrink-0">{name}</code>
                <span className="text-slate-500">{desc}</span>
              </li>
            ))}
          </ul>

          <H3>Database Schema (Drizzle)</H3>
          <Code lang="typescript">{`
// packages/shared/src/db/schema.ts (simplified)

export const bounties = pgTable("bounties", {
  id:              uuid().primaryKey().defaultRandom(),
  externalId:      text().unique().notNull(),      // pump.fun internal ID
  title:           text().notNull(),
  description:     text().notNull(),
  rewardUsd:       numeric({ precision: 10, scale: 2 }).notNull(),
  status:          bountyStatusEnum().notNull(),   // active | completed | expired | cancelled
  descriptionHash: text(),                          // SHA-256[:16] → re-classify on change
  link:            text(),
  deadline:        timestamp(),
  creatorAddress:  text(),
  createdAt:       timestamp().defaultNow(),
  updatedAt:       timestamp().defaultNow(),
});

export const bountyClassifications = pgTable("bounty_classifications", {
  id:               uuid().primaryKey().defaultRandom(),
  bountyId:         uuid().references(() => bounties.id),
  category:         classificationCategoryEnum(),  // digital_automatable | digital_human | physical
  confidence:       numeric({ precision: 4, scale: 3 }).notNull(),
  effortEstimate:   effortEstimateEnum(),           // low | medium | high
  reasoning:        text(),
  descriptionHashAtClassification: text(),         // re-trigger if bounty changes
});
`}
          </Code>

          {/* ── X402 DEEP DIVE ───────────────────────────────── */}
          <H2 id="x402-deep-dive">x402 Protocol — Deep Dive</H2>
          <P>
            x402 is a two-phase HTTP protocol. Phase 1 is a free discovery call; Phase 2 is the authenticated paid call.
            The server never stores state between phases — the proof is self-contained in the header.
          </P>

          <H3>Phase 1 — Discovery (no payment)</H3>
          <Code lang="http">{`
GET /v1/bounties HTTP/1.1
Host: localhost:4021

HTTP/1.1 402 Payment Required
payment-required: <base64-encoded JSON>
content-length: 2

{}
`}</Code>
          <P>The <code className="text-cyan text-[12px] bg-surface px-1 rounded">payment-required</code> header decodes to:</P>
          <Code lang="json">{`
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "http://localhost:4021/v1/bounties",
    "description": "List active bounties",
    "mimeType": "application/json"
  },
  "accepts": [{
    "scheme":            "exact",
    "network":           "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    "amount":            "10000",   // micro-USDC — $0.01
    "asset":             "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",  // USDC devnet
    "payTo":             "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "maxTimeoutSeconds": 300,
    "extra": {
      "feePayer": "CKPKJWNdJEqa81x7CkZ14BVPiY6y16Sxs7owznqtWYp5"  // facilitator pays gas
    }
  }]
}
`}</Code>

          <H3>Phase 2 — Authenticated request</H3>
          <Code lang="http">{`
GET /v1/bounties HTTP/1.1
Host: localhost:4021
X-PAYMENT: <base64-encoded SignedPayment>

HTTP/1.1 200 OK
X-PAYMENT-RESPONSE: <base64-encoded SettleResponse>
content-type: application/json

{ "data": [...], "pagination": { ... } }
`}</Code>
          <P>
            The <code className="text-cyan text-[12px] bg-surface px-1 rounded">X-PAYMENT</code> header contains a signed Solana transaction (SPL token transfer) that the facilitator verifies and broadcasts on-chain.
            The facilitator front-runs the gas fee (via the <code className="text-cyan text-[12px] bg-surface px-1 rounded">feePayer</code> in the payment option) so the agent wallet only needs USDC, not SOL.
          </P>

          <H3>Server-side setup (@x402/hono)</H3>
          <Code lang="typescript">{`
// apps/api/src/index.ts
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";  // ← server-side scheme (has parsePrice)

const facilitator = new HTTPFacilitatorClient({
  url: process.env.X402_FACILITATOR_URL  // "https://x402.org/facilitator" for devnet
});

// Register the network + scheme pair
const resourceServer = new x402ResourceServer(facilitator)
  .register("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", new ExactSvmScheme());
  //         ^-- Solana devnet CAIP-2 identifier

// Route config — keys are "METHOD /path"
const routes = {
  "GET /v1/bounties": {
    accepts: {
      scheme: "exact",
      payTo: process.env.PAYMENT_ADDRESS,
      price: "$0.01",
      network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      maxTimeoutSeconds: 300,
    },
  },
  // ... other routes
};

app.use(paymentMiddleware(routes, resourceServer));
// syncFacilitatorOnStart defaults to true — fetches supported schemes from facilitator
// at boot so the first request doesn't hit a cold-start validation failure
`}</Code>

          <Callout type="warn">
            <strong>Import the server-side scheme</strong>, not the client-side one.
            <code className="text-yellow mx-1 font-mono text-[12px]">@x402/svm</code> exports the client wallet adapter (only has <code className="text-yellow font-mono text-[12px]">createPaymentPayload</code>).
            The resource server needs <code className="text-yellow font-mono text-[12px]">@x402/svm/exact/server</code> which exports <code className="text-yellow font-mono text-[12px]">parsePrice</code>.
          </Callout>

          {/* ── AI CLASSIFICATION ────────────────────────────── */}
          <H2 id="ai-classification">AI Classification Pipeline</H2>
          <P>
            When a new bounty is scraped, the worker calls <code className="text-cyan text-[12px] bg-surface px-1 rounded">classifyBounty()</code> which sends the title + description to <strong className="text-white">claude-sonnet-4-6</strong> with a strict JSON output schema.
          </P>

          <H3>Classification prompt</H3>
          <Code lang="typescript">{`
// apps/api/src/services/classification.ts
const systemPrompt = \`You are an expert at classifying tasks for AI agents.

Classify the bounty into exactly one of:
- digital_automatable: Can be completed 100% by code/LLM with no human input
- digital_human:       Requires human creativity, judgment, or physical assets
- physical:            Requires real-world physical presence or action

Effort estimate:
- low:    < 1h of compute / simple pipeline
- medium: 1–4h, multi-step pipeline
- high:   > 4h, complex integration or large dataset

Respond ONLY with valid JSON. No explanation outside the JSON.\`;

const userPrompt = \`Title: \${title}
Description: \${description}

Classify this bounty.\`;

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 256,
  messages: [{ role: "user", content: userPrompt }],
  system: systemPrompt,
});

// Parse strict JSON from response
const parsed = JSON.parse(responseText);
// Expected shape:
// { category: "digital_automatable", confidence: 0.94,
//   effortEstimate: "low", reasoning: "..." }
`}</Code>

          <H3>Re-classification trigger</H3>
          <P>
            Each bounty stores a <code className="text-cyan text-[12px] bg-surface px-1 rounded">descriptionHash</code> (first 16 chars of SHA-256).
            If the bounty is updated on Pump.fun GO, the worker detects the hash change and triggers a fresh classification.
            This prevents stale labels from persisting.
          </P>
          <Code lang="typescript">{`
// apps/worker/src/normalizer.ts
export function hashDescription(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
`}</Code>

          {/* ── WORKER ───────────────────────────────────────── */}
          <H2 id="worker">Worker — Scraper & Dispatcher</H2>
          <P>
            A separate <code className="text-cyan text-[12px] bg-surface px-1 rounded">apps/worker</code> process runs on a configurable cron interval (default: 60s).
            It is completely decoupled from the API — both processes share only the database.
          </P>

          <H3>Scraper cascade</H3>
          <Code lang="typescript">{`
// apps/worker/src/scraper.ts
// Tries endpoints in order, falls back to Playwright headless if all REST calls fail

const ENDPOINTS = [
  "https://frontend-api.pump.fun/bounties?offset=0&limit=50",
  "https://go.pump.fun/api/bounties",
  "https://go.pump.fun/api/v1/bounties",
  "https://api.pump.fun/go/bounties",
];

async function scrape(): Promise<RawBounty[]> {
  if (process.env.SCRAPER_DRY_RUN === "true") return [];

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return await res.json();
    } catch { /* try next */ }
  }

  // Playwright fallback — launches Chromium headless
  return await scrapeWithPlaywright();
}
`}</Code>

          <H3>Normalizer</H3>
          <P>
            Raw Pump.fun data has inconsistent field names across API versions.
            The normalizer maps every known variant to a canonical shape:
          </P>
          <Code lang="typescript">{`
// apps/worker/src/normalizer.ts
function extractField(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return "";
}

export function normalize(raw: Record<string, unknown>): NormalizedBounty {
  return {
    externalId: extractField(raw, "id", "bounty_id", "bountyId"),
    title:      extractField(raw, "title", "name", "bounty_title"),
    description: extractField(raw, "description", "desc", "body"),
    rewardUsd:  extractField(raw, "reward_usd", "rewardUsd", "reward", "amount"),
    status:     normalizeStatus(extractField(raw, "status", "state")),
    link:       extractField(raw, "url", "link", "bounty_url"),
    deadline:   extractDate(raw),
    creatorAddress: extractField(raw, "creator", "creator_address", "wallet"),
    descriptionHash: hashDescription(extractField(raw, "description", "desc", "body")),
  };
}
`}</Code>

          <H3>Webhook Dispatcher</H3>
          <P>
            After each scrape cycle, the worker compares new bounties against active subscriptions.
            Matching bounties trigger a webhook POST to the subscriber's URL, signed with HMAC-SHA256.
          </P>
          <Code lang="typescript">{`
// Webhook payload
POST https://your-agent.example.com/hook
X-Agent-Go-Signature: sha256=<hmac>
Content-Type: application/json

{
  "event": "new_automatable_bounty",
  "bounty": {
    "id": "...",
    "title": "Scrape top 100 Solana wallets by PnL",
    "rewardUsd": "75.00",
    "classification": {
      "category": "digital_automatable",
      "effortEstimate": "medium",
      "confidence": 0.97
    }
  },
  "subscriptionId": "sub_01J...",
  "sentAt": "2026-06-06T..."
}
`}</Code>

          {/* ── API REFERENCE ────────────────────────────────── */}
          <H2 id="endpoints-ref">Full API Reference</H2>

          {[
            {
              method: "GET", path: "/v1/health", price: "FREE", color: "green",
              desc: "Returns API status, database connectivity check, and aggregated revenue by route. Use this as a liveness probe.",
              params: [],
              response: `{ "status": "ok", "version": "1.0.0", "db": "connected",\n  "revenue": { "GET /v1/bounties": { "calls": 12, "totalUsd": "0.12" } } }`,
            },
            {
              method: "GET", path: "/v1/bounties", price: "$0.01", color: "purple",
              desc: "Paginated list of all active bounties, ordered by createdAt DESC.",
              params: [["page", "number", "1", "Page number"], ["limit", "number", "20", "Items per page (max 100)"], ["status", "string", "active", "Filter: active | completed | expired | cancelled"]],
              response: `{ "data": [Bounty], "pagination": { "page": 1, "limit": 20, "total": 42, "hasNext": true } }`,
            },
            {
              method: "GET", path: "/v1/bounties/automatable", price: "$0.05", color: "purple",
              desc: "Only AI-verified automatable bounties. Sorted by rewardToEffortRatio DESC. Includes full classification metadata.",
              params: [["page", "number", "1", "Page"], ["limit", "number", "20", "Items per page"]],
              response: `{ "data": [Bounty & { classification: { rewardToEffortRatio: 75, ... } }] }`,
            },
            {
              method: "GET", path: "/v1/bounties/:id", price: "$0.005", color: "purple",
              desc: "Full bounty detail. Includes status history and classification reasoning. Triggers background re-classification if the bounty has changed since last classified.",
              params: [["id", "uuid", "required", "Bounty UUID"]],
              response: `{ ...Bounty, statusHistory: [{ status, changedAt }], classification: { reasoning: "..." } }`,
            },
            {
              method: "POST", path: "/v1/subscriptions", price: "$0.10", color: "yellow",
              desc: "Create a 24-hour webhook subscription. The server returns an HMAC secret — use it to verify incoming webhook signatures.",
              params: [["webhookUrl", "string", "required", "HTTPS endpoint to receive events"], ["filters.minRewardUsd", "number", "0", "Skip bounties below this reward"], ["filters.categories", "array", '["digital_automatable"]', "Category filter"], ["filters.maxEffort", "string", "null", "low | medium | high"]],
              response: `{ "id": "sub_01J...", "expiresAt": "...", "hmacSecret": "..." }`,
            },
          ].map((ep) => (
            <div key={ep.path} className="mb-8 rounded-xl border border-border bg-surface-2 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Badge color={ep.method === "POST" ? "yellow" : "green"}>{ep.method}</Badge>
                <code className="text-sm font-mono text-slate-300 flex-1">{ep.path}</code>
                <Badge color={ep.color}>{ep.price}</Badge>
              </div>
              <div className="px-5 py-4">
                <P>{ep.desc}</P>
                {ep.params.length > 0 && (
                  <>
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">Parameters</div>
                    <table className="w-full text-[12px] mb-4">
                      <thead><tr className="border-b border-border text-slate-600"><th className="text-left pb-2 pr-4">Name</th><th className="text-left pb-2 pr-4">Type</th><th className="text-left pb-2 pr-4">Default</th><th className="text-left pb-2">Description</th></tr></thead>
                      <tbody>{ep.params.map(([n, t, d, desc]) => (
                        <tr key={n} className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-cyan">{n}</td><td className="py-2 pr-4 text-slate-500">{t}</td><td className="py-2 pr-4 text-slate-600 font-mono">{d}</td><td className="py-2 text-slate-400">{desc}</td></tr>
                      ))}</tbody>
                    </table>
                  </>
                )}
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2">Response shape</div>
                <pre className="text-[12px] font-mono bg-[#050508] rounded-lg p-3 text-green border border-border overflow-x-auto">{ep.response}</pre>
              </div>
            </div>
          ))}

          {/* ── BUILD AN AGENT ───────────────────────────────── */}
          <H2 id="integration">Build an Agent That Uses This API</H2>
          <P>
            The <code className="text-cyan text-[12px] bg-surface px-1 rounded">@x402/fetch</code> package wraps the native <code className="text-cyan text-[12px] bg-surface px-1 rounded">fetch()</code> to handle the 402 → pay → retry cycle automatically.
            Your agent needs only a funded Solana devnet wallet with USDC.
          </P>

          <Code lang="typescript">{`
// examples/agent-consumer.ts
import { wrapFetch } from "@x402/fetch";
import { createSolanaWallet } from "@x402/svm/wallet";

const wallet = createSolanaWallet(process.env.SOLANA_PRIVATE_KEY!);

// Drop-in fetch replacement that auto-pays 402 responses
const paidFetch = wrapFetch(fetch, wallet);

// 1. Find the best automatable bounty (pays $0.05)
const res = await paidFetch("http://localhost:4021/v1/bounties/automatable");
const { data } = await res.json();

const best = data[0]; // sorted by rewardToEffortRatio
console.log(\`Best bounty: \${best.title} — $\${best.rewardUsd}\`);
console.log(\`Effort: \${best.classification.effortEstimate}\`);
console.log(\`AI reasoning: \${best.classification.reasoning}\`);

// 2. Get full detail for the top pick (pays $0.005)
const detail = await paidFetch(
  \`http://localhost:4021/v1/bounties/\${best.id}\`
);
const bounty = await detail.json();

// 3. Subscribe to alerts for future bounties ≥ $50 (pays $0.10)
await paidFetch("http://localhost:4021/v1/subscriptions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    webhookUrl: "https://my-agent.example.com/hook",
    filters: {
      minRewardUsd: 50,
      categories: ["digital_automatable"],
      maxEffort: "medium",
    },
  }),
});
`}</Code>

          <Callout type="tip">
            The total cost of the 3-step agent flow above is <strong className="text-white">$0.155</strong>. Compare that to OpenAI's $20/month plan minimum, or a typical API tier at $49/month.
            At scale, an agent querying 1000× per day pays <strong className="text-white">$10/day</strong> for the most expensive endpoint — and nothing when idle.
          </Callout>

          {/* ── DEPLOY ───────────────────────────────────────── */}
          <H2 id="deploy">Deployment</H2>
          <H3>Local dev</H3>
          <Code lang="bash">{`
# 1. Install deps
npm install

# 2. Create .env (copy from .env.example)
cp .env.example .env
# Fill in DATABASE_URL, PAYMENT_ADDRESS, ANTHROPIC_API_KEY

# 3. Run DB migration
npm run db:migrate

# 4. Start API + worker
npm run dev

# 5. Start frontend (separate terminal)
npm run dev -w apps/web
# → http://localhost:5173
`}</Code>

          <H3>Switch to mainnet</H3>
          <Code lang="bash">{`
# .env changes for production
X402_NETWORK=solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
PAYMENT_ADDRESS=<your-solana-wallet>           # receives USDC payments
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # mainnet USDC
`}</Code>

          <H3>Docker Compose</H3>
          <Code lang="yaml">{`
# docker-compose.yml (included in repo)
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: agentgo
      POSTGRES_USER: agentgo
  api:
    build: apps/api
    env_file: .env
    depends_on: [db]
    ports: ["4021:4021"]
  worker:
    build: apps/worker
    env_file: .env
    depends_on: [db, api]
`}</Code>

          <div className="mt-16 p-6 rounded-2xl border border-purple/30 bg-gradient-to-br from-purple/5 to-transparent">
            <div className="text-lg font-bold text-white mb-2">Contributing</div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              PRs welcome. The codebase is intentionally minimal — no ORM magic, no framework abstractions beyond Hono and Drizzle.
              If you're adding a new endpoint, write the Vitest integration test first (see <code className="text-cyan font-mono text-[12px]">apps/api/src/__tests__/x402flow.test.ts</code> for the pattern).
            </p>
            <a href="https://github.com/tow3web3/x402" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple hover:text-purple/80 transition-colors">
              github.com/tow3web3/x402
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>

        </main>
      </div>
    </div>
  );
}
