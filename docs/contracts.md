# OmniSync Contracts

This document is the shared interface agreement for database, backend, worker, frontend, QA, and deployment work. Update it together with any breaking interface or workflow change.

## Data Model

> Owner: Engineer 1 · Status: TBD

| Entity | Identifier | Owner | Sensitive fields | Notes |
| --- | --- | --- | --- | --- |
| User | `TBD` | `TBD` | `TBD` | |
| Project | `TBD` | `TBD` | `TBD` | |
| Meeting | `TBD` | `TBD` | transcript/audio references | |
| Job | `TBD` | `TBD` | result/error payload | |
| Action item | `TBD` | `TBD` | assignee/task details | |
| Status log | `TBD` | `TBD` | error detail | |

## Authentication and Authorization

> Owner: Engineer 2 · Status: TBD

- User authentication method: `TBD`
- Internal worker authentication method: `TBD`
- Webhook verification method: `TBD`
- Project ownership rule: `TBD`

## API Routes

> Owner: Engineer 2 · Status: TBD

| Route | Method | Caller | Auth | Request | Success response | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` |

### Standard Error Shape

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Safe user-facing message",
    "requestId": "req_optional"
  }
}
```

## Events and Background Jobs

> Owner: Engineer 3 · Status: TBD

| Event/job | Producer | Consumer | Payload schema | Idempotency key | Result reporting |
| --- | --- | --- | --- | --- | --- |
| `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` |

## Job Status Lifecycle

> Owners: Engineers 1–3 · Status: Proposed

```text
queued → processing → completed
                  ↘ failed → retrying → processing
```

Confirm permitted statuses, terminal states, retry policy, and the location of status history.

## Frontend States and Test Selectors

> Owner: Engineer 4 · Status: TBD

| UI state/action | API/event dependency | Required `data-testid` | Empty/loading/error behavior |
| --- | --- | --- | --- |
| Dashboard | `TBD` | `dashboard` | `TBD` |
| Transcript feed | `TBD` | `transcript-feed` | `TBD` |
| Job status | `TBD` | `job-status` | `TBD` |
| Action approval | `TBD` | `approve-action` | `TBD` |

## External Services and Mocking

> Owners: Engineers 2–4 · Status: TBD

| Service | Environment | Real or mocked | Failure fallback | Secret name |
| --- | --- | --- | --- | --- |
| OpenAI/OpenRouter | preview | `TBD` | `TBD` | `OPENAI_API_KEY` / `OPENROUTER_API_KEY` |
| Exa | preview | `TBD` | `TBD` | `EXA_API_KEY` |
| Trigger.dev | preview | `TBD` | `TBD` | `TRIGGER_SECRET_KEY` |

## Security Rules

- Validate every external API payload before persistence or queueing.
- Authorize every project-scoped read and mutation.
- Verify worker/webhook requests using the agreed internal authentication method.
- Redact credentials, authorization headers, and sensitive transcript content from logs.
- Do not expose secrets through `NEXT_PUBLIC_*` variables.

## Environment Variables and Deployment

See [environment.md](./environment.md) and [deployment.md](./deployment.md).
