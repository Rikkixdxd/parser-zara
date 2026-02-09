import {
  CategoryDto,
  FiltersResponseDto,
} from "~/types/dto.js";

export type CategoryInfo = {
  id: number;
  name: string;
};

const PRODUCT_CATEGORY_LAYOUT = "products-category-view";
const DIVIDER_NAME_REGEX = /^\s*(?:-|DIVIDER)/i;
const ALLOWED_ROOT_SECTIONS = new Set(["WOMAN", "MAN", "KIDS", "KID"]);
const EXCLUDED_KEYWORDS = [
  "giftcard",
  "gift-card",
  "gift card",
  "careers",
  "stores",
  "store",
  "download-app",
  "join-life",
  "preowned",
  "zara-travel"
];

function hasExcludedKeyword(value: string | undefined | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return EXCLUDED_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isProductCategory(category: CategoryDto): boolean {
  if (category.layout !== PRODUCT_CATEGORY_LAYOUT) {
    return false;
  }

  if (category.irrelevant === true) {
    return false;
  }

  const name = category.name?.trim() ?? "";
  if (!name || DIVIDER_NAME_REGEX.test(name)) {
    return false;
  }

  if (hasExcludedKeyword(name) || hasExcludedKeyword(category.seo?.keyword)) {
    return false;
  }

  if (category.key && /^DIVIDER/i.test(category.key)) {
    return false;
  }

  return true;
}

function isAllowedRootCategory(category: CategoryDto): boolean {
  const name = category.name?.trim().toUpperCase();
  const sectionName = category.sectionName?.trim().toUpperCase();
  const key = category.key?.toUpperCase();

  if (name && ALLOWED_ROOT_SECTIONS.has(name)) {
    return true;
  }

  if (sectionName && ALLOWED_ROOT_SECTIONS.has(sectionName)) {
    return true;
  }

  if (key) {
    if (key.includes("MUJER") || key.includes("WOMAN")) {
      return true;
    }
    if (key.includes("HOMBRE") || key.includes("MAN")) {
      return true;
    }
    if (key.includes("NINOS") || key.includes("NIÑOS") || key.includes("KIDS") || key.includes("KID")) {
      return true;
    }
  }

  return false;
}

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

export function extractProductCategoriesInfo(categories: CategoryDto[]): CategoryInfo[] {
  const ids: CategoryInfo[] = [];
  const stack = categories.filter(isAllowedRootCategory);

  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) {
      continue;
    }

    if (isProductCategory(current)) {
      ids.push({ id: current.id, name: current.name });
    }

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