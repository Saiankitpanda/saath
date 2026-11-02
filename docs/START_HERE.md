# Saath: one prompt, then learn by running it

This is an asset and instruction supplement, not a second application.

1. Extract the latest `Saath_Cursor_Source.zip` and open its `saath` folder in Cursor.
2. Copy this supplement's `public/assets` folder into that project's `public/assets`. The latest source already contains these same files, so keep the filenames.
3. Copy `CURSOR_START.md` and `CODE_WALKTHROUGH.md` into the project root.
4. Paste the contents of `CURSOR_START.md` into Cursor Agent once.
5. Follow the app's local URL and the agent's verified setup steps. Open `/studio` for artwork and sound review.

## Scope now

Minimal path (AnkitContribution): Sites enroll → arrive → pair / Two Chairs + browser voice call (`/api/calls`), or fictional AI + context / breathe. Vinext/D1 only. Circles, counselor marketplace, and Django password auth are out of the primary UX. See `MINIMAL_CRUD.md`.

## Assets

| File | Intended placement |
| --- | --- |
| public/assets/saath-garden-hero.png | Homepage illustration or quiet-mode visual |
| public/assets/saath-rehearsal.png | Rehearsal/Two Chairs introduction |
| public/assets/saath-circles.png | Circle discovery/empty state |
| public/favicon.svg | Browser icon |

Use URL paths `/assets/saath-garden-hero.png`, `/assets/saath-rehearsal.png`, and `/assets/saath-circles.png` in browser markup. Do not put `public` in the browser URL.

Keep body text on a solid reading surface. Fit images without stretching. Desktop may use side-by-side illustration/text; mobile should stack them. No image-generation service is needed at runtime.

## Credentials

AI.env.example documents names only. For local Worker development, private values belong in ignored `.dev.vars`; production values belong in the hosting environment. Do not paste keys into chat or frontend files. Browser calling uses `/api/calls` without LiveKit unless `LIVEKIT_*` are set.

## Working versus planned

Current: enroll, pairing requests, Two Chairs, browser voice call signaling, AI personalities (fictional), context CRUD, breathe / Quiet corner.

Deferred / optional: Circles, Django counselors / clinical / sanctuary (`DJANGO_BACKEND.md`), LiveKit rooms, payments, operational moderation.
