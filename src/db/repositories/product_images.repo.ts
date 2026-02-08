import { Pool } from "pg";
import { ProductImage } from "~/types/index.js";

export type ProductImageUpsertInput = {
	product_id: string;
	image: ProductImage;
	sort_order: number;
};

export class ProductImagesRepository {
	constructor(private readonly db: Pool) {}

	async upsert(input: ProductImageUpsertInput): Promise<void> {
		await this.db.query(
			`
			insert into product_images (product_id, image_original, sort_order)
			values ($1, $2, $3)
			on conflict (product_id, image_original)
			do update set sort_order = excluded.sort_order
			`,
			[input.product_id, input.image.image_original, input.sort_order]
		);
	}
}
