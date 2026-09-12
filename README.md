This is OmniPulse, an ambient meeting and action orchestration app. It includes a dependency-free mock API gateway so UI work can progress before a database or identity provider exists.

## Mock API gateway

The API is stateful only for the running Next.js process. It begins with one scheduled meeting and one open action, is intentionally uncached, and resets after a server restart. Protected endpoints accept either the `omnipulse_mock_session` cookie issued on sign-in or an `Authorization: Bearer <token>` header.

### Auth0 production authentication

Auth0 is supported through the official `@auth0/nextjs-auth0` SDK. Copy [`.env.example`](.env.example) to `.env.local` and supply the Auth0 credentials from a **Regular Web Application** in your tenant. When all four `AUTH0_*` values are present, the gateway automatically switches from mock sessions to Auth0 sessions:

- Sign in at `/auth/login` and sign out at `/auth/logout`.
- Auth0 auto-mounts the callback and session endpoints beneath `/auth/*` through `src/proxy.ts`.
- Every protected API handler validates the Auth0 session itself; proxy checks are only the fast routing boundary.
- Configure Auth0 Allowed Callback URLs and Logout URLs for `http://localhost:3001/auth/callback` (or the port you use) and your deployed URL’s equivalent.

Without the Auth0 environment variables, the documented mock `/api/auth/*` flow remains available exclusively for local UI development. It is automatically disabled once Auth0 is configured.

All responses use one of these shapes:

```ts
{ data: T, meta?: Record<string, unknown> }
{ error: { code: string, message: string, details?: Record<string, string> } }
```

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Unauthenticated mock-service readiness check |
| `/api/openapi` | GET | Unauthenticated OpenAPI 3.1.1 contract document |
| `/api/auth/login` | POST | Create a mock session (`{ email, name? }`) |
| `/api/auth/logout` | POST | Clear the current mock session |
| `/api/auth/session` | GET | Retrieve the current session |
| `/api/dashboard` | GET | Upcoming meetings, open actions, counts |
| `/api/parse-intent` | POST | Parse `{ transcript, meetingId? }` for an immediate UI card; does not create data |
| `/api/meetings` | GET, POST | List (`?status=`) or create meetings |
| `/api/meetings/:meetingId` | GET, PATCH, DELETE | Read, edit, or remove a meeting |
| `/api/meetings/:meetingId/actions` | GET, POST | List or create a meeting’s actions |
| `/api/actions` | GET, POST | List (`?status=&meetingId=`) or create actions |
| `/api/actions/:actionId` | GET, PATCH, DELETE | Read, edit, or remove an action |
| `/api/webhooks/:provider` | POST | Verify and route an external event (`calendar`, `meeting`, `transcript`, `action`) |

Example sign-in from a client component:

```ts
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "alex@example.com", name: "Alex" }),
});
const { data: session } = await response.json();
```

`src/proxy.ts` performs a fast, optimistic check for `/api/*` and `/app/*`; handlers repeat the authorization check so they stay safe if the proxy is bypassed. `/api/health`, `/api/openapi`, and `/api/auth/login` are public. A missing session redirects `/app/*` to `/?next=...` and returns `401` for API calls.

## Webhook gateway

Webhook URLs are intentionally exempt from session authentication because they are called by external providers. Instead, configure a per-provider HMAC secret, for example `OMNIPULSE_WEBHOOK_CALENDAR_SECRET`. Send the raw JSON body and an `x-omnipulse-signature: sha256=<hex-hmac>` header. The gateway verifies the signature and routes the acknowledged mock event to meetings or actions.

In development, absent secrets are accepted as `verification: "mock"` so frontend integration has no setup dependency. In production, missing secrets return `503`, and invalid signatures return `401`.

### Audio transcript integration

`useAudioStream.ts` can send debounced blocks as `{ transcript, meetingId? }` to either route:

- `POST /api/parse-intent` is authenticated and returns a deterministic mock intent suitable for an Eng 4 UI card. It never changes the action store.
- `POST /api/webhooks/transcript` accepts the same payload, verifies its webhook signature when configured, returns the intent, and creates an open action only when the block is recognized as actionable (for example, “I’ll send the brief”).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
#omnisync
