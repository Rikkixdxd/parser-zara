import { ProductDetailsDto } from "~/types/dto.js";
import { ColorSize, Product, ProductColor, ProductImage } from "~/types/domain.js";
import { ProductMediaDto } from "~/types/dto.js";

type NormalizedProductDetails = {
	product: Product;
	images: ProductImage[];
	colors: ProductColor[];
};

function extractMediaUrls(media: ProductMediaDto[] | undefined): string[] {
	if (!media) {
		return [];
	}

	return media
		.map((item) => item.extraInfo?.deliveryUrl ?? item.url ?? null)
		.filter((url): url is string => Boolean(url));
}

function uniqueStrings(values: string[]): string[] {
	return Array.from(new Set(values.filter(Boolean)));
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function normalizeColors(input: ProductDetailsDto, productId: string): ProductColor[] {
	const colors = input.detail?.colors ?? [];

	return colors.map((color) => {
		const imageUrls = uniqueStrings([
			...extractMediaUrls(color.mainImgs),
			...extractMediaUrls(color.xmedia),
			...extractMediaUrls(color.shopcartMedia),
			...extractMediaUrls(color.colorSelectorMedias)
		]);
		const sizes = (color.sizes ?? [])
			.map((size) => {
				if (!size.name) {
					return null;
				}
				const originalPrice = size.originalPrice ?? color.originalPrice;
				const salePrice = size.price ?? color.price;
				const normalized: ColorSize = {
					name: size.name,
					internal_size: size.name,
					ru_size: null,
					available: size.availability === "in_stock",
					price: originalPrice ? originalPrice / 100 : null,
					discount_price: salePrice ? salePrice / 100 : null
				};
				return normalized;
			})
			.filter((size): size is ColorSize => size !== null);

		return {
			product_id: productId,
			name: color.name?.trim() || "",
			image_original: imageUrls,
			sizes
		};
	});
}

export function normalizeProductDetails(input: ProductDetailsDto): NormalizedProductDetails {
	const firstColor = input.detail?.colors?.[0];
	const productId = String(firstColor?.productId ?? input.id);
	const imageUrls = uniqueStrings([
		...extractMediaUrls(firstColor?.mainImgs),
		...extractMediaUrls(firstColor?.xmedia),
		...extractMediaUrls(firstColor?.shopcartMedia),
		...extractMediaUrls(firstColor?.colorSelectorMedias)
	]);

	const images: ProductImage[] = imageUrls.map((url, index) => ({
		id: index + 1,
		image_original: url
	}));

	const colors = normalizeColors(input, productId);

	const available = colors.some((color) =>
		color.sizes.some((size) => size.available)
	);

	const primaryOriginalPrice =
		firstColor?.originalPrice ??
		firstColor?.sizes?.[0]?.originalPrice ??
		firstColor?.pricing?.price?.value ??
		null;
	const primarySalePrice =
		firstColor?.price ??
		firstColor?.sizes?.[0]?.price ??
		null;

	const brandCode = input.brand?.brandGroupCode ?? "zara";
	const keyword = input.seo?.keyword ?? input.name ?? "";
	const colorName = firstColor?.name ?? "";
	const slug = slugify(`${brandCode} ${keyword} ${colorName}`);
	const declarationTitle = input.name ? input.name.toLowerCase() : null;
	const seoProductId = input.seo?.seoProductId ?? firstColor?.reference?.split("-")[0] ?? "";
	const externalUrl = keyword && seoProductId
		? `https://www.zara.com/pt/en/${keyword}-p${seoProductId}.html`
		: null;

	const originalPrice = primaryOriginalPrice
		? primaryOriginalPrice / 100
		: primarySalePrice
			? primarySalePrice / 100
			: null;
	const discountPrice =
		primaryOriginalPrice && primarySalePrice && primarySalePrice < primaryOriginalPrice
			? primarySalePrice / 100
			: null;

	const product: Product = {
		sku: productId,
		slug: slug || null,
		title: null,
		title_en: input.name ?? null,
		title_ru: null,
		declaration_title_en: declarationTitle,
		declaration_title_ru: null,
		info: firstColor?.description ?? null,
		info_ru: null,
		original_price: originalPrice,
		discount_price: discountPrice,
		external_url: externalUrl,
		available: available || colors.length === 0,
		images,
		colors
	};

	return { product, images, colors };
}
