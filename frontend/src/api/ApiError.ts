import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  static fromBody(status: number, body: unknown): ApiError {
    if (isApiErrorBody(body)) {
      return new ApiError(status, body.error, body.message);
    }
    return new ApiError(status, 'unknown_error', defaultMessageFor(status));
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isValidation(): boolean {
    return this.code === 'validation_error' || this.code === 'bad_request';
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    'message' in value &&
    typeof (value as ApiErrorBody).error === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  );
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'Kërkesa nuk është e vlefshme.';
    case 401:
      return 'Sesioni ka skaduar. Ju lutemi hyni përsëri.';
    case 403:
      return 'Nuk keni leje për këtë veprim.';
    case 404:
      return 'Burimi nuk u gjet.';
    case 409:
      return 'Ekziston tashmë një rekord në konflikt.';
    case 500:
      return 'Ndodhi një gabim i papritur në server. Provoni përsëri.';
    default:
      return 'Diçka shkoi keq. Provoni përsëri.';
  }
}
