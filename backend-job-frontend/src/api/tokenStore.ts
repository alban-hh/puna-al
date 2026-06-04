import type { Tokens } from './types';

const REFRESH_TOKEN_KEY = 'punaal.refresh_token';

let accessToken: string | null = null;

type SessionListener = () => void;
const sessionClearedListeners = new Set<SessionListener>();

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      /* storage unavailable (private mode); access token still works in-memory */
    }
  },

  setTokens(tokens: Tokens): void {
    accessToken = tokens.access_token;
    this.setRefreshToken(tokens.refresh_token);
  },

  hasRefreshToken(): boolean {
    return Boolean(this.getRefreshToken());
  },

  clear(): void {
    accessToken = null;
    this.setRefreshToken(null);
  },

  /** Clears tokens and notifies listeners (used when the session can no longer be recovered). */
  forceSignOut(): void {
    this.clear();
    sessionClearedListeners.forEach((listener) => listener());
  },

  onSessionCleared(listener: SessionListener): () => void {
    sessionClearedListeners.add(listener);
    return () => sessionClearedListeners.delete(listener);
  },
};
