import { env } from '@/lib/env';
import { ApiError } from './ApiError';
import { tokenStore } from './tokenStore';
import type { Tokens } from './types';

type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

interface RequestOptions {
  body?: unknown;
  params?: QueryParams;
  signal?: AbortSignal;
  /** Attach the Authorization header when an access token is available. Default true. */
  auth?: boolean;
  /** Skip the transparent refresh-and-retry on 401. Used by the auth endpoints themselves. */
  skipAuthRefresh?: boolean;
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${env.apiBaseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function execute(method: string, path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' });

  const hasBody = options.body !== undefined;
  if (hasBody) headers.set('Content-Type', 'application/json');

  if (options.auth !== false) {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    return await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(
      0,
      'network_error',
      'Nuk u arrit lidhja me serverin. Kontrolloni internetin dhe provoni përsëri.',
    );
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performRefresh(): Promise<boolean> {
  const refresh_token = tokenStore.getRefreshToken();
  if (!refresh_token) return false;

  const response = await execute('POST', '/auth/refresh', {
    body: { refresh_token },
    auth: false,
    skipAuthRefresh: true,
  });

  if (!response.ok) {
    tokenStore.forceSignOut();
    return false;
  }

  const tokens = (await response.json()) as Tokens;
  tokenStore.setTokens(tokens);
  return true;
}

async function parseError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body = await response.json();
      return ApiError.fromBody(response.status, body);
    } catch {
      return ApiError.fromBody(response.status, null);
    }
  }
  const text = await response.text().catch(() => '');
  return new ApiError(
    response.status,
    response.status === 400 ? 'bad_request' : 'unknown_error',
    text.trim() || 'Diçka shkoi keq. Provoni përsëri.',
  );
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  let response = await execute(method, path, options);

  if (
    response.status === 401 &&
    !options.skipAuthRefresh &&
    options.auth !== false &&
    tokenStore.hasRefreshToken()
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await execute(method, path, options);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return parseBody<T>(response);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
