import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;
type DatabaseGlobal = typeof globalThis & {
  __pricePilotPool?: Pool;
  __pricePilotDb?: Database;
};

const databaseGlobal = globalThis as DatabaseGlobal;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured. Add your pooled Neon connection string.");
  }

  if (!databaseGlobal.__pricePilotPool) {
    databaseGlobal.__pricePilotPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
  }

  return databaseGlobal.__pricePilotPool;
}

export function getDb() {
  if (!databaseGlobal.__pricePilotDb) {
    databaseGlobal.__pricePilotDb = drizzle(getPool(), { schema });
  }
  return databaseGlobal.__pricePilotDb;
}

