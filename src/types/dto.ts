export type CategoryDto = {
	id: number;
	key: string;
	name: string;
	subcategories?: CategoryDto[];
};

export type BrandDto = {
	name?: string | null;
};

export type ProductCategoryDto = {
	name_en?: string | null;
};

export type ProductImageDto = {
	id?: number;
	image_original?: string | null;
};

export type ProductSizeDto = {
	name?: string | null;
	internal_size?: string | null;
	ru_size?: string | null;
	available?: boolean;
	price?: number | null;
	discount_price?: number | null;
};

export type ProductColorDto = {
	name?: string | null;
	image_original?: string[];
	sizes?: ProductSizeDto[];
};

export type ProductSeoDto = {
	keyword?: string;
	description?: string;
	breadCrumb?: Array<{ text?: string; id?: number }>;
	seoProductId?: string;
	discernProductId?: number; // domain
	keyWordI18n?: Array<{ langId?: number; keyword?: string }>;
	irrelevant?: boolean;
	[key: string]: unknown;
};

export type ProductBrandInfoDto = {
	brandId?: number;
	brandGroupId?: number;
	brandGroupCode?: string; // domain
	[key: string]: unknown;
};

export type ProductAvailableColorDto = {
	colorName?: string | null; // domain
	name?: string | null; // domain
	hexColor?: string | null; // domain
	[key: string]: unknown;
};

export type ProductMediaLayerDto = {
	datatype?: string;
	set?: number;
	path?: string;
	url?: string;
	metaUrl?: string;
	[key: string]: unknown;
};

export type ProductMediaExtraInfoDto = {
	originalName?: string;
	assetId?: string;
	deliveryUrl?: string; // domain
	deliveryPath?: string; // domain
	availableZooms?: string[];
	[key: string]: unknown;
};

export type ProductMediaDto = {
	datatype?: string;
	set?: number;
	type?: string;
	kind?: string;
	path?: string;
	name?: string;
	width?: number;
	height?: number;
	timestamp?: string;
	allowedScreens?: string[];
	gravity?: string;
	extraInfo?: ProductMediaExtraInfoDto; // domain
	url?: string; // domain
	metaUrl?: string;
	order?: number;
	layers?: ProductMediaLayerDto[];
};

export type ProductDetailSizeDto = {
	availability?: string; // domain
	equivalentSizeId?: number;
	id?: number;
	name?: string; // domain
	price?: number; // domain
	oldPrice?: number;
	originalPrice?: number;
	discountPercentage?: string;
	discountLabel?: string;
	reference?: string;
	sku?: number; // domain
	attributes?: Array<Record<string, unknown>>;
	demand?: string;
	twinnedSkus?: number[];
};

export type ProductDetailPricingDto = {
	price?: {
		value?: number; // domain
		currency?: Record<string, unknown>;
	};
};

export type ProductDetailRelationDto = {
	ids?: number[];
	type?: string;
};

export type ProductDetailExtraInfoDto = {
	isStockInStoresAvailable?: boolean;
	highlightPrice?: boolean;
	[key: string]: unknown;
};

export type ProductDetailColorDto = {
	id?: string;
	hexCode?: string; // domain
	productId?: number; // domain
	name?: string; // domain
	reference?: string;
	stylingId?: string;
	outfitId?: string;
	xmedia?: ProductMediaDto[]; // domain
	pdpMedia?: ProductMediaDto; // domain
	shopcartMedia?: ProductMediaDto[];
	colorSelectorMedias?: ProductMediaDto[];
	price?: number; // domain
	oldPrice?: number;
	originalPrice?: number;
	discountPercentage?: string;
	discountLabel?: string;
	sizes?: ProductDetailSizeDto[]; // domain
	availability?: string;
	description?: string; // domain
	rawDescription?: string;
	extraInfo?: ProductDetailExtraInfoDto;
	customizations?: Array<Record<string, unknown>>;
	tagTypes?: Array<Record<string, unknown>>;
	attributes?: Array<Record<string, unknown>>;
	relations?: ProductDetailRelationDto[];
	pricing?: ProductDetailPricingDto;
	mainImgs?: ProductMediaDto[]; // domain
	priceUnavailable?: boolean;
};

export type ProductDetailCompositionPartDto = {
	description?: string;
	areas?: Array<Record<string, unknown>>;
	components?: Array<Record<string, unknown>>;
	microcontents?: Array<Record<string, unknown>>;
	reinforcements?: Array<Record<string, unknown>>;
};

export type ProductDetailCompositionDto = {
	parts?: ProductDetailCompositionPartDto[];
	exceptions?: Array<Record<string, unknown>>;
};

export type ProductDetailDto = {
	reference?: string;
	displayReference?: string;
	colors?: ProductDetailColorDto[]; // domain
	colorSelectorLabel?: string;
	multipleColorLabel?: string;
	detailedComposition?: ProductDetailCompositionDto;
	relatedProducts?: Array<Record<string, unknown>>;
};

export type ProductDetailsExtraInfoDto = {
	isSizeRecommender?: boolean;
	hasSpecialReturnConditions?: boolean;
	isNonReturnable?: boolean;
	hasInteractiveSizeGuide?: boolean;
	extraDetailTitle?: string;
	isBracketingRestricted?: boolean;
	hasTipsOnExtraDetail?: boolean;
	highlightPrice?: boolean;
	isRecommendedCarouselEnabled?: boolean;
	isVirtualTryOnSupported?: boolean;
	[key: string]: unknown;
};

export type ProductDetailsDto = {
	id: number; // domain
	reference?: string;
	type: "Product" | string;
	kind?: string;
	state?: string;
	brand?: ProductBrandInfoDto; // domain
	name?: string; // domain
	description?: string; // domain
	price?: number; // domain
	detail?: ProductDetailDto; // domain
	section?: number;
	sectionName?: string;
	familyId?: number;
	familyName?: string; // domain
	subfamilyId?: number;
	subfamilyName?: string; // domain
	extraInfo?: ProductDetailsExtraInfoDto;
	seo?: ProductSeoDto;
	firstVisibleDate?: string;
	attributes?: Array<Record<string, unknown>>;
	sizeGuide?: { enabled?: boolean };
	sizeSystem?: string;
	xmedia?: ProductMediaDto[];
	productTag?: Array<Record<string, unknown>>;
	availability?: string;
	availableColors?: ProductAvailableColorDto[]; // domain
	showAvailability?: boolean;
};

export type FilterDto = {
	id: number;
	title: string;
	value: string;
};

export type FilterValueDto = {
	catentries?: number[];
	code?: string;
	colors?: unknown[];
	colorHexCode?: string;
	id?: string;
	value?: string;
};

export type FilterGroupDto = {
	/**
	 * Filter group metadata (e.g., size, price, color)
	 */
	id?: string;
	title?: string;
	value?: FilterValueDto[];
	displayType?: string;
	opened?: boolean;
};

export type FilterSortingDto = {
	id?: string;
	code?: string;
	value?: string;
	catentries?: number[];
};

export type FiltersResponseDto = {
	filters?: FilterGroupDto[];
	sorting?: {
		id?: string;
		title?: string;
		value?: FilterSortingDto[];
	};
};