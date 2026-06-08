import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import path from "path";

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/agentgo";

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log("Running migrations…");
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "migrations"),
  });
  console.log("Migrations complete.");
  await pool.end();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
