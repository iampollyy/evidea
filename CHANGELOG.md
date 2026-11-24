# Changelog

Notable project changes are recorded here. This changelog follows the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. The API URL version, OpenAPI
contract version, and database migration sequence are tracked separately.

## [Unreleased]

### Added

- Getting-started and end-to-end API integration guides.
- System architecture and prediction-workflow diagrams.
- API error, pagination, and versioning guides.
- Schemathesis contract checks in CI and direct parity checks for deterministic health examples.
- API documentation index (`docs/api/README.md`) and backend README (`backend/app/README.md`).
- Test that keeps implemented routes and the OpenAPI contract in sync.

### Changed

- Swagger UI (`/api/v1/docs`) now shows the committed OpenAPI contract with descriptions, examples
  and error responses instead of the bare schema generated from code.
