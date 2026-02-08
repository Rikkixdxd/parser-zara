import { Pool } from "pg";
import { pathToFileURL } from "url";
import { closeDbPool, dbPool } from "./client.js";

type SetupOptions = {
	pool?: Pool;
};

const setupStatements = [
	`
	create table if not exists brands (
		id bigserial primary key,
		name text not null unique
	)
	`,
	`
	create table if not exists categories (
		id integer primary key,
		name_en text not null
	)
	`,
	`
	alter table if exists categories
		drop constraint if exists categories_name_en_key
	`,
	`
	create table if not exists products (
		id bigserial primary key,
		sku text not null unique,
		slug text not null,
		title text,
		title_en text,
		title_ru text,
		declaration_title_en text,
		declaration_title_ru text,
		info text,
		info_ru text,
		original_price numeric,
		discount_price numeric,
		external_url text not null,
		available boolean not null,
		brand_id bigint references brands(id),
		category_id integer references categories(id)
	)
	`,
	`
	create table if not exists product_images (
		id bigserial primary key,
		product_id text not null references products(sku) on delete cascade,
		image_original text not null,
		sort_order integer not null,
		unique (product_id, image_original)
	)
	`,
	`
	create table if not exists product_colors (
		id bigserial primary key,
		product_id text not null references products(sku) on delete cascade,
		name text,
		unique (product_id, name)
	)
	`,
	`
	create table if not exists color_images (
		id bigserial primary key,
		color_id bigint not null references product_colors(id) on delete cascade,
		image_original text not null,
		sort_order integer not null,
		unique (color_id, image_original)
	)
	`,
	`
	create table if not exists color_sizes (
		id bigserial primary key,
		color_id bigint not null references product_colors(id) on delete cascade,
		name text not null,
		internal_size text,
		ru_size text,
		available boolean not null,
		price numeric,
		discount_price numeric,
		unique (color_id, name)
	)
	`,
	`
	create table if not exists product_details_dto (
		product_id bigint primary key,
		payload jsonb not null,
		last_seen_at timestamptz not null default now()
	)
	`,
];

export async function setupDatabase(options: SetupOptions | Pool = {}): Promise<void> {
	const pool = options instanceof Pool ? options : options.pool ?? dbPool;

	for (const statement of setupStatements) {
		await pool.query(statement);
	}
}

async function main() {
	await setupDatabase(dbPool);
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (entryUrl && import.meta.url === entryUrl) {
	try {
		await main();
	} finally {
		await closeDbPool();
	}
}
