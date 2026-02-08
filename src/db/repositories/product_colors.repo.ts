import { Pool } from "pg";
import { ProductColor } from "~/types/index.js";

export type ProductColorUpsertInput = {
	product_id: string;
	color: ProductColor;
};

export class ProductColorsRepository {
	constructor(private readonly db: Pool) {}

	async upsert(input: ProductColorUpsertInput): Promise<void> {
		await this.db.query(
			`
			insert into product_colors (product_id, name)
			values ($1, $2)
			on conflict (product_id, name)
			do update set name = excluded.name
			`,
			[input.product_id, input.color.name]
		);
	}

	async findIdByProductAndName(product_id: string, name: string): Promise<number | null> {
		const result = await this.db.query<{ id: number }>(
			`select id from product_colors where product_id = $1 and name = $2`,
			[product_id, name]
		);

		return result.rows[0]?.id ?? null;
	}
}
