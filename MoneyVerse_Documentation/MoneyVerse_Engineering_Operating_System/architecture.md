# System Architecture

MoneyVerse uses a modular monolith deployed on Netlify with Supabase as the managed backend.

```text
Browser
  ↓
Netlify CDN / Next.js
  ├─ UI
  ├─ Route handlers
  ├─ Server actions
  └─ Netlify Functions
        ↓
Supabase
  ├─ Auth
  ├─ PostgreSQL
  ├─ RLS
  ├─ Storage
  └─ Optional Edge Functions
```

## Domain boundaries

Identity, authorization, families, child profiles, schools, curriculum, progress, missions, ledger, rewards, privacy, moderation, audit, integrations, and administration.

## Forbidden dependencies

- UI cannot access secret credentials.
- Curriculum cannot mutate ledger directly.
- Plaid cannot write to simulated balances.
- LLM cannot award XP or change permissions.
- Teachers cannot access family financial data.
- Analytics cannot receive restricted child or financial data.
