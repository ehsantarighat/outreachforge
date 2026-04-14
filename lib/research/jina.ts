const JINA_BASE = process.env.JINA_READER_BASE_URL ?? "https://r.jina.ai";
const MAX_CHARS = 6000;

/**
 * Fetch a URL as clean markdown via Jina Reader.
 * Returns empty string on any error or timeout.
 */
export async function fetchWithJina(url: string): Promise<string> {
  try {
    const res = await fetch(`${JINA_BASE}/${url}`, {
      headers: {
        Accept: "text/markdown",
        "X-Timeout": "10",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, MAX_CHARS);
  } catch {
    return "";
  }
}
