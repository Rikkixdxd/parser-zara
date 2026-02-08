import { ColorImage } from "~/types/index.js";

export function normalizeColorImages(
	color_id: number,
	images: string[] = []
): ColorImage[] {
	return images
		.map((image, index) => ({
			id: 0,
			color_id,
			image_original: image.trim(),
			sort_order: index + 1
		}))
		.filter((image) => image.image_original.length > 0);
}
