import type { MiddlewareHandler } from "hono";

// In-memory sliding-window rate limiter keyed by payer address.
// For multi-instance deployments, replace with Redis-backed store.

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000; // 1 minute

const store = new Map<string, Window>();

// Clean expired windows every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (now > win.resetAt) store.delete(key);
  }
}, 5 * 60_000);

export function createRateLimiter(maxPerMinute: number): MiddlewareHandler {
  return async (c, next) => {
    // x402 middleware sets the payer in a response header after settlement.
    // We read it from the request-context variable set by the revenue hook.
    const payer = c.get("payerAddress") as string | undefined;
    if (!payer) {
      await next();
      return;
    }

    const now = Date.now();
    const win = store.get(payer);

    if (!win || now > win.resetAt) {
      store.set(payer, { count: 1, resetAt: now + WINDOW_MS });
      await next();
      return;
    }

    if (win.count >= maxPerMinute) {
      return c.json({ error: "Rate limit exceeded. Try again in 60 seconds." }, 429);
    }

    win.count += 1;
    await next();
  };
}
