# BOLD Daily Feed Card Engine V2

Interactive multi-tenant **Daily Feed** prototype for BOLD career portals (MyPerfectResume, ResumeNow, Bold.pro, Monster).

Repo: [rsdproduct/card-engine](https://github.com/rsdproduct/card-engine)

## What's included (V2)

- **Dual-view switcher:** Candidate Feed View ↔ PM Authoring Studio
- **PM Authoring Studio:** campaign metadata, A/B headlines, template picker (A–D), portal/audience targeting, live side-by-side preview, publish to engine
- **Uniform card container:** brand header, 160px media, body, type-specific interactive area, full-width CTA
- **Type A multi-step:** Q1 → inline Q2 micro-profiling (Urgency Calibrator)
- **Seed aligned to business reality:** Resume Tailoring & Completeness, Recruiter Radar (MCB), Salary Pulse, Urgency Calibrator, Weekly Footprint Digest (Phoenix ATS Diagnostic removed)
- **Persistence:** LocalStorage + `/api/campaigns` fallback; optional Supabase when `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- **Telemetry:** `campaign_published`, `card_impression`, `multi_step_answer_logged`, `icl_attribute_updated`, plus pruning with **Pause Low-Performing Variant**
- God Mode portal/lifecycle/entry controls, ICL badges, Framer Motion transitions
- **"WTF is all of this?" guided explainer:** desktop spotlight tour + mobile bottom sheet (6 steps), glossary tab, keyboard nav (Esc / ← →)
- **Share Feedback:** floating trigger (post-auth) opens an open-format modal → Google Sheet webhook + LocalStorage collection log
- **Prototype passkey gate:** unlocks the app for internal demos; Lock Session returns to the gate

## Run locally

```bash
npm install
npm run dev -- --port 43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

### Optional Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Without these, the app runs fully on LocalStorage + the in-memory API route.

## Stack

- Next.js App Router · TypeScript · Tailwind CSS
- Framer Motion · Lucide React · clsx · tailwind-merge
- Optional: `@supabase/supabase-js`

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
