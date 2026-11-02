# Django microservice (optional)

The AnkitContribution **minimal** product does not require Django. Primary UX runs on Vinext / D1 only (`docs/MINIMAL_CRUD.md`).

Saath keeps the Vinext / Cloudflare / D1 app APIs for enrollment, Two Chairs, encrypted notes, and browser calling.

The Django service at `backend/` is optional. It can add counselor directory, triage replies, sanctuary feed, circles/pods, and clinical intake scoring against its own SQLite database when you choose to run it. Those features are **not** wired into the minimal Vinext UI.

## Run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python seed_data.py
python manage.py runserver 127.0.0.1:8000
```

Then in another terminal:

```bash
cd app
pnpm dev
```

There is **no** `djangoApi` client in `app/lib/client/api.ts`. The Vinext app talks only to its own `/api/*` routes on D1. Optional Django endpoints under `http://127.0.0.1:8000/api` are for separate experimentation; Vinext `/api/auth/*` returns `410` and points you to Sites sign-in + `PUT /api/profile`.

## Honesty notes

- Sites / ChatGPT mock auth remains the primary local identity for Vinext APIs.
- Django email/password is optional against the microservice only and is not the minimal product auth path.
- Django `/api/sessions/start/` labels are not a verified end-to-end encrypted room. Live voice between two enrolled people uses Saath `/api/calls` (browser WebRTC; LiveKit only when `LIVEKIT_*` are set).
- Private context on Vinext D1 stays AES-GCM at-rest when `CONTEXT_ENCRYPTION_KEY` is set. That is not E2E.
