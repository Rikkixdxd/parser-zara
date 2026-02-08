
### `products`
- `id` (PK, UUID)
- `sku` (UUID, UNIQUE)
- `slug` (TEXT, UNIQUE)
- `title` (TEXT, nullable)
- `title_en` (TEXT)
- `title_ru` (TEXT)
- `declaration_title_en` (TEXT)
- `declaration_title_ru` (TEXT)
- `info` (TEXT)
- `info_ru` (TEXT)
- `original_price` (DECIMAL)
- `discount_price` (DECIMAL)
- `external_url` (TEXT)
- `available` (BOOLEAN)
- `brand_id` (FK → brands.id)
- `category_id` (FK → categories.id)

### `brands`
- `id` (PK)
- `name` (TEXT, UNIQUE)

### `categories`
- `id` (PK)
- `name_en` (TEXT, UNIQUE)

### `product_images`
- `id` (PK)
- `product_id` (FK → products.id)
- `image_original` (TEXT)
- `sort_order` (INT)

### `product_colors`
- `id` (PK)
- `product_id` (FK → products.id)
- `name` (TEXT)

### `color_images`
- `id` (PK)
- `color_id` (FK → product_colors.id)
- `image_original` (TEXT)
- `sort_order` (INT)

### `color_sizes`
- `id` (PK)
- `color_id` (FK → product_colors.id)
- `name` (TEXT)
- `internal_size` (TEXT, nullable)
- `ru_size` (TEXT, nullable)
- `available` (BOOLEAN)
- `price` (DECIMAL)
- `discount_price` (DECIMAL)