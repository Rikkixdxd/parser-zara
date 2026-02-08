import fs from "fs";
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { ProxyManager, type AcquireOptions, type ProxyProtocol } from "./proxyManager.js";

export interface HttpClientOptions {
	baseURL?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
	userAgent?: string;
}

type RotatingClientOptions = HttpClientOptions & {
	proxyManager?: ProxyManager;
	protocol?: ProxyProtocol;
	stickyKey?: string | ((config: AxiosRequestConfig) => string | undefined);
	maxInFlightPerProxy?: number;
	maxRetries?: number;
	fallbackToDirect?: boolean;
};

type ProxyMeta = {
	id: string;
	startedAt: number;
};

const DEFAULT_TIMEOUT_MS = 15000;
let defaultProxyManager: ProxyManager | null = null;

function loadDefaultProxyManager(): ProxyManager {
	if (defaultProxyManager) {
		return defaultProxyManager;
	}

	const proxiesUrl = new URL("../../proxies.json", import.meta.url);
	const raw = fs.readFileSync(proxiesUrl, "utf-8");
	const list = JSON.parse(raw) as Array<{ ip: string }>;

	if (list.length === 0) {
		throw new Error("proxies.json is empty; add proxies or provide proxyManager explicitly.");
	}

	defaultProxyManager = new ProxyManager(list);
	return defaultProxyManager;
}

function resolveStickyKey(
	stickyKey: RotatingClientOptions["stickyKey"],
	config: AxiosRequestConfig
): string | undefined {
	if (!stickyKey) {
		return undefined;
	}

	return typeof stickyKey === "function" ? stickyKey(config) : stickyKey;
}

function createBaseClient(options: HttpClientOptions = {}): AxiosInstance {
	const headers: Record<string, string> = {
		...(options.userAgent ? { "User-Agent": options.userAgent } : {}),
		...options.headers
	};

	return axios.create({
		baseURL: options.baseURL,
		headers,
		proxy: false,
		timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS
	});
}

export function createRotatingHttpClient(options: RotatingClientOptions = {}): AxiosInstance {
	const proxyManager = options.proxyManager ?? loadDefaultProxyManager();
	const protocol = options.protocol ?? "http";
	const maxRetries = options.maxRetries ?? 2;
	const fallbackToDirect = options.fallbackToDirect ?? true;

	const client = createBaseClient({
		baseURL: options.baseURL,
		timeoutMs: options.timeoutMs,
		userAgent: options.userAgent,
		headers: options.headers
	});

	client.interceptors.request.use((config) => {
		const bypassProxy = (config as AxiosRequestConfig & { _proxyBypass?: boolean })._proxyBypass;
		if (bypassProxy) {
			config.proxy = false;
			return config;
		}

		const stickyKey = resolveStickyKey(options.stickyKey, config);
		const acquireOptions: AcquireOptions = {
			protocol,
			stickyKey,
			maxInFlightPerProxy: options.maxInFlightPerProxy
		};

		const proxy = proxyManager.acquire(acquireOptions);
		const meta: ProxyMeta = {
			id: proxy.id,
			startedAt: Date.now()
		};

		(config as AxiosRequestConfig & { _proxyMeta?: ProxyMeta })._proxyMeta = meta;
		config.proxy = {
			host: proxy.host,
			port: proxy.port,
			auth: proxy.username
				? { username: proxy.username, password: proxy.password ?? "" }
				: undefined
		};

		return config;
	});

	client.interceptors.response.use(
		(response) => {
			const meta = (response.config as AxiosRequestConfig & { _proxyMeta?: ProxyMeta })._proxyMeta;
			if (meta) {
				proxyManager.release(meta.id, {
					ok: true,
					status: response.status,
					ms: Date.now() - meta.startedAt
				});
			}
			return response;
		},
		(error) => {
			const config = error?.config as (AxiosRequestConfig & {
				_proxyMeta?: ProxyMeta;
				_proxyRetryCount?: number;
				_proxyBypass?: boolean;
			}) | undefined;
			const meta = config?._proxyMeta;

			if (meta) {
				proxyManager.release(meta.id, {
					ok: false,
					status: error?.response?.status,
					code: error?.code,
					ms: Date.now() - meta.startedAt
				});
			}

			if (!config) {
				return Promise.reject(error);
			}

			const retryCount = config._proxyRetryCount ?? 0;
			const status = error?.response?.status as number | undefined;
			const code = error?.code as string | undefined;
			const shouldRetry =
				retryCount < maxRetries &&
				(code === "ECONNABORTED" ||
					code === "ETIMEDOUT" ||
					code === "ECONNRESET" ||
					code === "EAI_AGAIN" ||
					status === 403 ||
					status === 429 ||
					(status !== undefined && status >= 500));

			if (!shouldRetry) {
				if (fallbackToDirect && !config._proxyBypass) {
					const directConfig = {
						...config,
						_proxyBypass: true,
						_proxyRetryCount: 0,
						_proxyMeta: undefined,
						proxy: undefined
					};
					return client.request(directConfig);
				}

				return Promise.reject(error);
			}

			const nextConfig = {
				...config,
				_proxyRetryCount: retryCount + 1,
				_proxyMeta: undefined,
				proxy: undefined
			};

			return client.request(nextConfig);
		}
	);

	return client;
}

const shouldUseProxy = (process.env.USE_PROXY ?? "true").toLowerCase() !== "false";

const httpClientOptions: HttpClientOptions = {
	baseURL: process.env.ZARA_API_BASE_URL,
	timeoutMs: Number(process.env.API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
	userAgent:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
};

export const httpClient = shouldUseProxy
	? createRotatingHttpClient(httpClientOptions)
	: createBaseClient(httpClientOptions);
