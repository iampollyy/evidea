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
# 1. Start an empty PostgreSQL 16 on port 5433
docker run --name evidea-db -e POSTGRES_PASSWORD=evidea -e POSTGRES_DB=evidea -p 5433:5432 -d postgres:16

# 2. Run everything from backend/db
cd backend/db
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:evidea@localhost:5433/evidea"

alembic upgrade head                                  # create the schema (0001 -> 0007)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f seeds/dev_seed.sql   # fake data
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/constraints_test.sql   # expect 17 PASS, exit code 0
```

Without Docker, use your local PostgreSQL: create an empty database and set `DATABASE_URL` to it. `psql` must be installed.

## Applying migrations (any environment)

1. `cd backend/db`, install `requirements.txt` into a virtualenv.
2. Set `DATABASE_URL` (format `postgresql://user:password@host:port/dbname`).
3. Run `alembic upgrade head`. Already applied revisions are skipped.
4. Check the state with `alembic current` (should show `0007 (head)`).

Rules:
- Never edit an applied SQL file. `migrations/env.py` compares SHA-256 checksums and stops on a mismatch. Add a new revision instead.
- Downgrade is not supported (forward-only).
- Do not run `seeds/` in production.

## Loading the Orphanet catalog

Disease reference data comes from Orphanet (`en_product4.xml`, CC BY 4.0, https://www.orphadata.com/data/xml/en_product4.xml). Download the file, then:

```bash
curl -sSL -o en_product4.xml https://www.orphadata.com/data/xml/en_product4.xml
python3 seeds/import_orphanet.py en_product4.xml | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
```

The import is repeatable. It adds or updates diseases by `orpha_code` and writes one `INFO` row to `system_logs` with the Orphanet version. New diseases are inactive (`is_active = FALSE`). This file contains names only: ICD codes, descriptions and inheritance come from other Orphanet files and are not loaded yet.

## Automatic check

The workflow [db-check.yml](../../.github/workflows/db-check.yml) runs on every push and pull request that touches `backend/db/`. It starts PostgreSQL 16 in a service container and runs the same steps as the quick check above. A failing migration, seed or test fails the build.
