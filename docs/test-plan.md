# QA Test Plan

## Mocked E2E flow

1. A user submits a meeting/transcript event.
2. The system creates a job and displays `queued`.
3. The UI receives `processing`, then `completed`.
4. An extracted action item appears and can be approved.
5. Approval requests a follow-up dispatch and the UI reflects its result.

## Required negative cases

- Unauthenticated requests are rejected.
- A user cannot access another project's job.
- Invalid payloads receive a safe validation error.
- Duplicate input does not create duplicate external work.
- Provider or worker failure presents a safe retry/fallback state.

Test implementation awaits the final route, event, and selector contracts in `contracts.md`.
