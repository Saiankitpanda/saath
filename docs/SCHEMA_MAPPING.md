# Schema mapping (D1 — minimal keep set)

Source of truth for the AnkitContribution minimal path: `docs/MINIMAL_CRUD.md`.

## Current tables

| Table | Used for | Notes |
| --- | --- | --- |
| `contexts` | Owner-private life context and share mode. Encrypted at rest when `CONTEXT_ENCRYPTION_KEY` is set. | Not E2E. |
| `session_requests` | Pairing requests: pending / accept / decline / cancel. | Sample AI profiles cannot accept. |
| `profiles` | Sites identity enrollment, active role, listener pairing code. | Not a counselor marketplace. |
| `chair_sessions` | Two Chairs sessions (paired / AI / same-device). | Live path for sitting together. |
| `call_sessions` | Browser WebRTC call signaling (`/api/calls`). | Mic after Join; LiveKit optional. |
| `reports` | Owner-created moderation reports. | No staff queue yet. |
| `ai_usage` | Per-user hourly rehearsal attempt counter. | |

Migrations: `app/drizzle/0000` … `0004_call_sessions`.

## Deferred (not primary UX)

Circles / membership, counselor directory, clinical intake, sanctuary feed, payments, Django-backed auth. Optional Django schema lives under `backend/` and is separate from this D1 map.

Browser fixtures still hold activities, mood marks, and reflections locally until you choose to promote them.
