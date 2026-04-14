export interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
}

/**
 * Search the web via Tavily. Returns up to maxResults results.
 * Gracefully returns [] if TAVILY_API_KEY is not set or if the request fails.
 */
export async function tavilySearch(
  query: string,
  maxResults = 5
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("TAVILY_API_KEY not set — skipping web search for:", query);
    return [];
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error("Tavily error:", res.status, await res.text());
      return [];
    }

    const data = (await res.json()) as { results?: TavilyResult[] };
    return data.results ?? [];
  } catch (err) {
    console.error("Tavily fetch failed:", err);
    return [];
  }
}
