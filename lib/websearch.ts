export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

// Powerful multi-source web search
export async function webSearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Run all searches in parallel for speed
  const [wikiSummary, wikiSearch, ddg] = await Promise.allSettled([
    fetchWikiSummary(query),
    fetchWikiSearch(query),
    fetchDuckDuckGo(query),
  ]);

  if (wikiSummary.status === "fulfilled" && wikiSummary.value) results.push(wikiSummary.value);
  if (ddg.status === "fulfilled") results.push(...ddg.value);
  if (wikiSearch.status === "fulfilled") {
    for (const r of wikiSearch.value) {
      if (!results.find((x) => x.title === r.title)) results.push(r);
    }
  }

  return results.slice(0, 6);
}

async function fetchWikiSummary(query: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.extract || data.type === "disambiguation") return null;
    return {
      title: data.title,
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      snippet: data.extract.slice(0, 600),
      source: "Wikipedia",
    };
  } catch { return null; }
}

async function fetchWikiSearch(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=4&origin=*`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.query?.search ?? []).map((item: any) => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
      snippet: item.snippet.replace(/<[^>]+>/g, "").slice(0, 400),
      source: "Wikipedia",
    }));
  } catch { return []; }
}

async function fetchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results: SearchResult[] = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || "",
        snippet: data.AbstractText.slice(0, 500),
        source: data.AbstractSource || "DuckDuckGo",
      });
    }
    for (const topic of (data.RelatedTopics ?? []).slice(0, 3)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.slice(0, 80),
          url: topic.FirstURL,
          snippet: topic.Text.slice(0, 350),
          source: "DuckDuckGo",
        });
      }
    }
    return results;
  } catch { return []; }
}

export function formatSearchContext(results: SearchResult[], query: string): string {
  if (!results.length) return "";
  const lines = results
    .map((r, i) => `[${i + 1}] **${r.title}** (${r.source})\n${r.snippet}\nSource: ${r.url}`)
    .join("\n\n");
  return `\n\n---\n**🔍 Real-time Web Search Results for: "${query}"**\n\n${lines}\n\n---\nUse the above search results to give an accurate, up-to-date answer. Always cite sources with [1], [2], etc.`;
}

// Search for almost everything except very simple greetings
export function needsWebSearch(message: string): boolean {
  const lower = message.toLowerCase().trim();
  if (lower.length < 4) return false;
  const skip = ["hi", "hello", "hey", "thanks", "ok", "bye", "yes", "no", "who are you", "what are you"];
  if (skip.includes(lower)) return false;
  return true;
}
