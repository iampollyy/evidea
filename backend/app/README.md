# EVIDEA backend

FastAPI REST API, prediction worker and admin CLI for EVIDEA. Python 3.12, SQLAlchemy 2.0 on
PostgreSQL 16. The database schema lives in [`backend/db`](../db/README.md); this package only
reads and writes it as the least-privilege role `evidea_app`.

API documentation: Swagger UI at `/api/v1/docs` and the guides in [`docs/api`](../../docs/api/README.md).

## What runs

| Process | Command | Purpose |
| :--- | :--- | :--- |
| API | `uvicorn evidea.main:create_app --factory` | REST API under `/api/v1`, Swagger UI at `/api/v1/docs` |
| Worker | `python -m evidea.worker` | Polls the database every 2 s, claims queued prediction runs, runs the active model, writes hypotheses and explanations |
| CLI | `python -m evidea.cli create-user ...` | Creates an active account with a password (the first admin in any environment) |

The API and the worker share one Docker image (`evidea-backend`). The worker uses `StubModel`, a
deterministic demo model; its scores are not medical predictions. Runs stuck for more than 10
minutes are marked failed.

## Project structure

```text
backend/app/
├── src/evidea/
│   ├── main.py            # create_app(): routers, middleware, error handlers, OpenAPI contract
│   ├── worker.py          # Worker entry point
│   ├── cli.py             # Admin CLI
│   ├── models.py          # Imports all ORM models so SQLAlchemy can resolve relationships
│   ├── core/              # Settings, DB engine, errors (Problem Details), logging, security, middleware, OpenAPI loader
│   ├── adapters/          # SMTP email, local file storage, image and upload checks
│   ├── domain/            # Pure domain rules shared by modules
│   └── modules/           # One folder per feature
│       ├── auth/          # Login, logout, invitations, session cookie, rate limit, /me
│       ├── doctors/       # Accounts (admin)
│       ├── patients/      # Patient records, photos, archive, anonymize
│       ├── cases/         # Cases, anamnesis, vital signs, lab reports
│       ├── catalog/       # Lab catalog (read-only reference data)
│       ├── predictions/   # Prediction runs, inference model, worker logic
│       ├── audit/         # Writes events to system_logs
│       └── health/        # Liveness and readiness probes
├── tests/
│   ├── unit/              # No database
│   ├── api/               # FastAPI TestClient, no database
│   └── integration/       # Real PostgreSQL
├── Dockerfile
├── pyproject.toml         # pytest, coverage, ruff and mypy settings
├── requirements.txt       # Runtime dependencies (pinned)
└── requirements-dev.txt   # Plus test and lint tools
```

A feature module usually has `router.py` (HTTP), `schemas.py` (Pydantic request and response
models, camelCase aliases), `service.py` (use cases), `repository.py` (queries) and `models.py`
(SQLAlchemy tables).

## Run locally

The easiest way is the full Docker stack from the [root README](../../README.md#run-everything-with-docker).
To run the API from source against that database, or against one you set up with
[`backend/db`](../db/README.md):

```bash
cd backend/app
python -m venv .venv
. .venv/bin/activate            # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pip install --no-deps -e .

uvicorn evidea.main:create_app --factory --reload --port 8000
python -m evidea.worker         # in a second terminal, to process prediction runs
```

Settings are read from the environment and from `.env` in the repository root. When running the
API from source, set `COOKIE_SECURE=false` so the browser keeps the session cookie over plain HTTP.
Swagger UI is then at <http://localhost:8000/api/v1/docs>.

Create the first account:

```bash
python -m evidea.cli create-user --email admin@clinic.example --name Dev --surname Admin --role admin
```

The CLI reads the password from `EVIDEA_USER_PASSWORD` or asks for it, checks it against the
password policy and stores an Argon2id hash.

## Configuration

Variable names are case-insensitive. The template with all values is [`.env.example`](../../.env.example).

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DATABASE_APP_URL` | required | Runtime connection as `evidea_app`. Never a superuser |
| `JWT_SECRET` | required | Signs session cookies. At least 32 characters |
| `ENVIRONMENT` | `development` | `development`, `test` or `production` |
| `JWT_TTL_HOURS` | `8` | Session lifetime, 1–24 |
| `COOKIE_SECURE` | `true` | Set `false` only for plain HTTP during local development |
| `ALLOWED_ORIGINS` | `["http://localhost:5173","http://localhost:8080"]` | Origins allowed to send state-changing requests (CSRF check) |
| `FRONTEND_URL` | `http://localhost:5173` | Base URL in invitation emails |
| `INVITATION_TTL_HOURS` | `72` | Invitation link lifetime |
| `SMTP_HOST`, `SMTP_PORT` | `localhost`, `1025` | Outgoing mail; defaults point to Mailpit |
| `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_STARTTLS` | empty, empty, `false` | SMTP authentication |
| `MAIL_FROM` | `EVIDEA <no-reply@evidea.local>` | Sender address |
| `STORAGE_DIR` | `storage` | Folder for patient photos and avatars |
| `MAX_UPLOAD_BYTES` | `2097152` | Upload size limit (2 MB) |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_WINDOW_SECONDS` | `5`, `60` | Failed-login rate limit per IP and email |
| `OPENAPI_SPEC_PATH` | `docs/reference/openapi.yaml` in the repo | Contract served by Swagger. `/app/openapi.yaml` in the Docker image |
| `LOG_LEVEL`, `LOG_JSON` | `INFO`, `true` | Structured logs to stdout |

## API documentation (Swagger)

`docs/reference/openapi.yaml` is the API contract. It has summaries, descriptions, examples and
every error response. On startup the API loads that file and serves it at
`/api/v1/openapi.json`; Swagger UI at `/api/v1/docs` displays it. The `servers` entry is replaced
with `/api/v1`, so **Try it out** sends requests to the server that served the page.

The Docker image gets the file through the `contract` build context in
[`docker-compose.yml`](../../docker-compose.yml). To build the image without Compose:

```bash
docker build --build-context contract=docs/reference -t evidea-backend backend/app
```

If the file cannot be found, the API logs `openapi_contract_missing` and serves the schema that
FastAPI generates from the code. That schema has no descriptions or error responses.

`tests/api/test_openapi.py` keeps the contract and the code in sync: every route in the app must
be in the contract with the same method and `operationId`, and the contract must not describe
routes that do not exist. Schemathesis then sends real requests in CI and checks the responses
against the contract (see [contract testing](../../docs/api/contract-testing.md)).

## Tests and checks

```bash
ruff check . && ruff format --check .
mypy
pytest                          # unit + api; integration tests are skipped without a database
pytest --cov                    # with the 80% coverage gate
```

Integration tests need a migrated database and two connection strings:

```bash
export TEST_DATABASE_URL=postgresql://postgres:<owner-password>@localhost:5433/evidea
export TEST_DATABASE_APP_URL=postgresql://evidea_app:<app-password>@localhost:5433/evidea
pytest tests/integration
```

They empty the application tables before each test. Use a disposable database. Do not run them
against the Compose database while the worker is running: the worker picks up runs the tests
create. CI sets `REQUIRE_INTEGRATION_TESTS=1`, which makes missing variables an error instead
of a skip.

## Security notes

- The API connects as `evidea_app`, which has least-privilege grants (see
  [roles and grants](../db/README.md#roles-and-login-users)).
- Passwords and invitation tokens are stored only as hashes (Argon2id and SHA-256).
- Prediction input snapshots exclude names, email addresses and phone numbers.
- Log events carry the request ID. Never add passwords, tokens or patient details to log fields.
- Never commit `.env` or real patient data.
