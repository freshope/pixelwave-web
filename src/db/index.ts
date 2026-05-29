import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDB | undefined;

export function getDb(): DrizzleDB {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required at runtime");
  }
  const client = postgres(url, { max: 10, prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}
