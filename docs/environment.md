# Environment Configuration

Copy `.env.example` to `.env.local` for local development. Never commit `.env`, `.env.local`, provider keys, database URLs, or credentials.

| Environment | Purpose | Providers | Data |
| --- | --- | --- | --- |
| Local | Developer workflow | Mock by default | Local/test database |
| Preview | PR validation/demo | Mock or restricted non-production credentials | Isolated staging data |
| Production | Live application | Production credentials only | Production database |

`NEXT_PUBLIC_*` variables are embedded in browser bundles. Only expose intentionally public configuration through that prefix.
