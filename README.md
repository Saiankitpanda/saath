# Saath

This is the one folder to open when you work on Saath. The other projects in `Project 1` stay out of the way.

```
Saath/
  README.md     ← you are here
  app/          ← run, edit, preview
  docs/         ← how it works, status, privacy notes
  archives/     ← original zip packs
```

## Daily path

```bash
cd app
pnpm install   # first time only
pnpm dev
```

Preview: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

| I want to… | Go here |
| --- | --- |
| Change the homepage or enrollment | `app/app/page.tsx`, `app/components/` |
| Change colors | `app/app/globals.css` |
| Change a rule (save, enroll, pair, encrypt) | `app/lib/application/` |
| Change storage or encryption | `app/lib/infrastructure/` |
| Add or inspect an API | `app/app/api/` |
| See the database tables | `app/db/schema.ts`, `app/drizzle/` |
| Learn the architecture | `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md` |
| Check what is live vs planned | `docs/IMPLEMENTATION_STATUS.md` |
| Find the original downloads | `archives/` |

## Checks

```bash
cd app
node --experimental-strip-types --test lib/server/validation.test.mjs lib/server/lifecycle.test.mjs lib/application/request-service.test.mjs
npx tsc --noEmit
```
