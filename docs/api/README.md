# EVIDEA API documentation

The EVIDEA REST API serves the web app and any other client. The OpenAPI contract
[`docs/reference/openapi.yaml`](../reference/openapi.yaml) defines it. The guides in this folder
explain the parts of the contract that need more than a schema.

## Where to read the API

| What | Where | Notes |
| :--- | :--- | :--- |
| Swagger UI (interactive) | <http://localhost:8080/api/v1/docs> | Served by the running API. Shows the committed contract with descriptions, examples and error codes |
| OpenAPI JSON | <http://localhost:8080/api/v1/openapi.json> | Same contract as JSON. Use it to generate clients |
| OpenAPI source | [`docs/reference/openapi.yaml`](../reference/openapi.yaml) | The file to edit. Linted and tested in CI |
| Guides | this folder | Errors, pagination, versioning, contract testing |

The addresses above are for the Docker Compose stack. With the Vite dev server use port `5173`
instead of `8080`; running the API directly with `uvicorn`, use port `8000`.

The API loads `openapi.yaml` when it starts and serves it at `/api/v1/openapi.json`, so Swagger
always shows the contract that was reviewed in Git. In the Docker image the file is copied to
`/app/openapi.yaml` (`OPENAPI_SPEC_PATH`). If the file is missing, the API logs
`openapi_contract_missing` and falls back to the bare schema that FastAPI generates from the code.

### Trying requests in Swagger

1. Open Swagger UI and expand **Auth → POST /auth/login**.
2. Click **Try it out**, enter the email and password of a local account, then click **Execute**.
   The response sets the `evidea_session` cookie in the browser.
3. All other requests in the same browser tab now send the cookie automatically. The
   **Authorize** button is not needed: the cookie is `HttpOnly`, so Swagger cannot set it.

Use only synthetic data. Create the first account with the CLI, as described in
[Getting started](../getting-started.md).

## Guides

| Guide | Contents |
| :--- | :--- |
| [Errors](errors.md) | Problem Details format, error codes, how clients should react |
| [Pagination](pagination.md) | `page` / `pageSize` parameters and the `meta` block |
| [Versioning](versioning.md) | `/api/v1` URL version, compatibility rules, contract releases |
| [Contract testing](contract-testing.md) | Redocly lint, Schemathesis run, what CI checks |
| [Integration tutorial](../integration-tutorial.md) | Sign in, create a patient and case, get a prediction with `curl` |

## Conventions at a glance

- Base path `/api/v1`. JSON bodies use camelCase. IDs are UUIDs.
- Timestamps are ISO 8601 with a time zone; calendar dates are `YYYY-MM-DD`.
- Authentication uses the `evidea_session` cookie (signed JWT, `HttpOnly`, `SameSite=Strict`,
  8 hours), which `POST /auth/login` sets.
- State-changing requests with an `Origin` header that is not on the allowed list are rejected
  (CSRF protection).
- Errors are `application/problem+json` with a stable `code`. See [Errors](errors.md).
- Every response has an `X-Request-ID` header. Send your own value to correlate logs.
- Prediction runs are asynchronous: `POST` returns `202 Accepted` with `Location` and
  `Retry-After`; poll the run until its status is final.

## Endpoints

| Tag | Endpoints | Who can call |
| :--- | :--- | :--- |
| Auth | `POST /auth/login`, `POST /auth/logout`, `POST /auth/invitations/accept` | Anyone |
| Me | `GET /me`, `PUT /me/avatar`, `DELETE /me/avatar` | Signed-in user |
| Doctors | `GET/POST /doctors`, `GET /doctors/{id}`, `POST .../activate`, `POST .../deactivate`, `POST .../invitations`, `GET .../avatar` | Admin; any signed-in user can read avatars |
| Patients | `GET/POST /patients`, `GET/PUT /patients/{id}`, `POST .../archive`, `POST .../anonymize`, `GET/PUT/DELETE .../photo` | Clinician or admin; only an admin can anonymize |
| Cases | `GET/POST /patients/{id}/cases`, `GET /cases/{id}`, `PUT /cases/{id}/anamnesis` | Clinician or admin |
| Lab catalog | `GET /lab-catalog` | Signed-in user |
| Predictions | `GET/POST /cases/{id}/prediction-runs`, `GET /prediction-runs/{id}`, `GET /hypotheses/{id}/explanations` | Clinician or admin |
| Health | `GET /health/live`, `GET /health/ready` | Anyone |

Request and response schemas, examples and all status codes for each operation are in Swagger UI.

## Changing the API

1. Change the code and `docs/reference/openapi.yaml` in the same pull request.
2. Run the checks:

   ```bash
   cd docs/reference && npx --yes @redocly/cli@2.82.0 lint openapi.yaml
   cd backend/app && pytest tests/api
   ```

   `tests/api/test_openapi.py` fails if an implemented route is missing from the contract, if the
   contract describes a route that does not exist, or if the served Swagger schema differs from the
   file.
3. Update the affected guide and examples, and add an entry to the [changelog](../../CHANGELOG.md).
   The full rules are in [Versioning](versioning.md).
