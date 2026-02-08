import { Pool } from "pg";
import { Product } from "~/types/domain.js";

export type ProductUpsertInput = Product & {
	brand_id?: number | null;
	category_id?: number | null;
};

export class ProductsRepository {
	constructor(private readonly db: Pool) {}

	async upsert(input: ProductUpsertInput): Promise<void> {
		await this.db.query(
			`
			insert into products (
				sku,
				slug,
				title,
				title_en,
				title_ru,
				declaration_title_en,
				declaration_title_ru,
				info,
				info_ru,
				original_price,
				discount_price,
				external_url,
				available,
				brand_id,
				category_id
			)
			values (
				$1, $2, $3, $4, $5,
				$6, $7, $8, $9, $10,
				$11, $12, $13, $14, $15
			)
			on conflict (sku)
			do update set
				slug = excluded.slug,
				title = excluded.title,
				title_en = excluded.title_en,
				title_ru = excluded.title_ru,
				declaration_title_en = excluded.declaration_title_en,
				declaration_title_ru = excluded.declaration_title_ru,
				info = excluded.info,
				info_ru = excluded.info_ru,
				original_price = excluded.original_price,
				discount_price = excluded.discount_price,
				external_url = excluded.external_url,
				available = excluded.available,
				brand_id = excluded.brand_id,
				category_id = excluded.category_id
			`,
			[
				input.sku,
				input.slug,
				input.title,
				input.title_en,
				input.title_ru,
				input.declaration_title_en,
				input.declaration_title_ru,
				input.info,
				input.info_ru,
				input.original_price,
				input.discount_price,
				input.external_url,
				input.available,
				input.brand_id,
				input.category_id
			]
		);
	}
}
