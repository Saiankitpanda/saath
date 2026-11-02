# Saath (AnkitContribution — minimal)

One calm path: enroll → express → pair with a person (Two Chairs + call) or an AI personality if none.

```
Saath/
  app/       ← Vinext / D1 product (use this)
  backend/   ← optional Django microservice (not required for minimal UI)
  docs/      ← architecture, CRUD map, Django notes
```

## Run the minimal app

```bash
cd app
pnpm install   # first time
pnpm dev
```

Preview: http://127.0.0.1:5173/

## Smoke test

With `pnpm dev` running:

```bash
cd app
node scripts/smoke-minimal.mjs
```

Unit tests (SOLID services):

```bash
cd app
node --experimental-strip-types --test \
  lib/server/validation.test.mjs \
  lib/server/lifecycle.test.mjs \
  lib/application/request-service.test.mjs \
  lib/application/chair-service.test.mjs \
  lib/application/call-service.test.mjs
npx tsc --noEmit
```

## What the minimal shell keeps

- Enroll (ChatGPT / local Sites sign-in — no second password)
- Your visit (Arrive)
- Pair / accept requests
- Two Chairs + browser voice call
- AI personalities (fictional fallback)
- My Space context CRUD
- Need a moment / Quiet corner

Django counselors, clinical intake, and sanctuary feed are **not** in the primary nav. See `docs/DJANGO_BACKEND.md` if you start that service later.
