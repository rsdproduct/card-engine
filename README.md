# BOLD Daily Feed Card Engine

Interactive multi-tenant **Daily Feed** prototype for BOLD career portals (MyPerfectResume, ResumeNow, Bold.pro, Monster).

GitHub target: [rsdproduct/card-engine](https://github.com/rsdproduct/card-engine) (app at repo root).

## What's included

- Dual-pane experience: live consumer portal feed + God Mode engine controller
- Four card templates (Micro-Action, Quick-Stitch, Recruiter Ping, Digest)
- 10 domain-rich seed cards with portal / lifecycle / entry ranking boosts
- ICL live attribute badges, authoring drawer, telemetry + pruning inspector
- Client-side persistence via LocalStorage
- Framer Motion feed reorder / inject / prune animations

## Run locally

```bash
npm install
npm run dev -- --port 43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Stack

- Next.js App Router · TypeScript · Tailwind CSS
- Framer Motion · Lucide React · clsx · tailwind-merge

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

No auth or database — fully client-side for zero-config Vercel demos.
