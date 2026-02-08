import { Category, type ProductCategoryDto } from "~/types/index.js";

export function normalizeCategory(input: ProductCategoryDto | string | null | undefined): Category | null {
	const name = typeof input === "string" ? input : input?.name_en ?? null;
	const normalized = name?.trim();

	if (!normalized) return null;

	return {
		id: 0,
		name_en: normalized
	};
}
