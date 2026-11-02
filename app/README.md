# Saath app (Vinext / D1)

Minimal product shell: enroll → arrive → pair / Two Chairs + browser call, or fictional AI + context / breathe.

## Run

Requires Node 22.13+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the local URL (usually http://127.0.0.1:5173/). Local Sites mock sign-in: `/signin-with-chatgpt`.

```bash
node --experimental-strip-types --test \
  lib/server/validation.test.mjs \
  lib/server/lifecycle.test.mjs \
  lib/application/request-service.test.mjs \
  lib/application/chair-service.test.mjs \
  lib/application/call-service.test.mjs
npx tsc --noEmit
node scripts/smoke-minimal.mjs
```

## Layout

- `app/page.tsx`, `app/globals.css`, `components/`: frontend
- `app/api/`: thin Vinext HTTP routes (D1)
- `lib/application/`, `lib/infrastructure/`, `lib/server/compose.ts`: SOLID services
- `db/`, `drizzle/`: schema and migrations (`0004_call_sessions` included)
- `../docs/MINIMAL_CRUD.md`: keep-list and CRUD map
- `../docs/DJANGO_BACKEND.md`: optional Django microservice (not required)

## Boundaries

- AI personalities are fictional; they cannot accept live requests.
- Browser voice calling is for accepted live listeners via `/api/calls` after Join (mic stays off until then).
- Circles, counselor marketplace, clinical intake, and Django password auth are out of the primary UX.
- Context at-rest encryption when `CONTEXT_ENCRYPTION_KEY` is set is not E2E.
