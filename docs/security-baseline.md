# Security Baseline

## Implemented

- Environment variables are excluded by `.gitignore` and documented in `.env.example`.
- GitHub Actions runs a secret scan on pull requests targeting `main` and manual dispatches.
- The secret scan checks full Git history.

## Pending application configuration

- Add global response headers through `next.config.ts`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: off`
  - A `Permissions-Policy` that permits microphone access only to this application.
- Define an explicit Content Security Policy after Engineers 2–4 provide required AI, realtime, and asset provider domains.
- Configure CORS per API route after Engineer 2 provides the public/internal route contract. Do not use `Access-Control-Allow-Origin: *` for authenticated endpoints.
- Add API payload schemas, ownership checks, rate limits, and worker webhook signature validation when their endpoints are implemented.

## CI configuration

If the repository is owned by a GitHub organization, create a `GITLEAKS_LICENSE` repository or organization secret before enabling the workflow. Personal repositories do not require it.
