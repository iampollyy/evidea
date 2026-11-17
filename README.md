# EVIDEA

EVIDEA is a web-based clinical decision support system that helps clinicians generate ranked hypotheses for rare diseases. A clinician submits a case (free-text clinical notes, vital signs and lab values) and gets back a ranked list of likely conditions, each with an explanation of why it was suggested. Disease reference data comes from [Orphanet](https://www.orpha.net/).

> EVIDEA supports clinical reasoning; it does not replace a clinician's diagnosis.

## Status

| Part                                                   | State                                                                            |
| :----------------------------------------------------- | :------------------------------------------------------------------------------- |
| Database (PostgreSQL schema, migrations, seeds, tests) | Implemented, checked in CI                                                       |
| Frontend (React + TypeScript)                          | Project setup, tooling and design tokens; screens in progress                    |
| Backend API                                            | Not started                                                                      |
| ML model                                               | Trained offline; only model metadata is stored in the database (`ModelVersions`) |

## Repository structure

```text
evidea/
├── .github/workflows/      # CI (db-check: migrations, seed and constraint tests)
├── .env.example            # Template for local connection settings
├── backend/
│   ├── db/                 # PostgreSQL schema managed by Alembic, seeds, SQL tests
│   └── docs/
│       ├── diagrams/       # ER diagram
│       └── docs_db/        # Data dictionary, DBMS choice, versioning rules
└── frontend/               # React 19 + TypeScript + Vite web app
```

## Tech stack

| Area     | Tools                                                                          |
| :------- | :----------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, SCSS, ESLint, Prettier                             |
| Database | PostgreSQL 16, Alembic (SQL-file migrations with checksum checks)              |
| Tooling  | Python 3.9+ for migrations and seed scripts, Docker (optional), GitHub Actions |

## Quick start

### Prerequisites

- Node.js 20.19+ or 22.12+ and npm
- Python 3.9+ and `psql`
- Docker (or a local PostgreSQL 16)

### 1. Configure the environment

```bash
cp .env.example .env        # fill in real values; .env is git-ignored
set -a && . ./.env && set +a
```

### 2. Database

```bash
docker run --name evidea-db -e POSTGRES_PASSWORD=evidea -e POSTGRES_DB=evidea -p 5433:5432 -d postgres:16

cd backend/db
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f seeds/dev_seed.sql
```

Roles, the application login user, the Orphanet import and the test suite are described in [backend/db/README.md](backend/db/README.md).

### 3. Frontend

```bash
cd frontend
npm ci
npm run dev                 # http://localhost:5173
```

Scripts, project structure and code style are described in [frontend/README.md](frontend/README.md).

## Continuous integration

[`db-check`](.github/workflows/db-check.yml) runs on every push and pull request that touches `backend/db/**`. It starts PostgreSQL 16, applies all migrations, loads the dev seed and runs `tests/constraints_test.sql`.

## Documentation

| Document                                                         | Contents                                               |
| :--------------------------------------------------------------- | :----------------------------------------------------- |
| [backend/db/README.md](backend/db/README.md)                     | Running migrations, configuration, roles and grants    |
| [data-dictionary.md](backend/docs/docs_db/data-dictionary.md)    | Architecture overview, domains, every table and column |
| [dbms-choice.md](backend/docs/docs_db/dbms-choice.md)            | Why PostgreSQL                                         |
| [versioning.md](backend/docs/docs_db/versioning.md)              | Migration and schema versioning rules                  |
| [ER diagram](backend/docs/diagrams/EHR_Polina_Trybialustava.jpg) | Entity-relationship diagram                            |
| [frontend/README.md](frontend/README.md)                         | Frontend setup and conventions                         |

## Data protection

- Never commit `.env` or real patient data. Seeds contain only fake data and must not be run in production.
- The application connects as a non-superuser role (`evidea_app`) with least-privilege grants; patient data is exposed to read-only roles only through a masked view.
- Passwords are stored only as bcrypt or Argon2 hashes.
