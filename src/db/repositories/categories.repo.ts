import { Pool } from "pg";
import { Category } from "~/types/index.js";

export type CategoryUpsertInput = {
	id: number;
	name_en: string;
};

export class CategoriesRepository {
	constructor(private readonly db: Pool) {}

	async upsert(input: CategoryUpsertInput): Promise<void> {
		await this.db.query(
			`
			insert into categories (id, name_en)
			values ($1, $2)
			on conflict (id)
			do update set name_en = excluded.name_en
			`,
			[input.id, input.name_en]
		);
	}

	async findByName(name_en: string): Promise<Category | null> {
		const result = await this.db.query<Category>(
			`select id, name_en from categories where name_en = $1`,
			[name_en]
		);

		return result.rows[0] ?? null;
	}
}
