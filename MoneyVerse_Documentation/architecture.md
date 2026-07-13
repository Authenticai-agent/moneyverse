# MoneyVerse Architecture

## Architectural style

Use a modular monolith for the initial product. Preserve strict domain boundaries so modules can be extracted later only when operational evidence justifies it.

## Preferred stack

- Next.js App Router
- TypeScript strict mode
- PostgreSQL
- Prisma or Drizzle
- Zod runtime validation
- Accessible UI primitives
- Tailwind CSS with centralized tokens
- Managed job runner only when asynchronous work is needed
- S3-compatible private storage only when uploads are introduced

## Dependency direction

```text
UI
 ↓
API / Route Handlers
 ↓
Application Services
 ↓
Domain Policies and Entities
 ↓
Repository Interfaces
 ↓
Infrastructure Adapters
```

Business rules must not live in route handlers, React components, ORM hooks, or third-party adapters.

## Domains

- Identity and authentication
- Authorization
- Families and memberships
- Child profiles
- Consent and privacy
- Curriculum and content
- Assessments and progress
- Missions and chores
- Virtual ledger
- Budgeting and goals
- Rewards and world state
- Schools and classrooms
- Moderation and abuse reporting
- Notifications
- Audit and security events
- Integrations
- Administration

## Forbidden dependencies

- UI may not query the database.
- Curriculum may not update balances directly.
- LLM adapters may not award rewards, alter permissions, or publish content.
- Plaid data may not write directly to the simulated ledger.
- Analytics may not receive restricted child or financial data.
- Teacher modules may not access family financial data.
- Child-facing modules may not initialize adult financial integrations.
- Support tools may not bypass authorization policies.

## Trust boundaries

1. Browser to application server
2. Application server to database
3. Application server to job runner
4. Application server to external providers
5. Admin console to privileged services
6. Future LLM boundary
7. Future Plaid boundary

All data crossing a boundary requires validation, authorization, minimization, and safe logging.

## Deployment

Use separate development, staging, and production environments. Production database and storage must not be publicly accessible. All environments use separate credentials and secrets.

## Feature isolation

High-risk integrations use backend-enforced feature flags. A disabled feature has no active route, UI, scheduled job, SDK initialization, secret requirement, or network call.
