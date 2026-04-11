export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Uses DuckDuckGo instant answer API (no key needed)
export async function webSearch(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];

    const data = await res.json();
    const results: SearchResult[] = [];

    // Abstract (main answer)
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || "",
        snippet: data.AbstractText,
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.slice(0, 60),
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    return results.slice(0, 4);
  } catch {
    return [];
  }
}

export function formatSearchContext(results: SearchResult[], query: string): string {
  if (!results.length) return "";
  const lines = results
    .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.url}`)
    .join("\n\n");
  return `\n\n---\n**Web Search Results for "${query}":**\n${lines}\n\nUse the above search results to give an accurate, up-to-date answer. Cite the sources.`;
}

// Detect if query needs web search
export function needsWebSearch(message: string): boolean {
  const keywords = [
    "latest", "recent", "today", "current", "now", "news",
    "2024", "2025", "2026", "this week", "this month", "update",
    "what is", "who is", "how to", "price of", "weather",
    "score", "result", "happening", "trending",
  ];
  const lower = message.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}
