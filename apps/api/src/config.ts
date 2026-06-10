import { z } from "zod";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(process.cwd(), "../../.env"), quiet: true });
dotenvConfig({ path: resolve(process.cwd(), ".env"), quiet: true });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  // x402 — Solana wallet address that receives payments
  PAYMENT_ADDRESS: z.string().optional().default(""),
  // Coinbase CDP facilitator: https://api.cdp.coinbase.com/platform/v2/x402
  // Use https://api.cdp.coinbase.com/platform/v2/x402 for mainnet testing
  X402_FACILITATOR_URL: z.string().url().default("https://api.cdp.coinbase.com/platform/v2/x402"),
  // "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" for mainnet,
  // "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" for mainnet
  X402_NETWORK: z
    .string()
    .default("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"),

  OPENAI_API_KEY: z.string().min(1).optional().default(""),

  // Optional Solana RPC (defaults to public endpoint inside @x402/svm)
  SOLANA_RPC_URL: z.string().url().optional(),
});

function loadConfig() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
