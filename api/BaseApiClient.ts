import { APIRequestContext, APIResponse } from '@playwright/test';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  params?: Record<string, string>;
  data?: unknown;
}

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

  // ── Typed helpers (throw on non-2xx) ───────────────────────────────────────

  protected async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    return this.requestTyped<T>('GET', url, { params });
  }

  protected async post<T>(url: string, body: unknown): Promise<T> {
    return this.requestTyped<T>('POST', url, { data: body });
  }

  protected async put<T>(url: string, body: unknown): Promise<T> {
    return this.requestTyped<T>('PUT', url, { data: body });
  }

  protected async patch<T>(url: string, body: unknown): Promise<T> {
    return this.requestTyped<T>('PATCH', url, { data: body });
  }

  protected async delete(url: string): Promise<void> {
    const res = await this.requestRaw('DELETE', url);
    if (!res.ok()) {
      throw new Error(`DELETE ${url} → ${res.status()}`);
    }
  }

  // ── Raw helpers (return the full APIResponse for negative-test assertions) ─

  protected rawGet(url: string, params?: Record<string, string>): Promise<APIResponse> {
    return this.requestRaw('GET', url, { params });
  }

  protected rawPost(url: string, body: unknown): Promise<APIResponse> {
    return this.requestRaw('POST', url, { data: body });
  }

  protected rawPut(url: string, body: unknown): Promise<APIResponse> {
    return this.requestRaw('PUT', url, { data: body });
  }

  protected rawPatch(url: string, body: unknown): Promise<APIResponse> {
    return this.requestRaw('PATCH', url, { data: body });
  }

  protected rawDelete(url: string): Promise<APIResponse> {
    return this.requestRaw('DELETE', url);
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async requestTyped<T>(method: HttpMethod, url: string, options: RequestOptions = {}): Promise<T> {
    const res = await this.requestRaw(method, url, options);
    return this.parseOk<T>(res);
  }

  private async requestRaw(method: HttpMethod, url: string, options: RequestOptions = {}): Promise<APIResponse> {
    const requestOptions = {
      params: options.params,
      data: options.data,
      headers: this.buildHeaders(),
    };

    switch (method) {
      case 'GET':
        return this.request.get(url, requestOptions);
      case 'POST':
        return this.request.post(url, requestOptions);
      case 'PUT':
        return this.request.put(url, requestOptions);
      case 'PATCH':
        return this.request.patch(url, requestOptions);
      case 'DELETE':
        return this.request.delete(url, requestOptions);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  private async parseOk<T>(res: APIResponse): Promise<T> {
    if (!res.ok()) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status()} — ${text}`);
    }
    return res.json() as Promise<T>;
  }
}
