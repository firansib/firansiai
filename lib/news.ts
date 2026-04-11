export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

// Fetch latest news from NewsAPI
export async function fetchLatestNews(query: string): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey || apiKey === "your_newsapi_key_here") {
    return getMockNews(query);
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return getMockNews(query);

    const data = await res.json();
    return (data.articles || []).slice(0, 3).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt,
    }));
  } catch {
    return getMockNews(query);
  }
}

// Detect if a message is asking about news/current events
export function isNewsQuery(message: string): boolean {
  const newsKeywords = [
    "news", "latest", "recent", "today", "current", "update",
    "happening", "breaking", "headline", "media", "report",
    "2024", "2025", "2026", "this week", "this month",
  ];
  const lower = message.toLowerCase();
  return newsKeywords.some((kw) => lower.includes(kw));
}

// Format news articles into a readable string for the AI context
export function formatNewsContext(articles: NewsArticle[]): string {
  if (!articles.length) return "";
  const lines = articles.map(
    (a, i) =>
      `${i + 1}. **${a.title}** (${a.source}, ${new Date(a.publishedAt).toLocaleDateString()})\n   ${a.description ?? ""}`
  );
  return `\n\n---\n**Recent News Context:**\n${lines.join("\n\n")}`;
}

function getMockNews(query: string): NewsArticle[] {
  return [
    {
      title: `Latest developments in ${query}`,
      description: `Recent updates and analysis on ${query} from leading media sources.`,
      url: "https://example.com/news/1",
      source: "Media Today",
      publishedAt: new Date().toISOString(),
    },
    {
      title: `${query}: What experts are saying`,
      description: `Industry experts weigh in on the latest trends surrounding ${query}.`,
      url: "https://example.com/news/2",
      source: "Tech Insights",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
}
