import { APIRequestContext, APIResponse } from '@playwright/test';

export class BaseApiClient {
  protected readonly request: APIRequestContext;
  private token: string | null = null;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  setAuthToken(token: string): void {
    this.token = token;
  }

  clearAuthToken(): void {
    this.token = null;
  }

  protected buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  // ── Typed helpers (throw on non-2xx) ───────────────────────────────────────

  protected async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const res = await this.request.get(url, { params, headers: this.buildHeaders() });
    return this.parseOk<T>(res);
  }

  protected async post<T>(url: string, body: unknown): Promise<T> {
    const res = await this.request.post(url, { data: body, headers: this.buildHeaders() });
    return this.parseOk<T>(res);
  }

  protected async put<T>(url: string, body: unknown): Promise<T> {
    const res = await this.request.put(url, { data: body, headers: this.buildHeaders() });
    return this.parseOk<T>(res);
  }

  protected async patch<T>(url: string, body: unknown): Promise<T> {
    const res = await this.request.patch(url, { data: body, headers: this.buildHeaders() });
    return this.parseOk<T>(res);
  }

  protected async delete(url: string): Promise<void> {
    const res = await this.request.delete(url, { headers: this.buildHeaders() });
    if (!res.ok()) throw new Error(`DELETE ${url} → ${res.status()}`);
  }

  // ── Raw helpers (return the full APIResponse for negative-test assertions) ─

  protected rawGet(url: string, params?: Record<string, string>): Promise<APIResponse> {
    return this.request.get(url, { params, headers: this.buildHeaders() });
  }

  protected rawPost(url: string, body: unknown): Promise<APIResponse> {
    return this.request.post(url, { data: body, headers: this.buildHeaders() });
  }

  protected rawPut(url: string, body: unknown): Promise<APIResponse> {
    return this.request.put(url, { data: body, headers: this.buildHeaders() });
  }

  protected rawPatch(url: string, body: unknown): Promise<APIResponse> {
    return this.request.patch(url, { data: body, headers: this.buildHeaders() });
  }

  protected rawDelete(url: string): Promise<APIResponse> {
    return this.request.delete(url, { headers: this.buildHeaders() });
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async parseOk<T>(res: APIResponse): Promise<T> {
    if (!res.ok()) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status()} — ${text}`);
    }
    return res.json() as Promise<T>;
  }
}
