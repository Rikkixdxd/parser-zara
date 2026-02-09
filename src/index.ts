import { closeDbPool, dbPool } from "~/db/client.js";
import { setupDatabase } from "~/db/setup.js";
import { extractProductCategoriesInfo, extractProductsIds } from "~/extraction/dto.js";
import { getAllCategories, getCategoryFilters, getProductDetails } from "~/extraction/api.js";
import { ProductsRepository } from "./db/repositories/products_details.repo.js";
import { ProductsDetailsDtoRepository } from "./db/repositories/product_details_dto.repo.js";
import { ProductImagesRepository } from "./db/repositories/product_images.repo.js";
import { ProductColorsRepository } from "./db/repositories/product_colors.repo.js";
import { ColorImagesRepository } from "./db/repositories/color_images.repo.js";
import { ColorSizesRepository } from "./db/repositories/color_sizes.repo.js";
import { CategoriesRepository } from "./db/repositories/categories.repo.js";
import { BrandsRepository } from "./db/repositories/brands.repo.js";
import { normalizeProductDetails } from "./normalize/product_details.normalize.js";

async function main() {
  await setupDatabase(dbPool);

  const productIds = new Set<number>();
  const categoryIds = new Set<number>();
  const categoryNames = new Map<number, string>();
  const productCategoryMap = new Map<number, number>();
  
  const ProductsRepo = new ProductsRepository(dbPool);
  const ProductDetailsDtoRepo = new ProductsDetailsDtoRepository(dbPool);
  const ProductImagesRepo = new ProductImagesRepository(dbPool);
  const ProductColorsRepo = new ProductColorsRepository(dbPool);
  const ColorImagesRepo = new ColorImagesRepository(dbPool);
  const ColorSizesRepo = new ColorSizesRepository(dbPool);
  const CategoriesRepo = new CategoriesRepository(dbPool);
  const BrandsRepo = new BrandsRepository(dbPool);

  // getting categories and category ids
  console.log("Categories not found in database, fetching from API...");
  const allCategoriesRaw = await getAllCategories();
  console.log('### Fetched categories from API, saving to database...');
  const categoriesInfo = extractProductCategoriesInfo(allCategoriesRaw);
  for (const entry of categoriesInfo) {
    categoryIds.add(entry.id);
    categoryNames.set(entry.id, entry.name);
    await CategoriesRepo.upsert({ id: entry.id, name_en: entry.name });
  }
  console.log('Saved category IDs in memory...');

  // getting filters for each category and extracting product ids
  for (const categoryId of categoryIds) {
    console.log('### Getting category filters...');
    console.log('Processing category ID: ' + categoryId);
    console.log('Category name: ' + (categoryNames.get(categoryId) ?? ""));
    const filterResponse = await getCategoryFilters(categoryId);
    console.log('Fetched filters for category ID: ' + categoryId);
    const extractedIds = extractProductsIds(filterResponse);
    console.log(extractedIds.length + " product IDs extracted for category ID: " + categoryId);
    console.log('Extracted product IDs for category ID: ' + categoryId);
    for (const id of extractedIds) {
      productIds.add(id);
      if (!productCategoryMap.has(id)) {
        productCategoryMap.set(id, categoryId);
      }
    }
  }

  const ids = Array.from(productIds)
  for (let i = 0; i < ids.length; i += 5) {
    const chunk = ids.slice(i, i + 5);
    console.log('chunk: ' + chunk.join(", "));
    console.log(`### Fetched product details for IDs: ${chunk.join(", ")}`);
    const details = await getProductDetails(chunk);
    const wearDetails = details.filter(
      (detail) => detail.kind?.toLowerCase() === "wear"
    );
    console.log('Fetched details.');
    await ProductDetailsDtoRepo.upsertMany(wearDetails);

    for (const detail of wearDetails) {
      const normalized = normalizeProductDetails(detail);
      const productId = normalized.product.sku;

      if (!productId) {
        continue;
      }

      const brandName = detail.brand?.brandGroupCode ?? "zara";
      const brandId = brandName ? await BrandsRepo.upsertAndGetId(brandName) : null;

      await ProductsRepo.upsert({
        ...normalized.product,
        brand_id: brandId,
        category_id: productCategoryMap.get(Number(productId)) ?? null
      });

      for (const [index, image] of normalized.images.entries()) {
        await ProductImagesRepo.upsert({
          product_id: productId,
          image,
          sort_order: index + 1
        });
      }

      for (const color of normalized.colors) {
        await ProductColorsRepo.upsert({
          product_id: productId,
          color
        });

        const colorId = await ProductColorsRepo.findIdByProductAndName(
          productId,
          color.name ?? ""
        );

        if (!colorId) {
          continue;
        }

        for (const [index, imageUrl] of color.image_original.entries()) {
          await ColorImagesRepo.upsert({
            color_id: colorId,
            image_original: imageUrl,
            sort_order: index + 1
          });
        }

        for (const size of color.sizes) {
          await ColorSizesRepo.upsert({
            color_id: colorId,
            size
          });
        }
      }
    }
  }
  console.log('Saved product details in database.');
  console.log("Done.");
}

try {
  await main();
} finally {
  await closeDbPool();
}
