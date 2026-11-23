# API errors

The API returns errors as `application/problem+json`, following RFC 9457 with EVIDEA-specific
fields. The complete response schemas and operation-specific status codes are in the
[OpenAPI reference](../reference/openapi.yaml).

## Response shape

```json
{
  "type": "https://evidea.example/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "requestId": "4b1d2c3e-0f9a-4e8b-a7c6-5d4e3f2a1b0c",
  "errors": [
    {
      "field": "birthDate",
      "message": "Date of birth cannot be in the future",
      "code": "date_in_future"
    }
  ]
}
```

`detail` is optional. `errors` appears for validation failures, and operation-specific extension
fields may appear for conflicts (for example, `existingRunId` when a prediction is already running).
The `X-Request-ID` response header matches `requestId` in the body.

## Client handling

- Branch on the stable machine-readable `code`, not on `title` or `detail`.
- Treat `field` as a camelCase, dot-separated path and display `message` beside the relevant input.
- For `429`, wait at least the number of seconds in `Retry-After` before retrying.
- For `503`, retry only when the operation is safe to retry; for prediction requests, first inspect
  the run state or the documented error code.
- Include `requestId` when reporting a failure to support staff. Do not include patient details,
  passwords, invitation tokens, or session cookies in logs or support reports.
- Do not retry non-idempotent writes blindly after a network timeout. Read the resulting resource
  or use the operation's documented idempotency behavior first.

## Common codes

| HTTP status | Example codes | Meaning |
| --- | --- | --- |
| 400 | `BAD_REQUEST`, `INVITATION_INVALID` | Request could not be parsed or completed with the supplied token |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` | Sign in or correct the supplied credentials |
| 403 | `FORBIDDEN`, `ACCOUNT_DEACTIVATED` | Authenticated account is not allowed to perform this action |
| 404 | `NOT_FOUND` | Resource does not exist or is not visible to the caller |
| 409 | `EMAIL_ALREADY_USED`, `PATIENT_ARCHIVED`, `PREDICTION_RUN_IN_PROGRESS` | Current resource state conflicts with the request |
| 413 / 415 | `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` | Uploaded file violates size or media-type requirements |
| 422 | `VALIDATION_ERROR` | Request fields or domain values failed validation |
| 429 | `RATE_LIMITED` | Request limit reached; see `Retry-After` |
| 500 | `INTERNAL_ERROR` | Unexpected server failure; use `requestId` for diagnostics |
| 503 | `NO_ACTIVE_MODEL`, service unavailable | A required service or active model is unavailable |
