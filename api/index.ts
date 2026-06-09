import { handle } from "@hono/node-server/vercel";
import { Hono } from "hono";
import { app } from "../apps/api/src/app";

// Vercel rewrites /api/* → this function, preserving the original path.
// Hono routes are at /v1/... (no /api prefix), so we mount the app at /api
// so Hono sees /v1/... after the prefix is stripped.
// The /v1/(.*) rewrite passes the path as-is, so we also catch it directly.
const root = new Hono();
root.route("/api", app);
root.all("*", (c) => app.fetch(c.req.raw));

export default handle(root);
export const config = { maxDuration: 30 };
