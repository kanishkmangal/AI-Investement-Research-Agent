export interface SearchResult {
  title: string;
  url: string;
  content: string;
  snippet?: string;
}

/**
 * Searches the web using Tavily API (preferred) or SerpAPI (fallback).
 */
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const serpapiKey = process.env.SERPAPI_API_KEY;

  if (!tavilyKey && !serpapiKey) {
    console.warn("No search API keys found. Web search will return empty results.");
    return [];
  }

  if (tavilyKey) {
    try {
      console.log(`[Search] Querying Tavily API for: "${query}"`);
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: query,
          search_depth: "basic",
          max_results: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.results)) {
        return data.results.map((r: any) => ({
          title: r.title || "No Title",
          url: r.url || "",
          content: r.content || r.snippet || "",
          snippet: r.snippet || r.content || "",
        }));
      }
    } catch (error) {
      console.error("[Search] Tavily search failed, checking for SerpAPI fallback:", error);
    }
  }

  // Fallback to SerpAPI
  if (serpapiKey) {
    try {
      console.log(`[Search] Querying SerpAPI for: "${query}"`);
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.append("q", query);
      url.searchParams.append("api_key", serpapiKey);
      url.searchParams.append("engine", "google");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`SerpAPI request failed with status ${response.status}`);
      }

      const data = await response.json();
      const organicResults = data.organic_results;
      if (Array.isArray(organicResults)) {
        return organicResults.slice(0, 5).map((r: any) => ({
          title: r.title || "No Title",
          url: r.link || "",
          content: r.snippet || "",
          snippet: r.snippet || "",
        }));
      }
    } catch (error) {
      console.error("[Search] SerpAPI search failed:", error);
    }
  }

  return [];
}
