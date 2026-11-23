# API versioning

The public API major version is part of the URL: `/api/v1`. The OpenAPI document's `info.version`
describes the contract release and does not replace the URL version. Database migration numbering
is independent; see [database versioning](../../backend/docs/docs_db/versioning.md).

## Compatibility policy

Within `/api/v1`, preserve existing operation behavior, required request fields, response meanings,
and documented status codes. Additive changes should be designed so existing clients can continue
to operate; examples include a new endpoint or an optional request field. Treat changes that can
invalidate generated clients or change existing behavior as breaking.

Before changing the API contract:

1. Update `docs/reference/openapi.yaml` and the implementation in the same change.
2. Update affected examples and the relevant API guide.
3. Add or update tests, including the Schemathesis contract run.
4. Add a user-facing entry under `Unreleased` in the root [changelog](../../CHANGELOG.md).

Introduce a new URL major version (for example `/api/v2`) for breaking changes. Do not silently
change the meaning of an existing `/api/v1` operation. If two major versions must run concurrently,
document the supported versions and migration plan before exposing the new version.

## Contract release

`info.version` in `docs/reference/openapi.yaml` is the OpenAPI contract release. Bump it when a
published contract change warrants a new contract release, and keep it consistent with the project
changelog. A change to this value alone does not create a new URL version or imply a database
migration.
