import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "@bountr/shared";
import { config } from "./config";
import { logger } from "./logger";
import { createHealthRouter } from "./routes/health";
import { createBountiesRouter } from "./routes/bounties";
import { createSubscriptionsRouter } from "./routes/subscriptions";
import { createLandingRouter } from "./routes/landing";
import { trackRevenue } from "./services/revenue";

const db = createDb(config.DATABASE_URL);

const app = new Hono();

app.use("*", cors());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start },
    "request",
  );
});

// Wallet tracking — records call history for fee distribution
// Clients pass: ?wallet=<solana-address>  OR  X-WALLET: <solana-address>
app.use("/v1/*", async (c, next) => {
  await next();
  const wallet = c.req.query("wallet") ?? c.req.header("x-wallet") ?? null;
  if (wallet && wallet.length >= 32 && wallet.length <= 44) {
    trackRevenue(db, `${c.req.method} ${c.req.path}`, wallet, "0").catch(() => null);
  }
});

app.route("/", createLandingRouter(db));
app.route("/v1/health", createHealthRouter(db));
app.route("/v1/bounties", createBountiesRouter(db));
app.route("/v1/subscriptions", createSubscriptionsRouter(db));

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  logger.error({ err, path: c.req.path }, "Unhandled error");
  return c.json({ error: "Internal server error" }, 500);
});

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, "Bountr API started");
});

export default app;
