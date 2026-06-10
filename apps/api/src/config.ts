import { z } from "zod";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(process.cwd(), "../../.env"), quiet: true });
dotenvConfig({ path: resolve(process.cwd(), ".env"), quiet: true });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  OPENAI_API_KEY: z.string().min(1).optional().default(""),
  CRON_SECRET: z.string().optional().default(""),

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
