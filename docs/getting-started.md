# Getting started

This guide starts EVIDEA locally with Docker Compose. Use synthetic data only; never use real
patient information in a development environment.

## Prerequisites

- Docker with Compose v2
- Git
- Node.js 20.19+ or 22.12+ and npm (only if running the frontend outside Docker)
- Python 3.12+ (only for local backend commands and tests)

## Start the full stack

From the repository root, copy the environment template and set the required local secrets:

```bash
cp .env.example .env
```

In PowerShell, use `Copy-Item .env.example .env` for the copy step.

Set `POSTGRES_PASSWORD`, `EVIDEA_APP_PASSWORD`, and `JWT_SECRET` in `.env`. For local HTTP
development only, set `COOKIE_SECURE=false`; restore `COOKIE_SECURE=true` when serving over HTTPS.
Do not use the example passwords or a development secret in a shared or production environment.

Build and start PostgreSQL, migrations, API, worker, frontend, and Mailpit:

```bash
docker compose up -d --build --wait
docker compose run --rm migrate demo-seed
```

Create a local administrator. The CLI prompts for a password unless `EVIDEA_USER_PASSWORD` is set:

```bash
docker compose exec api python -m evidea.cli create-user \
  --email admin@clinic.example --name Dev --surname Admin --role admin
```

| Service | Address | Purpose |
| --- | --- | --- |
| Web application and API proxy | <http://localhost:8080> | React app; `/api` is proxied to FastAPI |
| Swagger UI | <http://localhost:8080/api/v1/docs> | Interactive API documentation |
| Mailpit | <http://localhost:8025> | Local inbox for invitation messages |
| PostgreSQL | `127.0.0.1:5433` | Local development database |

Use the [integration tutorial](integration-tutorial.md) to create a patient, submit a case, and
request a demo prediction.

Stop the services with `docker compose down`. This preserves named volumes. To remove the local
database and uploaded files as well, use `docker compose down -v`.

## Run the frontend separately

Keep the API stack running, then start Vite:

```bash
cd frontend
npm ci
npm run dev
```

The development server is available at <http://localhost:5173> and proxies API requests to the
Compose web/nginx service:

```bash
VITE_API_PROXY_TARGET=http://localhost:8080 npm run dev
```

In PowerShell, set the variable before starting Vite:

```powershell
$env:VITE_API_PROXY_TARGET = "http://localhost:8080"
npm run dev
```

See [frontend/README.md](../frontend/README.md) for available scripts and conventions.

## Run backend checks

Database migration setup is in [backend/db/README.md](../backend/db/README.md). The
[CI workflow](../.github/workflows/ci.yml) provisions PostgreSQL, installs backend development
dependencies, applies migrations, runs unit and integration tests, and checks the OpenAPI contract.

## Troubleshooting

- Check `docker compose ps` and `docker compose logs api migrate postgres` if a service is unhealthy.
- The migration service must complete before the API can start.
- Mailpit is local-only; invitation email links are visible in its web UI.
- Do not run integration tests against the Compose database while the worker is running; the worker
  may process prediction runs created by tests.
