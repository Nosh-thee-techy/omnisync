export type IntentKind = "action_item" | "question" | "decision" | "note";

export type ParsedIntent = {
  intent: IntentKind;
  confidence: number;
  summary: string;
  action?: { title: string; owner?: string; dueAt?: string };
};

const actionPattern = /(?:action item|todo|to do|follow up|i(?:'|’)ll|we(?:'|’)ll|please|need to|should)\s+(.+)/i;
const questionPattern = /\?|\b(?:who|what|when|where|why|how|can|could|should)\b/i;
const decisionPattern = /\b(?:decided|decision|agreed|approve[ds]?|will use|going with)\b/i;

function clean(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[\s:,-]+|[\s:,-]+$/g, "").slice(0, 240);
}

export function parseIntent(transcript: string): ParsedIntent {
  const text = clean(transcript);
  const actionMatch = text.match(actionPattern);
  if (actionMatch) {
    const title = clean(actionMatch[1]).replace(/[.?!]$/, "");
    return { intent: "action_item", confidence: 0.86, summary: title, action: { title: title || text } };
  }
  if (decisionPattern.test(text)) return { intent: "decision", confidence: 0.78, summary: text };
  if (questionPattern.test(text)) return { intent: "question", confidence: 0.72, summary: text };
  return { intent: "note", confidence: 0.55, summary: text };
}
