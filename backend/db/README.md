# EVIDEA database

PostgreSQL 16 schema, managed by Alembic. Full rules and decisions: [versioning.md](../docs/docs_db/versioning.md), field reference: [data-dictionary.md](../docs/docs_db/data-dictionary.md).

## What is where

| Path | Purpose |
| :-- | :-- |
| `migrations/versions/` | Alembic revisions, one per SQL file |
| `migrations/sql/` | Schema SQL executed by the revisions |
| `seeds/dev_seed.sql` | Fake dev/test data (never run in production) |
| `tests/constraints_test.sql` | Negative tests for constraints, triggers and procedures |
| `alembic.ini`, `migrations/env.py` | Alembic config and checksum check |

## Quick check (for reviewers)

You need Docker, or a local PostgreSQL 16, and Python 3.9+.

```bash
docker run --name evidea-db -e POSTGRES_PASSWORD=evidea -e POSTGRES_DB=evidea -p 5433:5432 -d postgres:16

cd backend/db
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:evidea@localhost:5433/evidea"

alembic upgrade head
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f seeds/dev_seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/constraints_test.sql
```

Without Docker, use your local PostgreSQL: create an empty database and set `DATABASE_URL` to it. `psql` must be installed.

## Applying migrations (any environment)

1. `cd backend/db`, install `requirements.txt` into a virtualenv.
2. Set `DATABASE_URL` from `.env` (see [Configuration](#configuration-env)); format `postgresql://user:password@host:port/dbname`.
3. Run `alembic upgrade head`. Already applied revisions are skipped.
4. Check the state with `alembic current` (should show `0014 (head)`).

Rules:
- Never edit an applied SQL file. `migrations/env.py` compares SHA-256 checksums and stops on a mismatch. Add a new revision instead.
- Downgrade is not supported (forward-only).
- Do not run `seeds/` in production.
- Every new table must get grants to `app_read` or `app_write` in the same migration. The test `every table is granted to an app role` fails otherwise.

## Configuration (.env)

Connection settings live in `.env` in the repository root. Copy the template and fill in real values:

```bash
cp .env.example .env
```

Variables: `DATABASE_URL` (owner, used by migrations, seeds and tests), `EVIDEA_APP_PASSWORD` (password for the login role `evidea_app`, used once), `DATABASE_APP_URL` (runtime connection for the application). Load them into the shell before running any command below:

```bash
set -a && . ./.env && set +a
```

## Roles and login users

Migration 0008 creates the group roles `app_read`, `app_write` and `admin` (NOLOGIN). They hold the privileges; login users are granted these roles:
- `app_read`: reads reference data and masked patient data (`v_patients_masked`), but not `patients` or `doctors_and_admin`.
- `app_write`: clinical data read/write, no deletes of patients, no changes to reference data, `system_logs` is append-only. Can run `anonymize_patient`.
- `admin`: full access to application tables, read-only on the migration journal.

The migrations must run as the owner (`postgres` locally), never as the application user. Create the application login user once, after `alembic upgrade head`. The SQL is passed via stdin, because `psql -c` does not substitute variables:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v app_password="$EVIDEA_APP_PASSWORD" <<'SQL'
CREATE ROLE evidea_app LOGIN NOSUPERUSER PASSWORD :'app_password' IN ROLE app_write;
SQL
```

The application must connect with `DATABASE_APP_URL` (user `evidea_app`), not as a superuser. Passwords are stored only as bcrypt or Argon2 hashes: the `doctors_and_admin.password_hash` CHECK rejects other formats. The database checks the format only; hashing is done by the application.


## Loading the Orphanet catalog

Disease reference data comes from Orphanet (`en_product4.xml`, CC BY 4.0, https://www.orphadata.com/data/xml/en_product4.xml). Download the file, then:

```bash
curl -sSL -o en_product4.xml https://www.orphadata.com/data/xml/en_product4.xml
python3 seeds/import_orphanet.py en_product4.xml | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
```

The import is repeatable. It adds or updates diseases by `orpha_code` and writes one `INFO` row to `system_logs` with the Orphanet version. New diseases are inactive (`is_active = FALSE`). This file contains names only: ICD codes, descriptions and inheritance come from other Orphanet files and are not loaded yet.

## Automatic check

The workflow [db-check.yml](../../.github/workflows/db-check.yml) runs on every push and pull request that touches `backend/db/`. It starts PostgreSQL 16 in a service container and runs the same steps as the quick check above. A failing migration, seed or test fails the build.
