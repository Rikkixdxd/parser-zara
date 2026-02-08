import { Pool } from "pg";
export class BrandsRepository {
  constructor(private readonly db: Pool) {}

  async upsert(name: string): Promise<void> {
    await this.db.query(
      `
      insert into brands (name)
      values ($1)
      on conflict (name)
      do update set name = excluded.name
      `,
      [name]
    );
  }

  async upsertAndGetId(name: string): Promise<number | null> {
    const result = await this.db.query<{ id: number }>(
      `
      insert into brands (name)
      values ($1)
      on conflict (name)
      do update set name = excluded.name
      returning id
      `,
      [name]
    );

    return result.rows[0]?.id ?? null;
  }
}
