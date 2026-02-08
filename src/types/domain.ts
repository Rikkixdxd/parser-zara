export type ProductImage = {
  id: number;
  image_original: string;
}

export type ColorSize = {
  name: string;
  internal_size: string | null;
  ru_size: string | null;
  available: boolean;
  price: number | null;
  discount_price: number | null;
}

export type ProductColor = {
  product_id: string;
  name: string | null;
  image_original: string[];
  sizes: ColorSize[];
}

export type Brand = {
  id: number;
  name: string;
}

export type Category = {
  id: number;
  name_en: string;
}

export type Product = {
  sku: string | null;
  slug: string | null;
  title: string | null;
  title_en: string | null;
  title_ru: string | null;
  declaration_title_en: string | null;
  declaration_title_ru: string | null;
  info: string | null;
  info_ru: string | null;
  original_price: number | null;
  discount_price: number | null;
  external_url: string | null;
  available: boolean;
  images: ProductImage[];
  colors: ProductColor[];
}
