import { describe, it, expect, vi, beforeAll } from "vitest";
import { Hono } from "hono";
import type { Context, Next } from "hono";

// ── Promisified drizzle query chain ──────────────────────────────────────────
// Each chainable method returns a new object. The chain is a real Promise so
// vitest/v8 don't get confused by hand-rolled thenables.
function makeChain(value: unknown = []): Record<string, unknown> & Promise<unknown> {
  const p = Promise.resolve(value) as Record<string, unknown> & Promise<unknown>;
  const methods = [
    "from", "where", "limit", "offset", "orderBy",
    "innerJoin", "leftJoin", "returning", "set", "values",
    "onConflictDoUpdate",
  ];
  for (const m of methods) {
    p[m] = vi.fn(() => makeChain(value));
  }
  return p;
}

const fakeDb = {
  execute: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  select: vi.fn(() => makeChain([])),
  insert: vi.fn(() => makeChain([])),
  update: vi.fn(() => makeChain([])),
  query: {
    bounties: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    bountyClassifications: { findFirst: vi.fn().mockResolvedValue(null) },
  },
};

// ── Paywalled routes (mirrors apps/api/src/index.ts protectedRoutes) ─────────
const PAYWALLED: Record<string, string> = {
  "GET /v1/bounties": "$0.01",
  "GET /v1/bounties/automatable": "$0.05",
  "POST /v1/subscriptions": "$0.10",
};

function isPaywalled(method: string, path: string) {
  // Exact match
  const key = `${method} ${path}`;
  if (PAYWALLED[key]) return { price: PAYWALLED[key] };
  // :id pattern
  if (method === "GET" && /^\/v1\/bounties\/[^/]+$/.test(path) && path !== "/v1/bounties/automatable") {
    return { price: "$0.005" };
  }
  return null;
}

vi.mock("@bountr/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@bountr/shared")>();
  return { ...actual, createDb: vi.fn(() => fakeDb) };
});

// x402 middleware: gates only configured routes, lets others through
vi.mock("@x402/hono", () => ({
  paymentMiddleware: () => async (c: Context, next: Next) => {
    const match = isPaywalled(c.req.method, c.req.path);
    if (!match) return next();

    const payment = c.req.header("X-PAYMENT");
    if (!payment) {
      return c.json(
        {
          x402Version: 2,
          error: "Payment Required",
          accepts: [{ scheme: "exact", network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
                      price: match.price, payTo: "TestWalletAddress" }],
        },
        402,
      );
    }
    await next();
    c.res.headers.set(
      "X-PAYMENT-RESPONSE",
      Buffer.from(JSON.stringify({ payer: "MockPayerAddress", transaction: "mock-tx" })).toString("base64"),
    );
  },
  x402ResourceServer: vi.fn(() => ({ register: vi.fn().mockReturnThis() })),
}));

vi.mock("@x402/svm", () => ({ ExactSvmScheme: vi.fn() }));
vi.mock("@x402/core/server", () => ({ HTTPFacilitatorClient: vi.fn() }));
vi.mock("pino", () => ({
  default: vi.fn(() => ({
    info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn(),
  })),
}));
vi.mock("pino-pretty", () => ({}));

process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
process.env.PAYMENT_ADDRESS = "TestAddr111111111111111111111111111";
process.env.ANTHROPIC_API_KEY = "sk-ant-test";
process.env.X402_FACILITATOR_URL = "https://x402.org/facilitator";
process.env.X402_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
process.env.NODE_ENV = "test";
process.env.PORT = "3001";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("x402 payment flow", () => {
  let app: Hono;

  beforeAll(async () => {
    const mod = await import("../index");
    app = mod.default as unknown as Hono;
  });

  it("returns 402 with accepts when no X-PAYMENT header on a paywalled route", async () => {
    const res = await app.request("/v1/bounties");
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe("Payment Required");
    expect(Array.isArray(body.accepts)).toBe(true);
    expect(body.accepts[0]).toMatchObject({ scheme: "exact", network: expect.stringContaining("solana") });
  });

  it("returns 200 with X-PAYMENT-RESPONSE on a paywalled route with payment", async () => {
    const res = await app.request("/v1/bounties", {
      headers: { "X-PAYMENT": "mock-payment-base64" },
    });
    expect(res.status).toBe(200);
    const paymentResp = res.headers.get("X-PAYMENT-RESPONSE");
    expect(paymentResp).toBeTruthy();
    const decoded = JSON.parse(Buffer.from(paymentResp!, "base64").toString());
    expect(decoded.payer).toBe("MockPayerAddress");
  });

  it("returns 200 for /v1/health without any payment (free endpoint)", async () => {
    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(["ok", "degraded"]).toContain(body.status);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.request("/v1/nonexistent");
    expect(res.status).toBe(404);
  });
});
