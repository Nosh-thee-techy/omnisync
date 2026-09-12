export type ExaResult = {
  title: string;
  url: string;
  snippet: string;
};

export async function searchExa(query: string, limit = 5): Promise<ExaResult[]> {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    return [
      {
        title: "Exa search not configured",
        url: "https://exa.ai",
        snippet: `Add EXA_API_KEY to run live research for: "${query}"`,
      },
    ];
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      numResults: limit,
      type: "auto",
      contents: { text: { maxCharacters: 300 } },
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa search failed (${response.status})`);
  }

  const data = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; text?: string }>;
  };

  return (data.results ?? []).map((result) => ({
    title: result.title ?? "Untitled",
    url: result.url ?? "",
    snippet: result.text?.slice(0, 280) ?? "",
  }));
}
