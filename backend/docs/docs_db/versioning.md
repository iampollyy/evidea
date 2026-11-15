# EVIDEA — Database Schema Versioning

> **Document version:** 1.0
>
> **DBMS:** PostgreSQL 15+
>
> **Related documents:** [data-dictionary.md](./data-dictionary.md), [dbms-choice.md](./dbms-choice.md)

---

## 1. Principles

1. **The schema changes only through migrations.** Manual `ALTER`/`CREATE` statements are forbidden in any environment except a local sandbox.
2. **Git is the source of truth.** SQL migrations, seeds, and the data dictionary live in the repository and go through Pull Requests. Change history is recovered with `git log` and `git blame`.
3. **An applied migration is immutable.** A file that has reached the main branch and has been applied in at least one environment is not edited. Fixes are made in a new migration.
4. **Forward-only.** Rollback is performed by a new corrective migration, not by deleting or editing an old one. Before deploying migrations that change data, a database snapshot (backup) is taken.
5. **Documentation is kept in sync with code.** Schema changes and updates to [data-dictionary.md](./data-dictionary.md) are made in the same PR.

---

## 2. Where version information is stored

| What is versioned | Where it is stored | How it is tracked |
|---|---|---|
| Database structure (tables, columns, indexes, constraints) | `backend/migrations/` — ordered SQL files | Git history of the files, PRs, the applied-migrations journal inside the database |
| Reference data required by the application (roles, lab categories, panels, analytes) | Data migrations in `backend/migrations/` | Same as the schema: via Git and the migrations journal |
| Test and demo data | `backend/seeds/` | Git. Applied only in dev/test, never run in production |
| Human-readable schema description (tables, DQ rules, dictionary version) | [data-dictionary.md](./data-dictionary.md) | `Version` and `Last updated` fields in the header, Git |
| ML model versions (data, not schema) | `ModelVersions` table | One row per model version, `is_active` flag, rule DQ-09 |
| Version of the Orphanet disease catalog import | `Diseases` table | See section 6, open questions |

It is important to distinguish three different things:
- **schema version** — the state of the database structure, recorded by migrations;
- **data dictionary version** — the version of the document, recorded in its header;
- **ML model version** — data in `ModelVersions`, not related to the migration number in any way.

---

## 3. Migration naming rules

Files are numbered sequentially, without gaps, with a short description in English:

```
backend/migrations/
  0001_create_doctors_and_roles.sql
  0002_create_patients_cases.sql
  0003_create_lab_reference.sql
  0004_add_partial_unique_active_model.sql
  ...
```

- The number has 4 digits. Duplicate numbers are not allowed; if two branches conflict, the PR merged first keeps its number and the second one is renumbered.
- One migration is one logical unit of change. Do not mix table creation, data changes, and column removal in one file.
- Every migration must run without errors on an empty database. Migrations that depend on data must be idempotent or explicitly guarded by checks.

> The migration tool (Flyway, Alembic, node-pg-migrate, or similar) will be chosen together with the backend stack. It must maintain a journal of applied migrations with a checksum of each file. If a checksum changes, the migration is considered corrupted and application stops.

---

## 4. Schema change lifecycle

1. **Branch and migration.** Create a branch and add a migration file with the next number.
2. **Dictionary update.** Update the corresponding tables, columns, and DQ rules in [data-dictionary.md](./data-dictionary.md). The dictionary version is bumped according to the rules in section 5.
3. **Local verification.**
   - migrations are applied to an empty database from scratch;
   - migrations are applied to a database created by the previous schema version (upgrade check);
   - application tests pass on the updated schema.
4. **Pull Request.** Review checks the SQL, consistency with the dictionary, and presence of DQ rules for new constraints.
5. **Deployment.** A database snapshot is taken before applying to production. Migrations are applied automatically at service startup or as a separate deployment step. Manual application is allowed only with agreement and a journal entry.
6. **Post-deployment check.** The migrations journal in the database matches the contents of `backend/migrations/`.

---

## 5. Safe schema changes

Changes that lock a table or lose data are performed in several steps (expand/contract pattern):

| Task | Steps |
|---|---|
| Add a required column (`NOT NULL`) | 1) add the column as nullable; 2) backfill data in a separate migration or script; 3) add the `NOT NULL` constraint |
| Rename a column or table | 1) add the new one; 2) write to both old and new; 3) move the data; 4) switch the application; 5) drop the old one in a separate migration |
| Drop a column or table | First remove its usage from the application and release, then drop it in a separate migration |
| Create an index on a large table | `CREATE INDEX CONCURRENTLY`, which does not block writes. Such an index cannot be created inside a migration transaction |
| Change a column type | New column of the required type, data transfer, switch, drop the old one |

**Data dictionary version** (`Version` field in the header of [data-dictionary.md](./data-dictionary.md)):
- **major** (1.x → 2.0): tables/columns removed or renamed, types changed;
- **minor** (1.0 → 1.1): tables, columns, or DQ rules added;
- **patch** (1.1.0 → 1.1.1, or reflected via the `Last updated` date): descriptions corrected without structural changes.

---

## 6. Change history and audit

- **Schema history** is `git log -- backend/migrations/` and `git blame` on a specific file. Each file is linked to the PR in which the change was discussed.
- **Application journal** — the migrations journal table in each environment shows which migrations were applied and when. A mismatch with Git indicates a deployment problem.
- **Link to business requirements** — the PR description lists the user story or use case numbers (for example, US-12, UC-1) that require the change.

### Open questions

- **Migration tool not chosen.** The repository does not yet contain a backend, so the specific tool and journal format will be decided later.
- **`Diseases` import version.** The dictionary states that the data version is recorded on each import, but the table has no field for it. Proposal: add a `source_version` column or record the import version in `SystemLogs`.
- **JSON column type.** The dictionary describes `eval_metrics`, `input_snapshot`, and `affected_systems` as `JSON`. `JSONB` is preferred for indexing and key-level operations. The choice should be fixed in a migration and reflected in the dictionary.
