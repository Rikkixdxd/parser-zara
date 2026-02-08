import { ColorSize, type ProductSizeDto } from "~/types/index.js";

export function normalizeColorSizes(
	color_id: number,
	sizes: ProductSizeDto[] = []
): ColorSize[] {
	return sizes
		.map((size) => ({
			id: 0,
			color_id,
			name: size.name?.trim() ?? "",
			internal_size: size.internal_size ?? null,
			ru_size: size.ru_size ?? null,
			available: size.available ?? false,
			price: size.price ?? null,
			discount_price: size.discount_price ?? null
		}))
		.filter((size) => size.name.length > 0);
}
