import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ENV } from "./_core/env";

const pool = new Pool({
  connectionString: ENV.databaseUrl,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl:
    ENV.isProduction
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err: Error) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

pool.on("connect", () => {
  console.log("[DB] Connection pool: new connection established");
});

pool.on("remove", () => {
  console.log("[DB] Connection pool: connection removed");
});

export const db = drizzle(pool);
export { pool };
