import type { Prisma } from "@/generated/prisma/client";
import { searchExa } from "@/lib/exa-search";
import { prisma } from "@/lib/prisma";
import type { IntentType } from "@/types/pipeline";

export type DispatchJobInput = {
  actionId: string;
  jobId: string;
  taskType: IntentType;
  task: string;
  assignee?: string;
  priority?: string;
  query?: string;
};

export type DispatchOutput = {
  task?: string;
  query?: string;
  results?: Array<{ title: string; url: string; snippet: string }>;
  summary?: string;
  citations?: Array<{ title: string; url: string }>;
  issueUrl?: string;
  slackDelivered?: boolean;
  message?: string;
};

async function summarise(query: string, results: DispatchOutput["results"] = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || results.length === 0) return undefined;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_FAST_MODEL ?? "openai/gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Write a concise research brief (5-8 sentences) for a team in a live meeting. Lead with the numbers. Cite sources by title." },
        { role: "user", content: `Question: ${query}\n\nSources:\n${results.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`).join("\n\n")}` },
      ],
    }),
  });
  if (!response.ok) return undefined;
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? undefined;
}

async function createGitHubIssue(title: string, body: string) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) return undefined;

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}: ${await response.text()}`);
  return ((await response.json()) as { html_url: string }).html_url;
}

async function notifySlack(text: string) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return false;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  return response.ok;
}

export async function executeDispatchJob(input: DispatchJobInput): Promise<DispatchOutput> {
  await prisma.followUpJob.update({
    where: { id: input.jobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  try {
    let output: DispatchOutput;

    if (input.taskType === "RESEARCH_QUERY" && input.query) {
      const results = await searchExa(input.query);
      const summary = await summarise(input.query, results);
      output = {
        query: input.query,
        results,
        summary,
        citations: results.map((r) => ({ title: r.title, url: r.url })),
      };
      output.slackDelivered = await notifySlack(`*Research brief:* ${input.query}\n${summary ?? results.map((r) => `• ${r.title} — ${r.url}`).join("\n")}`);
    } else {
      const body = [
        input.assignee ? `**Owner:** ${input.assignee}` : null,
        input.priority ? `**Priority:** ${input.priority}` : null,
        "",
        "_Captured live by OmniSync._",
      ].filter((line) => line !== null).join("\n");
      const issueUrl = await createGitHubIssue(input.task, body);
      output = {
        task: input.task,
        issueUrl,
        message: `Task dispatched for ${input.assignee ?? "the team"}`,
      };
      output.slackDelivered = await notifySlack(`*New action item:* ${input.task}${input.assignee ? ` → ${input.assignee}` : ""}${issueUrl ? `\n${issueUrl}` : ""}`);
    }

    await prisma.followUpJob.update({
      where: { id: input.jobId },
      data: { status: "SUCCEEDED", output: output as Prisma.InputJsonValue, finishedAt: new Date() },
    });
    await prisma.actionItem.update({ where: { id: input.actionId }, data: { status: "COMPLETED" } });
    return output;
  } catch (error) {
    await prisma.followUpJob.update({
      where: { id: input.jobId },
      data: { status: "FAILED", error: error instanceof Error ? error.message : String(error), finishedAt: new Date() },
    });
    throw error;
  }
}
