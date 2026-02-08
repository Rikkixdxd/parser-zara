import { Brand, type BrandDto } from "~/types/index.js";

export function normalizeBrand(input: BrandDto | string | null | undefined): Brand | null {
	const name = typeof input === "string" ? input : input?.name ?? null;
	const normalized = name?.trim();

	if (!normalized) return null;

	return {
		id: 0,
		name: normalized
	};
}
