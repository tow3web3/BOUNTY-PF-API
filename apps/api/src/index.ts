import { serve } from "@hono/node-server";
import { app } from "./app";
import { config } from "./config";
import { logger } from "./logger";

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, "Bountr API started");
});

export default app;
