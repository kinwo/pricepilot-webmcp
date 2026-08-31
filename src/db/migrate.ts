import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { config } from "dotenv";
import { Pool } from "pg";
import { products } from "./schema";
import { CATALOG } from "./demo-data";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_DATABASE_URL or DATABASE_URL is required to run migrations.");
  }

  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    await db
      .insert(products)
      .values(
        CATALOG.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          tagline: product.tagline,
          description: product.description,
          useCase: product.useCase,
          imagePath: product.imagePath,
          specs: product.specs,
          tags: product.tags,
          listPriceCents: product.listPriceCents,
          excellentPriceCents: product.excellentPriceCents,
          goodPriceCents: product.goodPriceCents,
          defaultNewStock: product.defaultNewStock,
          defaultExcellentStock: product.defaultExcellentStock,
          defaultGoodStock: product.defaultGoodStock
        }))
      )
      .onConflictDoNothing();
    console.log(`Database migrated and ${CATALOG.length} catalog products are available.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
