# Environment Variables

## Core

| Variable | Scope | Secret | Default | Purpose |
|---|---|---:|---|---|
| `APP_ENV` | Server | No | development | Environment |
| `APP_NAME` | Server/client-safe config | No | MoneyVerse | Product name |
| `DATABASE_URL` | Server | Yes | None | PostgreSQL connection |
| `JWT_ISSUER` | Server | No | None | Token issuer |
| `JWT_AUDIENCE` | Server | No | None | Token audience |
| `JWT_PRIVATE_KEY` | Server | Yes | None | Access-token signing |
| `JWT_PUBLIC_KEY` | Server | No | None | Verification |
| `SESSION_COOKIE_NAME` | Server | No | mv_session | Cookie name |

## Feature flags

- `LLM_ENABLED=false`
- `PLAID_ENABLED=false`
- `BANK_CONNECTIONS_ENABLED=false`
- `REAL_TRANSACTION_IMPORT_ENABLED=false`
- `PAYMENTS_ENABLED=false`
- `SOCIAL_FEATURES_ENABLED=false`
- `PUBLIC_LEADERBOARDS_ENABLED=false`
- `ANALYTICS_ENABLED=false`

## Rules

- Validate configuration at startup.
- Fail safely.
- Only explicitly public values may use a framework client prefix.
- Never expose server secrets through frontend environment variables.
- `.env.example` contains placeholders only.
