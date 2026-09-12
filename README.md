# BOLD Daily Feed Card Engine

Prototype for BOLD’s multi-tenant **Daily Feed Card Engine** — a portal-agnostic white-label feed that turns resume-builder dashboards into daily career destinations.

## Layout

```
daily-feed-engine/   # Next.js App Router application (src/)
```

## Run

```bash
cd daily-feed-engine
npm install
npm run dev -- --port 43127
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127)

## Capabilities

- Portal themes: MyPerfectResume, ResumeNow, Bold.pro, Monster
- Lifecycle + entry modifier ranking
- Templates A–D, 10 seed cards, Quick-Stitch modal
- God Mode toolbar, ICL badges, authoring + telemetry drawers
- LocalStorage persistence

No auth or database — fully client-side for zero-config Vercel demos.
