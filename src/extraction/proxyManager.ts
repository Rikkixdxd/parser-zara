export type ProxyInput = {
  ip: string;
  username?: string;
  password?: string;
  http_port?: number | string;
  socks5_port?: number | string;
};

export type ProxyProtocol = "http" | "socks5";

export type AcquireOptions = {
  protocol?: ProxyProtocol;
  stickyKey?: string;
  maxInFlightPerProxy?: number;
};

export type RequestResult =
  | { ok: true; status: number; ms: number }
  | { ok: false; status?: number; code?: string; ms: number };

type ProxyRuntime = {
  id: string;
  input: ProxyInput;

  inFlight: number;
  failStreak: number;
  successCount: number;

  lastUsedAt: number;
  coolDownUntil: number;
  deadUntil: number;
};

export type AcquiredProxy = {
  id: string;
  protocol: ProxyProtocol;
  url: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  stickyKey?: string;
};

export class ProxyManager {
  private proxies: ProxyRuntime[];
  private stickyMap: Map<string, string>;

  private readonly failStreakToDead = 5;
  private readonly deadMinMs = 30 * 60_000;
  private readonly deadMaxMs = 60 * 60_000;

  private readonly cd429MinMs = 2 * 60_000;
  private readonly cd429MaxMs = 10 * 60_000;

  private readonly cdTimeoutMinMs = 30_000;
  private readonly cdTimeoutMaxMs = 120_000;

  private readonly cd5xxMinMs = 10_000;
  private readonly cd5xxMaxMs = 60_000;

  private readonly cdOtherMinMs = 5_000;
  private readonly cdOtherMaxMs = 20_000;

  constructor(list: ProxyInput[]) {
    const now = Date.now();
    this.proxies = list.map((p, i) => ({
      id: `${p.ip}:${p.http_port ?? "nohttp"}:${p.socks5_port ?? "nosocks"}:${i}`,
      input: p,

      inFlight: 0,
      failStreak: 0,
      successCount: 0,

      lastUsedAt: 0,
      coolDownUntil: now,
      deadUntil: 0,
    }));

    this.stickyMap = new Map();
  }

  acquire(opts: AcquireOptions = {}): AcquiredProxy {
    const protocol: ProxyProtocol = opts.protocol ?? "http";
    const maxInFlight = opts.maxInFlightPerProxy ?? 1;
    const now = Date.now();

    if (opts.stickyKey) {
      const existingId = this.stickyMap.get(opts.stickyKey);
      if (existingId) {
        const p = this.proxies.find(x => x.id === existingId);
        if (p && this.isUsable(p, now, maxInFlight)) {
          return this.markAcquired(p, protocol, opts.stickyKey);
        }
        this.stickyMap.delete(opts.stickyKey);
      }
    }

    const candidates = this.proxies
      .filter(p => this.isUsable(p, now, maxInFlight))
      .sort((a, b) =>
        (a.inFlight - b.inFlight) ||
        (a.lastUsedAt - b.lastUsedAt) ||
        (a.failStreak - b.failStreak)
      );

    let chosen: ProxyRuntime | undefined = candidates[0];

    if (!chosen) {
      chosen = [...this.proxies].sort((a, b) => {
        const aWake = Math.max(a.coolDownUntil, a.deadUntil);
        const bWake = Math.max(b.coolDownUntil, b.deadUntil);
        return aWake - bWake;
      })[0];
    }

    const acquired = this.markAcquired(chosen, protocol, opts.stickyKey);

    if (opts.stickyKey) {
      this.stickyMap.set(opts.stickyKey, acquired.id);
    }

    return acquired;
  }

  release(proxyId: string, result: RequestResult) {
    const p = this.proxies.find(x => x.id === proxyId);
    if (!p) return;

    p.inFlight = Math.max(0, p.inFlight - 1);

    const now = Date.now();
    if (result.ok) {
      p.successCount += 1;
      p.failStreak = 0;
      return;
    }

    p.failStreak += 1;

    const status = result.status;
    const code = result.code;

    if (status === 407) {
      p.deadUntil = now + this.jitter(this.deadMinMs, this.deadMaxMs);
      return;
    }

    if (status === 429 || status === 403) {
      p.coolDownUntil = now + this.jitter(this.cd429MinMs, this.cd429MaxMs);
    } else if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "EAI_AGAIN") {
      p.coolDownUntil = now + this.jitter(this.cdTimeoutMinMs, this.cdTimeoutMaxMs);
    } else if (status && status >= 500) {
      p.coolDownUntil = now + this.jitter(this.cd5xxMinMs, this.cd5xxMaxMs);
    } else {
      p.coolDownUntil = now + this.jitter(this.cdOtherMinMs, this.cdOtherMaxMs);
    }

    if (p.failStreak >= this.failStreakToDead) {
      p.deadUntil = now + this.jitter(this.deadMinMs, this.deadMaxMs);
    }
  }

  clearSticky(stickyKey: string) {
    this.stickyMap.delete(stickyKey);
  }

  private isUsable(p: ProxyRuntime, now: number, maxInFlight: number) {
    if (p.deadUntil > now) return false;
    if (p.coolDownUntil > now) return false;
    if (p.inFlight >= maxInFlight) return false;
    return true;
  }

  private markAcquired(p: ProxyRuntime, protocol: ProxyProtocol, stickyKey?: string): AcquiredProxy {
    const now = Date.now();
    p.inFlight += 1;
    p.lastUsedAt = now;

    const port = this.getPort(p.input, protocol);
    const url = this.buildProxyUrl(p.input, protocol, port);

    return {
      id: p.id,
      protocol,
      url,
      host: p.input.ip,
      port,
      username: p.input.username,
      password: p.input.password,
      stickyKey,
    };
  }

  private getPort(input: ProxyInput, protocol: ProxyProtocol): number {
    const raw = protocol === "http" ? input.http_port : input.socks5_port;
    const port = typeof raw === "string" ? Number(raw) : raw;

    if (!port || !Number.isFinite(port)) {
      throw new Error(`Proxy port is missing for protocol=${protocol} ip=${input.ip}`);
    }
    return port;
  }

  private buildProxyUrl(input: ProxyInput, protocol: ProxyProtocol, port: number): string {
    const user = input.username ? encodeURIComponent(input.username) : "";
    const pass = input.password ? encodeURIComponent(input.password) : "";

    const auth = user ? `${user}:${pass}@` : "";
    return `${protocol}://${auth}${input.ip}:${port}`;
  }

  private jitter(minMs: number, maxMs: number) {
    return Math.floor(minMs + Math.random() * (maxMs - minMs));
  }
}
