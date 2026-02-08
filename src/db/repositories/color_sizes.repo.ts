import { Pool } from "pg";
import { ColorSize } from "~/types/index.js";

export type ColorSizeUpsertInput = {
	color_id: number;
	size: ColorSize;
};

export class ColorSizesRepository {
	constructor(private readonly db: Pool) {}

	async upsert(input: ColorSizeUpsertInput): Promise<void> {
		await this.db.query(
			`
			insert into color_sizes (
				color_id,
				name,
				internal_size,
				ru_size,
				available,
				price,
				discount_price
			)
			values ($1, $2, $3, $4, $5, $6, $7)
			on conflict (color_id, name)
			do update set
				internal_size = excluded.internal_size,
				ru_size = excluded.ru_size,
				available = excluded.available,
				price = excluded.price,
				discount_price = excluded.discount_price
			`,
			[
				input.color_id,
				input.size.name,
				input.size.internal_size,
				input.size.ru_size,
				input.size.available,
				input.size.price,
				input.size.discount_price
			]
		);
	}
}
