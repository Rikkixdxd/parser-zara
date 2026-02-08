import { Pool } from "pg";

export type ColorImageUpsertInput = {
	color_id: number;
	image_original: string;
	sort_order: number;
};

export class ColorImagesRepository {
	constructor(private readonly db: Pool) {}

	async upsert(input: ColorImageUpsertInput): Promise<void> {
		await this.db.query(
			`
			insert into color_images (color_id, image_original, sort_order)
			values ($1, $2, $3)
			on conflict (color_id, image_original)
			do update set sort_order = excluded.sort_order
			`,
			[input.color_id, input.image_original, input.sort_order]
		);
	}
}
