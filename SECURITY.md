# Security Policy

## Secrets

- Store secrets in `.env.local` locally and in the deployment provider's secret manager remotely.
- Do not commit credentials, transcripts containing sensitive information, or raw meeting audio.
- Rotate any credential that is accidentally exposed.

## Application safeguards

- Validate untrusted API payloads.
- Enforce authentication and project ownership on protected routes.
- Verify worker and webhook requests.
- Redact secrets and authorization headers from logs.

## Reporting

Report potential security issues privately to the project maintainers. Do not include live credentials in reports.
