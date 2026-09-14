# OmniSync

A companion panel for cross-border meetings. It sits beside Google Meet, Zoom or Teams, transcribes everyone in the call in real time, translates as it goes, and turns spoken commitments into action cards a person can approve. Approved cards run in the background and report back while the call is still going.

## What it does today

| Capability | Status | Where |
|---|---|---|
| Sign in (Auth0, Google) | Working | `src/app/api/auth`, `src/lib/auth0.ts` |
| Consent gate before any capture | Working | `src/components/meeting/consent-gate.tsx` |
| Live transcription of the meeting tab **and** your mic | Working | `src/hooks/useMeetingCapture.ts`, `src/app/api/realtime/session` |
| Speaker tagging (You / Room) | Working | derived from the audio source |
| Per-line language detection and translation | Working | `src/app/api/translate` |
| Action-item and research extraction | Working | `src/app/api/copilotkit`, `src/lib/copilot-runtime.ts` |
| Approve / edit / dismiss cards (CopilotKit generative UI) | Working | `src/components/meeting/action-cards.tsx` |
| Background research via Exa, summarised into a brief | Working | `src/lib/dispatch-executor.ts`, `src/trigger/research-exa.ts` |
| Live job status back onto the card | Working | `src/app/api/actions/[actionId]/job` |
| Scripted sample meeting for demos | Working | `src/lib/sample-transcript.ts` |
| Action items + follow-up jobs persisted (Prisma / Neon) | Working | `src/contexts/workspace-actions.tsx`, `src/app/api/actions`, `src/lib/dispatch-task.ts` |
| Overview and Action-items panels on real data | Working | `src/components/workspace/` |
| Runs locally when Trigger.dev is not configured | Working | `src/lib/dispatch-task.ts` |

The transcript itself is never written to disk — it lives in the browser tab and is gone when the tab closes. Only action items a person approves are persisted.

## Architecture

```mermaid
flowchart LR
    subgraph BROWSER["Browser — /app"]
        TAB["Meeting tab audio<br/>(remote participants)"]
        MIC["Microphone<br/>(you)"]
        RT1["Realtime session · Room"]
        RT2["Realtime session · You"]
        PANEL["Transcript panel"]
        CARDS["Action cards<br/>useHumanInTheLoop"]
    end

    subgraph NEXT["Next.js route handlers"]
        TOK["/api/realtime/session<br/>mint 60s ephemeral key"]
        TR["/api/translate<br/>OpenRouter fast tier"]
        CK["/api/copilotkit<br/>Extractor agent · OpenRouter"]
        AC["/api/actions<br/>persist ActionItem"]
        AP["/api/trigger-action<br/>FollowUpJob + dispatch"]
        ST["/api/actions/:id/job"]
    end

    subgraph TDEV["Trigger.dev (or in-process fallback)"]
        RS["research-exa<br/>Exa → brief"]
        DA["dispatch-action-item<br/>GitHub issue"]
        SL["Slack webhook"]
    end

    DB[("Prisma / Neon")]

    OA["OpenAI Realtime"]

    TOK -.->|ek_ token| RT1
    TOK -.->|ek_ token| RT2
    TAB --> RT1 <-->|WebRTC| OA
    MIC --> RT2 <-->|WebRTC| OA
    RT1 --> PANEL
    RT2 --> PANEL
    PANEL --> TR --> PANEL
    PANEL -->|batched every 8s| CK
    CK -->|tool calls| CARDS
    CARDS -->|Approve| AC --> AP
    AP --> RS
    AP --> DA
    RS --> SL
    DA --> SL
    AC --> DB
    AP --> DB
    RS -.->|output| DB
    DA -.->|output| DB
    DB --> ST -->|poll| CARDS

    style CARDS fill:#6658e9,color:#fff
    style AP fill:#b45309,color:#fff
    style RS fill:#7c3aed,color:#fff
    style DA fill:#94a3b8,color:#fff
    style SL fill:#94a3b8,color:#fff
```

Three rules hold the design together:

- **Audio never touches the server.** Next only mints a short-lived key; the browser talks to OpenAI directly over WebRTC.
- **The extractor proposes, it never executes.** The agent can only call `proposeActionItem` or `requestResearch`. A person clicks Approve before anything leaves the meeting.
- **`/api/trigger-action` is the only path to Trigger.dev.** Every side effect passes through that one gate, and every run is recorded as a `FollowUpJob` row first.

### Live loop

```mermaid
sequenceDiagram
    participant OA as OpenAI Realtime
    participant P as Panel
    participant TR as /api/translate
    participant CK as /api/copilotkit
    participant TD as Trigger.dev

    loop per spoken line
        OA-->>P: transcription.completed
        par
            P->>TR: text
            TR-->>P: language + translation
        and
            P->>CK: batch (every 8s)
            CK-->>P: proposeActionItem / requestResearch
        end
    end
    P->>TD: approve → /api/trigger-action → research-exa | dispatch-action-item
    TD-->>P: job status (polled from Prisma) → brief / links on the card
```

## Pending integrations

Both hooks live in `src/lib/dispatch-executor.ts` and are skipped silently until their variables are set — approvals still complete.

### GitHub — pending
- Set `GITHUB_TOKEN` (fine-grained PAT with **Issues: write** on the target repo) and `GITHUB_REPO` (`owner/repo`).
- `dispatch-action-item` then posts to `POST /repos/{owner}/{repo}/issues` and returns the issue URL to the card.
- Later: replace the PAT with per-user GitHub OAuth so issues are attributed to the approver.

### Slack — pending
- Create an **Incoming Webhook** on a Slack app and set `SLACK_WEBHOOK_URL`.
- Research briefs and new action items (with their issue link) are posted after each dispatch.
- Later: Slack OAuth + channel picker instead of a single webhook.

### Jira — not started
- No hook yet. Would mirror the GitHub step against `POST /rest/api/3/issue` with an Atlassian API token, plus `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`.

## Running it

```bash
cp .env.example .env        # fill in keys — each block links to where to get it
npm install
npx prisma generate
npm run dev                 # http://localhost:3000

# second terminal — optional; without TRIGGER_SECRET_KEY approvals run in-process
npx trigger.dev@latest login
npm run trigger:dev
```

Then sign in, open `/app`, accept the consent gate, and either **Connect to meeting** (pick a **Chrome Tab** and tick *Share tab audio* — window and screen shares carry no audio on macOS) or **Sample** to replay the scripted meeting. Wear headphones, otherwise your mic re-records the remote side and every line transcribes twice.

`OPENAI_TRANSCRIBE_MODEL` defaults to `gpt-4o-transcribe`. Set it to `gpt-4o-transcribe-diarize` if your OpenAI org has access — that adds per-speaker labels inside the Room stream.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` / `db:push` / `db:studio` | Prisma |
| `npm run test:e2e` | Playwright |
