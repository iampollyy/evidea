# End-to-end API integration tutorial

This walkthrough uses the Docker Compose stack, `curl`, `jq`, and synthetic demo data to exercise
the public REST API from authentication through a prediction result.

## 1. Start the stack and create a local account

Follow [Getting started](getting-started.md), including the demo seed. For local HTTP only, set
`COOKIE_SECURE=false` in `.env` before starting the API so `curl` can reuse the session cookie.

Create an administrator using the backend CLI. It prompts for a password that satisfies the
configured password policy:

```bash
docker compose exec api python -m evidea.cli create-user \
  --email admin@clinic.example --name Dev --surname Admin --role admin
```

## 2. Sign in

In a Bash-compatible shell, set the API URL and credentials, then save the session cookie in a
temporary file:

```bash
API=http://localhost:8080/api/v1
EMAIL=admin@clinic.example
read -rsp 'Password: ' PASSWORD; echo
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

curl --fail --silent --show-error \
  --cookie-jar "$COOKIE_JAR" \
  --header 'Content-Type: application/json' \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$API/auth/login" | jq '{id, email, role}'
unset PASSWORD
```

The session is an HttpOnly cookie; send the cookie jar on subsequent requests rather than copying
the token into browser JavaScript.

## 3. Create a synthetic patient

```bash
PATIENT_ID="$(
  curl --fail --silent --show-error --cookie "$COOKIE_JAR" \
    --header 'Content-Type: application/json' \
    --data '{
      "name": "Alberto",
      "surname": "Ripley",
      "birthDate": "1998-01-25",
      "sex": "male",
      "email": "alberto.ripley@mail.example"
    }' \
    "$API/patients" | jq -r '.id'
)"
printf 'Created patient %s\n' "$PATIENT_ID"
```

The response status is `201 Created`. The full request and response shapes are in the
[OpenAPI reference](reference/openapi.yaml).

## 4. Submit a case

The lab catalog is optional. This minimal case includes an anamnesis and one vital sign:

```bash
CASE_ID="$(
  curl --fail --silent --show-error --cookie "$COOKIE_JAR" \
    --header 'Content-Type: application/json' \
    --data '{
      "anamnesis": {
        "chiefComplaint": "Progressive proximal muscle weakness",
        "symptomsDuration": "3 months"
      },
      "vitalSigns": {
        "heartRateBpm": 76
      }
    }' \
    "$API/patients/$PATIENT_ID/cases" | jq -r '.id'
)"
printf 'Created case %s\n' "$CASE_ID"
```

Case creation is atomic: the case and all supplied clinical details are stored together or not at
all. Lab reports, when supplied, must use panel and analyte IDs returned by `GET /lab-catalog`.

## 5. Queue and poll a prediction

```bash
RUN_ID="$(
  curl --fail --silent --show-error --cookie "$COOKIE_JAR" \
    --request POST \
    "$API/cases/$CASE_ID/prediction-runs" | jq -r '.id'
)"

for attempt in $(seq 1 30); do
  RUN="$(curl --fail --silent --show-error --cookie "$COOKIE_JAR" \
    "$API/prediction-runs/$RUN_ID")"
  STATUS="$(printf '%s' "$RUN" | jq -r '.status')"
  if [ "$STATUS" = completed ] || [ "$STATUS" = failed ] || [ "$STATUS" = unsupported ]; then
    break
  fi
  sleep 2
done
printf '%s\n' "$RUN" | jq '{id, status, hypotheses}'
```

The initial response is `202 Accepted`; the worker processes the queued run asynchronously. In
production clients should poll the returned `Location` and follow `Retry-After`, rather than poll
at a fixed high frequency. The demo seed provides a local stub model; it is not a clinical model.
If no model is active, the API returns `503 NO_ACTIVE_MODEL`.

## Safety and cleanup

Use only synthetic data. This tutorial's names and contact details are fictional. Do not copy real
clinical notes into local logs, test fixtures, issue reports, or screenshots. Remove the local stack
when finished with `docker compose down`; add `-v` only if you also want to delete its volumes.
