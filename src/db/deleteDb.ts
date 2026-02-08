import "dotenv/config";
import { Pool } from "pg";

export async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const res = await pool.query("select 1 as ok, now()");
  console.log(res.rows[0]);

  await pool.end();
}

export async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  await pool.query(`
    drop table if exists
      color_sizes,
      color_images,
      product_colors,
      product_images,
      products,
      brands,
      categories,
      product_details_dto,
      category_dto
    cascade
  `);

  await pool.end();
}

async function main() {
  await resetDatabase();
}

const entryUrl = process.argv[1]
  ? new URL(`file:///${process.argv[1].replace(/\\/g, "/")}`).href
  : null;
if (entryUrl && import.meta.url === entryUrl) {
  await main();
}
