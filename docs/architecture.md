# System architecture

EVIDEA is a single-deployment web application. The browser serves the React frontend and sends API
requests through the same-origin nginx proxy. The FastAPI API and prediction worker use PostgreSQL;
the worker claims queued prediction runs, performs inference, and writes results back to the
database. Uploaded images use the shared storage volume. SMTP delivery is external in production
and routed to Mailpit during local development.

## Components

```mermaid
flowchart LR
    Clinician[Clinician browser]
    Admin[Administrator browser]
    Web[Nginx + React frontend]
    API[FastAPI REST API]
    DB[(PostgreSQL)]
    Worker[Prediction worker]
    Storage[(Image storage volume)]
    SMTP[SMTP server]
    Mailpit[Mailpit - local only]

    Clinician --> Web
    Admin --> Web
    Web -->|/api/v1| API
    API --> DB
    API --> Storage
    API -->|invitation email| SMTP
    SMTP -. local development .-> Mailpit
    DB -->|pending prediction runs| Worker
    Worker -->|status, hypotheses, explanations| DB
```

## Prediction request lifecycle

```mermaid
sequenceDiagram
    actor Clinician
    participant API as FastAPI API
    participant DB as PostgreSQL
    participant Worker as Prediction worker

    Clinician->>API: POST /api/v1/cases/{caseId}/prediction-runs
    API->>DB: Store de-identified input snapshot and pending run
    API-->>Clinician: 202 Accepted + Location + Retry-After
    Worker->>DB: Claim pending run
    Worker->>Worker: Run active model
    Worker->>DB: Save status, ranked hypotheses, explanations
    Clinician->>API: GET /api/v1/prediction-runs/{runId}
    API->>DB: Read run and hypotheses
    API-->>Clinician: Current run result
```

The prediction snapshot excludes patient names, email addresses, and phone numbers. Prediction
results are decision support only; they do not replace clinician judgment.

## Data architecture

The operational database contains application/authentication data, patient and case records, model
metadata, prediction results, and reference catalogs. The ML model is trained offline; production
stores model metadata and uses the configured artifact location rather than storing training data
in the operational database.

See the [data dictionary](../backend/docs/docs_db/data-dictionary.md) for database layers and table
details, the [ER diagram](../backend/docs/diagrams/EHR_Polina_Trybialustava.jpg) for relationships,
and [database versioning](../backend/docs/docs_db/versioning.md) for migration rules.
