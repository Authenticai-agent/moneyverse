# Performance Budget

Initial targets:

- Fast interactive experience on budget mobile devices
- Minimal client JavaScript
- No unnecessary hydration
- Paginated lists
- Bounded API payloads
- No N+1 query patterns
- Explicit database indexes for common authorization scopes
- Lazy loading for heavy simulators
- Optimized images and original SVG assets
- Graceful slow-network behavior
- No sensitive data in offline caches

Set measurable route-level budgets before production and enforce them in CI where practical.
