import "dotenv/config";
import { Pool } from "pg";

export const dbPool = new Pool({
	connectionString: process.env.DATABASE_URL
});

export async function closeDbPool() {
	await dbPool.end();
}
