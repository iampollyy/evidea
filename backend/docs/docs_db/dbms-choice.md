# EVIDEA — DBMS Selection

> **Document version:** 1.0
>
> **Decision:** PostgreSQL 15+ as the single DBMS of the system
>
> **Related documents:** [data-dictionary.md](./data-dictionary.md), [versioning.md](./versioning.md)

---

## 1. Decision

All operational and analytical data of EVIDEA is stored in a single instance of **PostgreSQL 15+**. This decision is described in section 1 of [data-dictionary.md](./data-dictionary.md) (architectural overview).

A second DBMS (for example, ClickHouse) is not used in the MVP. The reasons are in section 4.

---

## 2. Requirements that drive the choice

The requirements are taken from the data dictionary and project constraints:

| Requirement | Where it is defined | What is needed from the DBMS |
|---|---|---|
| Multi-step atomic operations | TX-1 (case creation and prediction), section 4.6 | Full ACID transactions |
| Referential integrity | Section 4.5, ON DELETE RESTRICT / CASCADE / SET NULL | Foreign keys with configurable actions |
| Strict data invariants | DQ-05, DQ-07, DQ-08, DQ-26 | `CHECK` constraints |
| Only one active ML model | DQ-09 | Partial unique index: `UNIQUE (is_active) WHERE is_active = TRUE` |
| Flexible structures for ML | `input_snapshot`, `eval_metrics`, `affected_systems` | JSON support |
| UUID identifiers | DQ-01, `gen_random_uuid()` | Built-in UUID generation |
| Personal data protection and audit | Section 4.4 (NFR-S5, GDPR), `SystemLogs` | Access control and reliable storage of logs |
| Limited resources | The project is run by a single developer (constraint "Resources") | Minimal infrastructure, mature managed services |
| Low load for the MVP | Section 1.3 of the dictionary | No need for horizontal write scaling |

---

## 3. Comparison of options

| Criterion | PostgreSQL | MySQL / MariaDB | MongoDB | SQLite |
|---|---|---|---|---|
| Foreign keys with ON DELETE actions | Yes | Yes (InnoDB) | No, relationships are checked by the application | Yes, but only when enabled |
| `CHECK` constraints | Yes | Yes (in MySQL 8.0.16+) | No schema-level support (only collection validation) | Yes |
| Partial unique index (DQ-09) | Yes | No. Worked around with generated columns | Yes (`partialFilterExpression`), but the rule lives outside the document schema | Yes |
| JSON support | `JSON` and `JSONB` with indexes | `JSON` with limited indexing | Native, document-based | Limited |
| Multi-document transactions | Yes | Yes | Yes (in a replica set) | Yes |
| Multi-user writes | High | High | High | Low: one writer at a time |
| Suitable for production with PII | Yes, mature access control and audit mechanisms | Yes | Yes, but without strict DQ enforcement at schema level | No |

**Conclusion.** The key dictionary requirements (foreign keys with actions, `CHECK`, the partial unique index DQ-09, JSON) are met by PostgreSQL without workarounds. MongoDB would require moving invariants into application code, which contradicts the principle of "constraints at the database level". SQLite is not suitable for multi-user work by clinicians. MySQL covers most requirements, but without partial indexes DQ-09 would need a workaround.

---

## 4. Why not multiple DBMSs

Using several DBMSs in one project is justified when different parts of the system have fundamentally different load profiles. EVIDEA has no such gap in the MVP.

### 4.1 PostgreSQL + ClickHouse

ClickHouse is a columnar DBMS optimized for analytics over large data volumes. It makes sense to add it when:
- the history of model runs or events reaches hundreds of millions of rows;
- analytical queries over the full history noticeably slow down clinicians' operational work;
- reporting requirements arise that cannot be met on a PostgreSQL replica.

None of these conditions currently holds for EVIDEA. The analytical layer (`PredictionRuns`, `DiseaseHypotheses`, `PredictionExplanation`) in the MVP is a small number of records per case, not an event stream.

A second DBMS would increase the project's cost:
- **Synchronization.** It requires a data export pipeline (CDC or batches), latency monitoring, and error handling.
- **Duplication of personal data.** Rules DQ-42 and DQ-43 (no patient identifiers in `input_snapshot` and `explanation_data`) would have to be enforced in two stores.
- **Two backup and access setups**, two sets of migrations, and two monitoring stacks.
- **Load on a single developer** (constraint "Resources").

**Conclusion:** PostgreSQL + ClickHouse is not justified in the current MVP.

### 4.2 What is already prepared for the future

- **Data layers** (section 1.2 of the dictionary) separate operational from analytical data. They can be moved to a read replica or an analytical store without redesigning the model.
- **Separate model storage.** Trained model files are stored outside the database, at the path from `ModelVersions.artifact_uri`. This is not a DBMS but an object store, which suits binary artifacts. The database holds only metadata.
- **Research dataset** (for example, a MIMIC-IV subset) is not stored in the production database (section 1.4 of the dictionary). It is processed in a separate environment by the Data & ML team.

### 4.3 What is not used and why

- **Redis and caching** are not needed for the MVP: the load is low, and PostgreSQL handles it without a cache. A cache will be added when measured bottlenecks appear.
- **Search engines** (Elasticsearch and similar) are not needed: searches over reference catalogs (`Diseases`, `LabAnalytes`) are served by PostgreSQL indexes.

---

## 5. Consequences of the decision

- **Version.** The minimum PostgreSQL version is 15. It is needed for the built-in `gen_random_uuid()` function without extensions and for modern planner capabilities.
- **Extensions.** No extensions are required for the MVP. If one becomes necessary (for example, vector similarity search), the choice is recorded in a separate decision and migration.
- **Operations.** A managed PostgreSQL service with automated backups and point-in-time recovery is preferred. This fits the single developer's resource constraints.
- **Transactions.** The default `READ COMMITTED` isolation level is sufficient for the scenarios described in the dictionary (section 4.6.1).
- **Migrations.** Schema changes follow the rules in [versioning.md](./versioning.md).

---

## 6. Conditions for revisiting the decision

Revisit the decision if at least one of the following conditions holds:
- analytical queries over the run history noticeably load the operational database, and index tuning and replicas do not help;
- reporting or data volume requirements exceed what PostgreSQL can deliver on a single cluster;
- an event stream appears (telemetry, instrument logs) that does not fit the relational table model.

A revision is documented as a new document with justification and a migration plan, not as an edit to this file.
