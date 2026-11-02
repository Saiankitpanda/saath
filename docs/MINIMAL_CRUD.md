# Minimal Saath — CRUD and SOLID (D1)

The AnkitContribution minimal shell uses one backend: Vinext APIs on Cloudflare D1.

## Entities (tables)

| Entity | Table | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- | --- |
| Profile | `profiles` | enroll PUT | GET `/api/profile` | PATCH role | — |
| Context | `contexts` | PUT upsert | GET | PUT | DELETE |
| Requests | `session_requests` | POST | GET list | PATCH accept/decline/cancel | — |
| Chairs | `chair_sessions` | POST | GET | PATCH act | leave closes |
| Calls | `call_sessions` | POST | GET | PATCH join/offer/answer/ice/hangup | hangup ends |

Migrations live in `app/drizzle/` (`0000` … `0004_call_sessions`).

## SOLID map

- **Ports:** `app/lib/application/ports.ts`
- **Services:** `profile-service`, `context-service`, `request-service`, `chair-service`, `call-service`
- **Adapters:** `app/lib/infrastructure/d1-*.ts`, `memory.ts` for tests
- **Composition:** `app/lib/server/compose.ts`
- **HTTP:** `app/app/api/*/route.ts` stays thin

Encryption at rest (AES-GCM) wraps context, request notes, and chair notes when `CONTEXT_ENCRYPTION_KEY` is set. That is not end-to-end encryption.

## Auth

Sites / ChatGPT identity via `/signin-with-chatgpt` and `GET /api/status`. Vinext `/api/auth/*` (old Django proxy) returns **410** and is not used by the minimal UI.

## Optional Django

`backend/` is a separate SQLite microservice. It is not required for the minimal UI or these D1 CRUD paths. There is no `djangoApi` client in the Vinext app.
