# API contract testing

The committed [OpenAPI document](../reference/openapi.yaml) is the API contract.
Continuous integration checks it in two complementary ways:

1. Redocly validates the OpenAPI document, references, and response examples against their declared
   schemas.
2. Schemathesis sends example-based and generated requests to the running API and checks response
   status codes, headers, content types, and bodies against that same committed contract.
3. Deterministic liveness and readiness response examples are compared directly with the API
   responses in `backend/app/tests/api/test_health.py`.

The Schemathesis run uses the isolated PostgreSQL service from CI and a temporary administrator
account. It is not run against production data.

## Run locally

Install the backend development dependencies and start the Compose stack with synthetic data:

```bash
python -m pip install -r backend/app/requirements-dev.txt
docker compose up -d --build --wait
docker compose run --rm migrate demo-seed
```

Create a local administrator and sign in using the
[integration tutorial](../integration-tutorial.md). Then pass the session cookie to Schemathesis:

```bash
schemathesis run docs/reference/openapi.yaml \
  --url http://localhost:8080/api/v1 \
  --header 'Cookie: evidea_session=<session-token>' \
  --phases examples,coverage,fuzzing \
  --workers 1 \
  --exclude-checks negative_data_rejection,positive_data_acceptance,unsupported_method,allow_header_conformance \
  --max-time 120
```

Use only a disposable local database: generated requests can create and update test resources.

## Scope of the CI checks

The fixed session cookie is supplied to every request, so Schemathesis cannot accurately test
requests with missing or malformed authentication cookies in that same run. Those cases are covered
by the dedicated authentication tests. `positive_data_acceptance` is excluded because schema-valid
values can still fail domain rules or refer to nonexistent database records; `negative_data_rejection`
is excluded for the fixed-cookie limitation. `unsupported_method` and `allow_header_conformance` are
excluded because methods not declared in OpenAPI are outside this contract run, and the proxy or
framework generates their 405 responses independently.

The run still enforces documented status codes, response headers, content types, response schemas,
and absence of server errors for examples and generated requests. A Schemathesis failure should be
treated as a contract or implementation mismatch; do not add a failure baseline to hide it.
