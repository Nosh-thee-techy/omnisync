# Deployment Checklist

## Before preview deployment

- [ ] Pull request CI is green.
- [ ] Preview uses mock or restricted non-production provider credentials.
- [ ] Environment variables are configured in the hosting provider, never committed.
- [ ] No `NEXT_PUBLIC_*` value contains a secret.

## Before production deployment

- [ ] Database migrations have been reviewed and applied safely.
- [ ] Production API, database, and worker secrets are configured.
- [ ] CORS allowlist and application URL match production domains.
- [ ] Worker deployment and webhook authentication are verified.
- [ ] Health check and rollback procedure are confirmed.
