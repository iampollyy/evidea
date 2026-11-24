# EVIDEA

EVIDEA is a web-based clinical decision support system that helps clinicians generate ranked hypotheses for rare diseases. A clinician submits a case (free-text clinical notes, vital signs and lab values) and gets back a ranked list of likely conditions, each with an explanation of why it was suggested. Disease reference data comes from [Orphanet](https://www.orpha.net/).

> EVIDEA supports clinical reasoning; it does not replace a clinician's diagnosis.

## Status

| Part | State |
| :--- | :--- |
| Database (PostgreSQL schema, migrations, seeds, tests) | Implemented, checked in CI |
| Backend API (FastAPI, `backend/app`) | Implemented: REST API, prediction worker, admin CLI, tests with an 80% coverage gate |
| API documentation | OpenAPI contract served in Swagger UI, guides in `docs/api`, contract tests in CI |
| Frontend (React + TypeScript) | Sign-in and invitations, admin doctor directory, clinician patient dashboard and profile. Case submission and prediction views are not built yet |
| ML model | Trained offline; only model metadata is stored in the database (`model_versions`). Local runs use a deterministic demo stub |

## Repository structure

```text
evidea/
├── .github/workflows/      # CI: ci (backend, frontend, OpenAPI, Docker) and db-check
├── docker-compose.yml      # Full local stack
├── .env.example            # Template for local settings and secrets
├── CHANGELOG.md
├── docs/
│   ├── api/                # API guides: errors, pagination, versioning, contract testing
│   ├── reference/          # openapi.yaml (the API contract) and Redocly config
│   ├── architecture.md     # Component and prediction-workflow diagrams
│   ├── getting-started.md
│   └── integration-tutorial.md
├── backend/
│   ├── app/                # FastAPI API, prediction worker, CLI, tests
│   ├── db/                 # PostgreSQL schema managed by Alembic, seeds, SQL tests
│   └── docs/
│       ├── diagrams/       # ER diagram
│       └── docs_db/        # Data dictionary, DBMS choice, versioning rules
└── frontend/               # React 19 + TypeScript + Vite web app
```

## Tech stack

| Area | Tools |
| :--- | :--- |
| Frontend | React 19, TypeScript, Vite, React Router, SCSS, Vitest, Testing Library, Storybook, ESLint, Prettier |
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy 2.0, PyJWT, Argon2, structlog, pytest, ruff, mypy |
| Database | PostgreSQL 16, Alembic (SQL-file migrations with checksum checks) |
| API docs | OpenAPI 3.1, Swagger UI, Redocly CLI, Schemathesis |
| Tooling | Docker Compose, GitHub Actions, nginx, Mailpit |

## Run everything with Docker

Requires Docker with Compose v2.

```bash
cp .env.example .env                    # set POSTGRES_PASSWORD, EVIDEA_APP_PASSWORD, JWT_SECRET; COOKIE_SECURE=false for local HTTP
docker compose up -d --build --wait     # database, migrations, API, worker, web app, Mailpit
docker compose run --rm migrate demo-seed
docker compose exec api python -m evidea.cli create-user --email admin@clinic.example --name Dev --surname Admin --role admin
```

| Service | Address | Purpose |
| :--- | :--- | :--- |
| `web` | http://localhost:8080 | React app; nginx also proxies `/api` to the API |
| Swagger UI | http://localhost:8080/api/v1/docs | Interactive API documentation (the committed OpenAPI contract) |
| `mailpit` | http://localhost:8025 | Catches outgoing email (invitation links) |
| `postgres` | 127.0.0.1:5433 | PostgreSQL 16, bound to localhost only |
| `migrate` | one-shot | Applies migrations as the owner and creates `evidea_app` |
| `api` | internal :8000 | FastAPI, connects as the least-privilege role `evidea_app` |
| `worker` | internal | Processes prediction runs from the database queue |

`docker compose down` stops the stack; `docker compose down -v` also deletes the data volumes.
Do not run the backend test suite against this database while the worker is running: the worker picks up runs created by the tests.

A step-by-step walkthrough is in [Getting started](docs/getting-started.md); the [integration tutorial](docs/integration-tutorial.md) goes from sign-in to a prediction result with `curl`.

## Run parts without Docker

Prerequisites: Node.js 22.13+ or 24+ with npm, Python 3.12+, `psql`, and Docker or a local PostgreSQL 16.

```bash
cp .env.example .env        # fill in real values; .env is git-ignored
set -a && . ./.env && set +a
```

| Part | How to run | Details |
| :--- | :--- | :--- |
| Database | `alembic upgrade head` in `backend/db`, then the seeds | [backend/db/README.md](backend/db/README.md) |
| API and worker | `uvicorn evidea.main:create_app --factory` and `python -m evidea.worker` in `backend/app` | [backend/app/README.md](backend/app/README.md) |
| Frontend | `npm ci && npm run dev` in `frontend` (http://localhost:5173) | [frontend/README.md](frontend/README.md) |

## API documentation

- **Swagger UI**: `/api/v1/docs` on any running API (http://localhost:8080/api/v1/docs with Docker). Sign in with `POST /auth/login` in Swagger first; the session cookie is then sent with every request.
- **Contract**: [`docs/reference/openapi.yaml`](docs/reference/openapi.yaml). The API serves this file, so Swagger always matches the reviewed contract.
- **Guides**: [docs/api/README.md](docs/api/README.md) covers conventions, endpoints, errors, pagination, versioning and how to change the API.

## Continuous integration

- [`ci`](.github/workflows/ci.yml) runs on every push and pull request:
  - **backend**: migrations on PostgreSQL 16, ruff, mypy (strict), unit, API and integration tests with an 80% coverage gate, Schemathesis contract tests, `pip-audit`;
  - **frontend**: typecheck, ESLint, Prettier, Vitest, production build, `npm audit` of production dependencies;
  - **openapi**: Redocly lint of `docs/reference/openapi.yaml`;
  - **docker**: builds all images after backend and frontend pass.
- [`db-check`](.github/workflows/db-check.yml) runs when `backend/db/**` changes: applies all migrations, loads the dev seed and the demo seed (twice, to prove it is idempotent) and runs `tests/constraints_test.sql`.

## Documentation

| Document | Contents |
| :--- | :--- |
| [Getting started](docs/getting-started.md) | Start the full stack and configure a local development environment |
| [Integration tutorial](docs/integration-tutorial.md) | Create a patient and case, then request and poll a prediction |
| [Architecture](docs/architecture.md) | Component and prediction-workflow diagrams |
| [API documentation](docs/api/README.md) | Swagger UI, conventions, endpoint overview, changing the API |
| [API errors](docs/api/errors.md) | Problem Details format, status codes and client guidance |
| [API pagination](docs/api/pagination.md) | Page parameters and response metadata |
| [API versioning](docs/api/versioning.md) | URL version policy and compatibility rules |
| [Contract testing](docs/api/contract-testing.md) | Running Schemathesis and understanding its CI checks |
| [API reference](docs/reference/openapi.yaml) | OpenAPI contract; served in Swagger, linted and tested in CI |
| [Backend README](backend/app/README.md) | API, worker and CLI: structure, configuration, tests |
| [Database setup](backend/db/README.md) | Migrations, configuration, roles and grants |
| [Data dictionary](backend/docs/docs_db/data-dictionary.md) | Database architecture, domains, tables and columns |
| [Database versioning](backend/docs/docs_db/versioning.md) | Migration and schema versioning rules |
| [DBMS choice](backend/docs/docs_db/dbms-choice.md) | Why PostgreSQL |
| [ER diagram](backend/docs/diagrams/EHR_Polina_Trybialustava.jpg) | Database entity-relationship diagram |
| [Frontend README](frontend/README.md) | Frontend features, architecture, setup and testing |
| [Changelog](CHANGELOG.md) | Unreleased and published project changes |

## Data protection

- Never commit `.env` or real patient data. Seeds contain only fake data and must not be run in production.
- The application connects as a non-superuser role (`evidea_app`) with least-privilege grants; patient data is exposed to read-only roles only through a masked view.
- Passwords are stored only as bcrypt or Argon2 hashes; invitation tokens only as SHA-256 hashes.
- Prediction input snapshots exclude names, email addresses and phone numbers.
