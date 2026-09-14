import { task } from "@trigger.dev/sdk";
import Exa from "exa-js";
import type { ActionResult, ResearchCitation } from "@/lib/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function summarise(query: string, sources: { title: string; text: string }[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_FAST_MODEL ?? "openai/gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Write a concise research brief (5-8 sentences) for a team in a live meeting. Lead with the numbers. Cite sources by title.",
        },
        {
          role: "user",
          content: `Question: ${query}\n\nSources:\n${sources
            .map((s, i) => `[${i + 1}] ${s.title}\n${s.text.slice(0, 1500)}`)
            .join("\n\n")}`,
        },
      ],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? null;
}

export const researchTask = task({
  id: "research",
  run: async ({ query }: { query: string }): Promise<ActionResult> => {
    const exa = new Exa(process.env.EXA_API_KEY);
    const { results } = await exa.searchAndContents(query, {
      numResults: 5,
      text: { maxCharacters: 2000 },
    });

    const citations: ResearchCitation[] = results.map((r) => ({
      title: r.title ?? r.url,
      url: r.url,
    }));
    const summary =
      (await summarise(
        query,
        results.map((r) => ({ title: r.title ?? r.url, text: r.text ?? "" })),
      )) ?? results.map((r) => `• ${r.title ?? r.url}`).join("\n");

    return { summary, citations };
  },
});

export const createIssueTask = task({
  id: "create-issue",
  run: async ({
    title,
    body,
  }: {
    title: string;
    body: string;
  }): Promise<ActionResult> => {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) throw new Error("GITHUB_REPO and GITHUB_TOKEN are required");

    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body }),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}: ${await response.text()}`);
    const issue = (await response.json()) as { html_url: string };
    return { issueUrl: issue.html_url };
  },
});

export const notifySlackTask = task({
  id: "notify-slack",
  run: async ({ text }: { text: string }): Promise<ActionResult> => {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) throw new Error("SLACK_WEBHOOK_URL is required");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error(`Slack returned ${response.status}`);
    return { slackDelivered: true };
  },
});

export const approveActionTask = task({
  id: "approve-action",
  run: async (payload: {
    kind: "task" | "research";
    title: string;
    owner: string | null;
    due: string | null;
    query: string | null;
    sourceQuote: string | null;
  }): Promise<ActionResult> => {
    if (payload.kind === "research") {
      const research = await researchTask.triggerAndWait({ query: payload.query ?? payload.title });
      if (!research.ok) throw new Error("Research failed");
      const slack = await notifySlackTask
        .triggerAndWait({
          text: `*Research brief:* ${payload.title}\n${research.output.summary ?? ""}`,
        })
        .catch(() => null);
      return { ...research.output, slackDelivered: slack?.ok ?? false };
    }

    const body = [
      payload.sourceQuote ? `> ${payload.sourceQuote}` : null,
      payload.owner ? `**Owner:** ${payload.owner}` : null,
      payload.due ? `**Due:** ${payload.due}` : null,
      "",
      "_Captured live by OmniSync._",
    ]
      .filter((line) => line !== null)
      .join("\n");

    const issue = await createIssueTask.triggerAndWait({ title: payload.title, body });
    if (!issue.ok) throw new Error("Issue creation failed");
    const slack = await notifySlackTask
      .triggerAndWait({
        text: `*New action item:* ${payload.title}${payload.owner ? ` → ${payload.owner}` : ""}${payload.due ? ` (due ${payload.due})` : ""}\n${issue.output.issueUrl}`,
      })
      .catch(() => null);
    return { ...issue.output, slackDelivered: slack?.ok ?? false };
  },
});
