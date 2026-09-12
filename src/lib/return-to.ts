const DEFAULT_RETURN_TO = "/app";

/**
 * `returnTo` arrives from the query string and ends up in a redirect, so it has
 * to be a same-origin path — anything else is an open redirect. Protocol-relative
 * URLs ("//evil.com") and backslash variants are the cases worth remembering.
 */
export function safeReturnTo(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !candidate.startsWith("/")) {
    return DEFAULT_RETURN_TO;
  }

  if (candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return DEFAULT_RETURN_TO;
  }

  return candidate;
}
