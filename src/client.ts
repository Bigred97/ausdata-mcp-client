/**
 * HTTP client for the ausdata.io REST API.
 *
 * Pure routing layer. NO parsing, NO data shaping, NO retry/backoff beyond
 * surfacing Retry-After. The MCP server's job is to pass tool calls through
 * to the API and return the response — anything more belongs server-side.
 */
import { ApiError, MissingApiKeyError } from "./lib/errors.js";
import type { Config } from "./config.js";

export interface RequestOptions {
  method?: "GET" | "POST";
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
}

export class AusdataClient {
  constructor(private readonly config: Config) {}

  get hasKey(): boolean {
    return !!this.config.apiKey;
  }

  async request<T = unknown>(opts: RequestOptions): Promise<T> {
    if (!this.config.apiKey) {
      throw new MissingApiKeyError();
    }
    // 0.3.3 (customer-fit audit, 2026-05-19): retry once on 5xx and on
    // network timeout. The hosted API's cold-deploy path can briefly
    // return 503-with-stale or 504; a single retry usually hits a now-
    // warm sister cache. LLM agents previously saw the "having trouble"
    // generic error on the first call and gave up. Total max latency =
    // 2 × timeoutMs (default 30s) so still well under the LLM agent's
    // typical 60s tool call budget.
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this._requestOnce<T>(opts);
      } catch (err) {
        lastErr = err;
        const shouldRetry =
          err instanceof ApiError && (err.status >= 500 || err.status === 504);
        if (!shouldRetry) throw err;
        // Brief pause before retry to let the upstream warm up. 800ms
        // is enough for circuit-breaker probes / cold-cache parses to
        // start serving the now-cached payload.
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    throw lastErr;
  }

  private async _requestOnce<T = unknown>(opts: RequestOptions): Promise<T> {
    const url = this.buildUrl(opts.path, opts.query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": `ausdata-mcp/${this.config.serverVersion}`,
          Accept: "application/json",
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const payload: unknown = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const retryHeader = res.headers.get("retry-after");
        const retryAfterSec = retryHeader ? Number.parseInt(retryHeader, 10) : undefined;
        throw new ApiError(`HTTP ${res.status}`, {
          status: res.status,
          body: payload,
          retryAfterSec: Number.isFinite(retryAfterSec) ? retryAfterSec : undefined,
        });
      }

      return payload as T;
    } catch (err) {
      if (err instanceof ApiError || err instanceof MissingApiKeyError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new ApiError(`Request timed out after ${this.config.timeoutMs}ms`, {
          status: 504,
          body: { error: "timeout" },
        });
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new ApiError(`Network error: ${message}`, {
        status: 0,
        body: { error: "network", detail: message },
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const base = this.config.apiUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${cleanPath}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          url.searchParams.set(k, v.join(","));
        } else if (typeof v === "object") {
          url.searchParams.set(k, JSON.stringify(v));
        } else {
          url.searchParams.set(k, String(v));
        }
      }
    }
    return url.toString();
  }
}
