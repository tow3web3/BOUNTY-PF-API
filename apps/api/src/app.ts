import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "@bountr/shared";
import { config } from "./config";
import { logger } from "./logger";
import { createHealthRouter } from "./routes/health";
import { createBountiesRouter } from "./routes/bounties";
import { createSubscriptionsRouter } from "./routes/subscriptions";
import { createLandingRouter } from "./routes/landing";
import { createCronRouter } from "./routes/cron";
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

app.use("/v1/*", async (c, next) => {
  await next();
  const wallet = c.req.query("wallet") ?? c.req.header("x-wallet") ?? null;
  if (wallet && wallet.length >= 32 && wallet.length <= 44) {
    trackRevenue(db, `${c.req.method} ${c.req.path}`, wallet, "0").catch(() => null);
  }
});

app.route("/", createLandingRouter(db));
app.route("/v1/health", createHealthRouter(db));
app.route("/v1/bounties", createBountiesRouter(db, config.OPENAI_API_KEY));
app.route("/v1/subscriptions", createSubscriptionsRouter(db));
app.route("/cron", createCronRouter(db, config));

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  logger.error({ err, path: c.req.path }, "Unhandled error");
  return c.json({ error: "Internal server error" }, 500);
});

export { app, db };
