# EVIDEA

EVIDEA is a web-based clinical decision support system that helps clinicians generate ranked hypotheses for rare diseases. A clinician submits a case (clinical notes, vital signs and lab values) and gets back a ranked list of likely conditions, each with an explanation of why it was suggested. Disease reference data comes from [Orphanet](https://www.orpha.net/).

> EVIDEA supports clinical reasoning; it does not replace a clinician's diagnosis.

> **Work in progress.** The project is still under active development, so this README is intentionally short. Missing details will be added here step by step.

## Where to find what

| Part              | Code                               | Documentation                                                                                                                                                     |
| :---------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend          | [frontend/](frontend/)             | [frontend/README.md](frontend/README.md)                                                                                                                          |
| Backend           | [backend/app/](backend/app/)       | [backend/app/README.md](backend/app/README.md)                                                                                                                    |
| Database          | [backend/db/](backend/db/)         | [backend/db/README.md](backend/db/README.md), [backend/docs/](backend/docs/)                                                                                      |
| API documentation | [docs/reference/](docs/reference/) | [docs/api/README.md](docs/api/README.md), OpenAPI contract [openapi.yaml](docs/reference/openapi.yaml), Swagger UI at `/api/v1/docs` on a running API (see below) |

## Tech stack

| Area     | Tools                                                                            |
| :------- | :------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Redux Toolkit, React Router, SCSS, Vitest, Storybook |
| Backend  | Python 3.12, FastAPI, Pydantic, SQLAlchemy 2.0, pytest                           |
| Database | PostgreSQL 16, Alembic                                                           |
| Tooling  | Docker Compose, GitHub Actions, nginx, Mailpit                                   |

## Getting started

Copy the settings template and fill in the values (`POSTGRES_PASSWORD`, `EVIDEA_APP_PASSWORD`, `JWT_SECRET`; set `COOKIE_SECURE=false` for local HTTP):

```bash
cp .env.example .env
```

### Run everything with Docker

```bash
docker compose up -d --build --wait
docker compose run --rm migrate demo-seed
docker compose exec api python -m evidea.cli create-user --email admin@clinic.example --name Dev --surname Admin --role admin
```

The app opens at http://localhost:8080, Swagger UI at http://localhost:8080/api/v1/docs, Mailpit at http://localhost:8025.
`docker compose down` stops the stack.

### Database

```bash
docker compose up -d postgres
docker compose run --rm migrate
```

PostgreSQL is then available at `127.0.0.1:5433`. To set it up without Docker, see [backend/db/README.md](backend/db/README.md).

### Backend

```bash
cd backend/app
python -m venv .venv
. .venv/bin/activate            # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pip install --no-deps -e .

uvicorn evidea.main:create_app --factory --reload --port 8000
python -m evidea.worker         # in a second terminal
```

Swagger UI: http://localhost:8000/api/v1/docs

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

The app opens at http://localhost:5173.
!Important note: frontend is still under development, therefor more unit tests will be added, as well as E2E, more components and a11y AA lvl requirements will be met
## Documentation

More details are in [docs/](docs/): start with [Getting started](docs/getting-started.md).
