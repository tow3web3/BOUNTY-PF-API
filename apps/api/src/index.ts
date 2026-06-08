import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { createDb } from "@agent-go/shared";
import { config } from "./config";
import { logger } from "./logger";
import { createHealthRouter } from "./routes/health";
import { createBountiesRouter } from "./routes/bounties";
import { createSubscriptionsRouter } from "./routes/subscriptions";
import { createLandingRouter } from "./routes/landing";
import { trackRevenue } from "./services/revenue";
import { createRateLimiter } from "./middleware/rateLimiter";

// ── DB ────────────────────────────────────────────────────────────────────────
const db = createDb(config.DATABASE_URL);

// ── x402 Resource Server ──────────────────────────────────────────────────────
const facilitatorClient = new HTTPFacilitatorClient({ url: config.X402_FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient).register(
  config.X402_NETWORK,
  new ExactSvmScheme(),
);

function makePaymentOption(price: string) {
  return {
    scheme: "exact" as const,
    payTo: config.PAYMENT_ADDRESS,
    price,
    network: config.X402_NETWORK,
    maxTimeoutSeconds: 300,
  };
}

const protectedRoutes = {
  "GET /v1/bounties": {
    accepts: makePaymentOption("$0.01"),
    description: "List active bounties",
    mimeType: "application/json",
  },
  "GET /v1/bounties/automatable": {
    accepts: makePaymentOption("$0.05"),
    description: "AI-classified automatable bounties with effort/reward scoring",
    mimeType: "application/json",
  },
  "GET /v1/bounties/:id": {
    accepts: makePaymentOption("$0.005"),
    description: "Bounty detail with status history",
    mimeType: "application/json",
  },
  "POST /v1/subscriptions": {
    accepts: makePaymentOption("$0.10"),
    description: "Create a 24h webhook subscription (notified on matching new bounties)",
    mimeType: "application/json",
  },
};

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono();

app.use("*", cors());

// Structured request logging
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start },
    "request",
  );
});

// x402 payment middleware — fetches supported schemes from facilitator at startup
app.use(paymentMiddleware(protectedRoutes, resourceServer));

// Revenue tracking + payer extraction (runs after x402 settles)
app.use("/v1/*", async (c, next) => {
  await next();
  // After x402 settlement the X-PAYMENT-RESPONSE header carries the settle response
  const paymentResponse = c.res.headers.get("X-PAYMENT-RESPONSE");
  if (paymentResponse) {
    try {
      const decoded = JSON.parse(Buffer.from(paymentResponse, "base64").toString());
      const payerAddress: string = decoded?.payer ?? "unknown";
      c.set("payerAddress", payerAddress);

      // Look up the price for the current route
      const routeKey = `${c.req.method} ${c.req.path.replace(/\/[0-9a-f-]{36}$/, "/:id")}`;
      const routeCfg = protectedRoutes[routeKey as keyof typeof protectedRoutes];
      const price = routeCfg?.accepts?.price ?? "0";

      await trackRevenue(db, `${c.req.method} ${c.req.path}`, payerAddress, String(price), decoded?.transaction);
    } catch {
      // silently ignore parse errors
    }
  }
});

const rateLimiter = createRateLimiter(30); // 30 paid calls / min / payer
app.use("/v1/*", rateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.route("/", createLandingRouter(db));
app.route("/v1/health", createHealthRouter(db));
app.route("/v1/bounties", createBountiesRouter(db));
app.route("/v1/subscriptions", createSubscriptionsRouter(db));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  logger.error({ err, path: c.req.path }, "Unhandled error");
  return c.json({ error: "Internal server error" }, 500);
});

// ── Start ─────────────────────────────────────────────────────────────────────
serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info(
    {
      port: info.port,
      network: config.X402_NETWORK,
      facilitator: config.X402_FACILITATOR_URL,
    },
    "Agent GO API started",
  );
});

export default app;
