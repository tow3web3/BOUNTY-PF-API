# Bountr

A paywall API (x402 protocol, USDC on Solana) that lets AI agents discover and filter automatable bounties from [Pump.fun GO](https://go.pump.fun).

```
Agent → GET /v1/bounties/automatable
          │
          ├─ No payment → 402 Payment Required (accepts: USDC, Solana, $0.05)
          │
          └─ X-PAYMENT header → verify via facilitator → settle → 200 JSON
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                    │
│                                                     │
│  ┌──────────────┐    ┌────────────────────────────┐ │
│  │  apps/api    │    │      apps/worker           │ │
│  │  (Hono)      │    │  cron: every 60s           │ │
│  │              │    │  ┌────────────────────┐    │ │
│  │  x402 paywall│    │  │  scraper.ts        │    │ │
│  │  ──────────  │    │  │  go.pump.fun REST  │    │ │
│  │  /v1/bounties│    │  │  → Playwright      │    │ │
│  │  /v1/bounties│    │  └────────┬───────────┘    │ │
│  │    /automatable   │           │ upsert          │ │
│  │  /v1/bounties│    │  ┌────────▼───────────┐    │ │
│  │    /:id      │    │  │  classifier.ts     │    │ │
│  │  /v1/subscr. │    │  │  claude-sonnet-4-6 │    │ │
│  └──────┬───────┘    │  └────────┬───────────┘    │ │
│         │            │           │                 │ │
│         └────────────┼───────────┘                 │ │
│                      │      PostgreSQL             │ │
│                      └──── (shared DB) ────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Packages:**
| Path | Role |
|------|------|
| `packages/shared` | Drizzle schema, Zod schemas, TypeScript types |
| `apps/api` | Hono HTTP server, x402 middleware, classification service |
| `apps/worker` | Scraper cron, AI classifier, webhook dispatcher |

---

## Quick Start (local)

### Prerequisites
- Node.js ≥ 22
- Docker + Docker Compose
- A Solana wallet (mainnet or mainnet) to receive payments
- An [Anthropic API key](https://console.anthropic.com)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set PAYMENT_ADDRESS and ANTHROPIC_API_KEY at minimum
```

### 3. Start the database

```bash
docker compose up postgres -d
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Start API + Worker

```bash
npm run dev
```

The API is now available at `http://localhost:3000`.

---

## Docker (full stack)

```bash
cp .env.example .env  # fill in values

docker compose up --build
```

---

## API Reference

All endpoints except `/v1/health` require an x402 payment via the `X-PAYMENT` header.

### `GET /v1/health` — Free

```bash
curl http://localhost:3000/v1/health
```

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-06-05T10:00:00.000Z",
  "db": "connected",
  "revenue": { "GET /v1/bounties": 0.15 }
}
```

### `GET /v1/bounties` — $0.01

Paginated list of active bounties.

| Query | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number (max 100) | 20 |
| `status` | active \| completed \| expired \| cancelled | — |

### `GET /v1/bounties/automatable` — $0.05

Only `digital_automatable` bounties, sorted by reward/effort ratio.

```json
{
  "data": [{
    "id": "...",
    "title": "Scrape top 100 Solana wallets",
    "rewardUsd": "25.00",
    "classification": {
      "category": "digital_automatable",
      "confidence": 0.95,
      "effortEstimate": "low",
      "rewardToEffortRatio": 25.0,
      "reasoning": "Pure data extraction task requiring only a Solana RPC call."
    }
  }]
}
```

### `GET /v1/bounties/:id` — $0.005

Bounty detail with full status history and classification.

### `POST /v1/subscriptions` — $0.10

Create a 24-hour webhook subscription. You will be notified via POST to your `webhookUrl` for each new bounty matching your filters.

**Body:**
```json
{
  "webhookUrl": "https://your-agent.example.com/webhook",
  "filters": {
    "categories": ["digital_automatable"],
    "minReward": 10,
    "keywords": ["scraping", "on-chain"]
  }
}
```

**Response:**
```json
{
  "id": "...",
  "webhookUrl": "...",
  "expiresAt": "2026-06-06T10:00:00.000Z",
  "hmacSecret": "abc123..."
}
```

**Verify incoming webhooks:**
```typescript
const sig = req.headers["x-bountr-signature"]; // "sha256=<hex>"
const expected = "sha256=" + createHmac("sha256", hmacSecret).update(rawBody).digest("hex");
if (sig !== expected) throw new Error("Invalid signature");
```

---

## Agent Consumer Example

See [examples/agent-consumer.ts](examples/agent-consumer.ts) for a full TypeScript example using `@x402/fetch`.

```bash
AGENT_WALLET_PRIVATE_KEY=<base58-key> \
API_BASE_URL=http://localhost:3000 \
npx tsx examples/agent-consumer.ts
```

---

## x402 Payment Flow

```
1. Agent → GET /v1/bounties/automatable
2. Server → 402 Payment Required
   {
     "x402Version": 2,
     "error": "Payment Required",
     "accepts": [{
       "scheme": "exact",
       "price": "$0.05",
       "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
       "payTo": "<PAYMENT_ADDRESS>"
     }]
   }
3. Agent signs a USDC SPL transfer, encodes as X-PAYMENT header
4. Agent → GET /v1/bounties/automatable  (X-PAYMENT: <base64-payload>)
5. Server → facilitator: verify + settle
6. Server → 200 OK  (X-PAYMENT-RESPONSE: <base64-settlement>)
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PAYMENT_ADDRESS` | ✅ | Solana wallet to receive USDC |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key for classification |
| `X402_FACILITATOR_URL` | ✅ | x402 facilitator endpoint |
| `X402_NETWORK` | ✅ | CAIP-2 network (mainnet or mainnet) |
| `PORT` | — | API port (default: 3000) |
| `SCRAPER_DRY_RUN` | — | `true` to skip actual scraping |
| `SCRAPER_INTERVAL_SECONDS` | — | Poll interval in seconds (default: 60) |
| `SOLANA_RPC_URL` | — | Custom Solana RPC URL |

---

## Running Tests

```bash
npm test
```

Tests cover:
- `normalizer.test.ts` — bounty normalization & status mapping
- `classification.test.ts` — LLM output parsing with mocked Anthropic
- `x402flow.test.ts` — 402 → payment → 200 flow with mocked facilitator

---

## Mainnet Deployment

1. Create a [Coinbase CDP](https://portal.cdp.coinbase.com) account and get your facilitator URL.
2. Set `X402_NETWORK=solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` (mainnet).
3. Set `X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402`.
4. Ensure `PAYMENT_ADDRESS` is a funded Solana mainnet wallet.

> **Note:** This MVP provides discovery and classification only. It never auto-submits responses to bounties on Pump.fun GO.
