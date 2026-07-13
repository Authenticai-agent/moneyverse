# MoneyVerse Engineering Operating System

This repository is the authoritative operating system for building, deploying, securing, testing, and operating MoneyVerse.

It is designed for Windsurf, Cursor, Claude Code, human engineers, security reviewers, product leaders, and future contractors.

## Required reading order

1. `AGENTS.md`
2. `windsurfrules.md`
3. `current-task.md`
4. `tasks.md`
5. `architecture.md`
6. `schema.md`
7. `decisions.md`
8. Relevant subsystem documents under `/docs`

## Default safety state

- LLM disabled
- Plaid disabled
- Payments disabled
- Public social disabled
- Child-to-stranger messaging prohibited
- Targeted child advertising prohibited
- RLS required on all tenant-owned data
- Supabase Auth is the authentication authority
- Netlify is the application hosting layer
