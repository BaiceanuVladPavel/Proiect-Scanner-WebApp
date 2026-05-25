# Inventory Scanner Starter

Starter-only project setup for an iPhone-first inventory scanner web app.

What is included:
- `frontend/` with Next.js, TypeScript, Tailwind CSS, shadcn/ui baseline, and requested frontend dependencies
- `backend/` with Django, Django REST Framework, PostgreSQL-ready settings, JWT auth setup, CORS, and app skeletons
- `docs/brief.md` with the original product brief
- root `.env` and `.gitignore`

What is intentionally not included yet:
- product models
- scanner workflow
- API features
- UI pages beyond a simple starter screen

## Structure

```text
/frontend
/backend
/docs
/.env
/.gitignore
/README.md
```

## Run locally

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
. venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

Health endpoint:

```text
http://127.0.0.1:8000/api/health/
```

## PostgreSQL

The backend is configured for PostgreSQL through the root `.env`.

Default values:

```text
POSTGRES_DB=inventory_scanner
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
```

Create that database/user locally before running migrations.

## iPhone testing

Read [docs/iphone-testing.md](/home/vlad/Public/proiect%20scaner%20webapp/docs/iphone-testing.md) for local network access, HTTPS camera testing with `ngrok`, startup commands, CORS/CSRF setup, and the iPhone Safari/PWA test flow.

## Application documentation

Read [docs/cum-functioneaza-aplicatia.md](/home/vlad/Public/proiect%20scaner%20webapp/docs/cum-functioneaza-aplicatia.md) for a full explanation of how the app works, including architecture, scanner flow, auth, products, stock movements, history, offline foundation, and local development notes.
