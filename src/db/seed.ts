import { getDb } from "./index";
import { sites } from "./schema";

async function main() {
  const db = getDb();
  await db
    .insert(sites)
    .values([{ slug: "hub" }, { slug: "invest-note" }, { slug: "today-alive" }])
    .onConflictDoNothing();
  console.log("seeded: sites");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
