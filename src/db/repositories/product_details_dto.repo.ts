import { Pool } from "pg";
import { ProductDetailsDto } from "~/types/dto.js";

export class ProductsDetailsDtoRepository {
  constructor(private readonly db: Pool) {}

  async upsert(input: ProductDetailsDto): Promise<void> {
    const query = `
      insert into product_details_dto (product_id, payload, last_seen_at)
      values ($1, $2, now())
      on conflict (product_id)
      do update set payload = excluded.payload, last_seen_at = excluded.last_seen_at
    `;

    await this.db.query(query, [input.id, input]);
  }

  async upsertMany(inputs: ProductDetailsDto[]): Promise<void> {
    const uniqueInputs = Array.from(
      new Map(inputs.map((input) => [input.id, input])).values()
    );

    console.log(uniqueInputs.length + " product details to upsert...");
    if (uniqueInputs.length === 0) {
      return;
    }

    const values: Array<string> = [];
    const params: Array<number | ProductDetailsDto> = [];

  uniqueInputs.forEach((input, index) => {
      const baseIndex = index * 2;
      values.push(`($${baseIndex + 1}, $${baseIndex + 2}, now())`);
      params.push(input.id, input);
    });

    const query = `
      insert into product_details_dto (product_id, payload, last_seen_at)
      values ${values.join(", ")}
      on conflict (product_id)
      do update set payload = excluded.payload, last_seen_at = excluded.last_seen_at
    `;

    await this.db.query(query, params);
  }

  async getById(productId: number): Promise<ProductDetailsDto | null> {
    const query = `
      select payload
      from product_details_dto
      where product_id = $1
    `;

    const result = await this.db.query<{ payload: ProductDetailsDto }>(query, [productId]);
    return result.rows[0]?.payload ?? null;
  }
}
