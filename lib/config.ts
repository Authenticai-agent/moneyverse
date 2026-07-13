export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'missing-jwt-secret'
);
export const JWT_ISSUER = process.env.JWT_ISSUER ?? 'moneyverse';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'moneyverse-app';
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export const COOKIE_REFRESH = 'refresh_token';
export const COOKIE_CSRF = 'csrf_token';
