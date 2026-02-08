import { ProductColor, type ProductColorDto } from "~/types/index.js";
import { normalizeColorImages } from "./color_images.normalize.js";
import { normalizeColorSizes } from "./color_sizes.normalize.js";

export function normalizeProductColors(
	product_id: string,
	colors: ProductColorDto[] = []
): ProductColor[] {
	return colors.map((color) => {
		const images = normalizeColorImages(0, color.image_original ?? []);
		const sizes = normalizeColorSizes(0, color.sizes ?? []);

		return {
			id: 0,
			product_id,
			name: color.name?.trim() ?? null,
			images,
			sizes
		};
	});
}
