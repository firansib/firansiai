import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { url, question } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Could not access page (${response.status}). The site may block automated access.` }, { status: 400 });
    }

    const html = await response.text();

    // Extract clean text from HTML
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    if (!text || text.length < 30) {
      return NextResponse.json({ error: "Could not extract content. This page may require login or JavaScript." }, { status: 400 });
    }

    const userQuestion = question ? `\n\nUser's specific question: ${question}` : "";

    const prompt = `You are Firansi AI analyzing a webpage. Read the content carefully and provide a comprehensive analysis.

URL: ${url}${userQuestion}

Webpage Content:
${text}

Provide:
**🌐 Page:** ${url}
**📄 Type:** [news/blog/social/product/docs/other]
**📝 Summary:** [3-5 clear sentences]
**🔑 Key Points:**
- [main point 1]
- [main point 2]  
- [main point 3]
- [more if needed]
**📌 Important Details:** [names, dates, numbers, facts]
**🔍 Keywords:** [5-10 keywords]
**💡 Insight:** [why this matters to the user]

${question ? `**❓ Answer to your question:** [direct answer to: ${question}]` : ""}`;

    const analysis = await getChatCompletion([{ role: "user", content: prompt }]);
    return NextResponse.json({ analysis, url });
  } catch (error: any) {
    if (error.name === "TimeoutError") {
      return NextResponse.json({ error: "Page took too long to load. Try a different URL." }, { status: 408 });
    }
    return NextResponse.json({ error: error.message ?? "Failed to read webpage" }, { status: 500 });
  }
}
