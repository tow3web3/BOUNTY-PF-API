import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DB = ReturnType<typeof createDb>;

export function createDb(connectionString: string): ReturnType<typeof drizzle<typeof schema>> {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export { schema };
