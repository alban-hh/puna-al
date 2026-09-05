const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawBaseUrl) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and point it at the backend (e.g. http://localhost:8080/api/v1).',
  );
}

export const env = {
  apiBaseUrl: rawBaseUrl.replace(/\/+$/, ''),
} as const;
