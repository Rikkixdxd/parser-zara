import {
  CategoryDto,
  FiltersResponseDto,
} from "~/types/dto.js";

export type CategoryInfo = {
  id: number;
  name: string;
};

export function extractCategoriesInfo(categories: CategoryDto[]): CategoryInfo[] {
  const ids: CategoryInfo[] = [];
  const stack = [...categories];

  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) {
      continue;
    }

    ids.push({ id: current.id, name: current.name });

    const nested = current.subcategories ?? [];
    if (nested.length > 0) {
      stack.push(...nested);
    }
  }

  const unique = new Map<number, CategoryInfo>();
  for (const entry of ids) {
    if (!unique.has(entry.id)) {
      unique.set(entry.id, entry);
    }
  }

  return [...unique.values()];
}

export function extractProductsIds(filters: FiltersResponseDto): number[] {
  const ids = new Set<number>();

  for (const group of filters.filters ?? []) {
    for (const value of group.value ?? []) {
      for (const id of value.catentries ?? []) {
        if (typeof id === "number") {
          ids.add(id);
        }
      }
    }
  }

  for (const sortValue of filters.sorting ?.value?? []) {
    for (const id of sortValue.catentries ?? []) {
      if (typeof id === "number") {
        ids.add(id);
      }
    }
  }

  return [...ids];
}