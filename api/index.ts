import { handle } from "@hono/node-server/vercel";
import { app } from "../apps/api/src/app";

export default handle(app);

export const config = { maxDuration: 30 };
