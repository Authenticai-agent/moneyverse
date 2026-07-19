# Project Status

- Current phase: Phase 3 — Game world / MoneyVerse Lite public tools
- Current task: Savings Goal Calculator rebuilt as the Goal Jar — playable simulator, 26-card tradeoff mechanic, printable signed plan. Implemented and verified; two checks await a real browser (keyboard-only, reduced-motion)
- Launch readiness: Accessibility audit, penetration test, load test, privacy review, and production checks completed
- Build: Passing
- Tests: Passing — 260 across 15 files, including 105 new Goal Jar engine tests
- Production: Ready for deployment
- LLM: Disabled
- Plaid: Disabled
- Payments: Disabled
- Public social features: Disabled
- Current blocker: None
- Known issue: `InteractiveHero`, `moneytree-world/World` and `moneytree/TreeScene` do not dispose their WebGL contexts on unmount. Browsers cap live contexts, so `/tools` logs `THREE.WebGLRenderer: Context Lost` and canvases can go blank after navigation. This is why the Goal Jar ships 2D — see `open-questions.md`. Fix before adding any new canvas.
- Next milestone: Deploy to production and verify runtime security headers / performance
