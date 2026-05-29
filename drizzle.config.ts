import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// 로컬 dev: .env.local 로드. 운영(Coolify)은 inject 된 env 그대로.
config({ path: ".env.local" });

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
