import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion, ChatMessage } from "@/lib/groq";
import { webSearch, formatSearchContext, needsWebSearch } from "@/lib/websearch";
import { extractTextFromPDF } from "@/lib/pdfparser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, latestMessage, imageBase64, imageMime } = body as {
      messages: ChatMessage[];
      latestMessage: string;
      imageBase64?: string;
      imageMime?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    let enrichedMessages: ChatMessage[] = [...messages];

    // Handle PDF — extract text and inject into message
    if (imageBase64 && imageMime === "application/pdf") {
      const pdfText = await extractTextFromPDF(imageBase64);
      enrichedMessages = messages.map((m, i) => {
        if (i === messages.length - 1 && m.role === "user") {
          return {
            ...m,
            content: `${m.content || "Please analyze this PDF document."}\n\n---\n**PDF Document Content:**\n${pdfText}`,
            imageBase64: undefined,
            imageMime: undefined,
          };
        }
        return m;
      });
    }
    // Handle image
    else if (imageBase64) {
      enrichedMessages = messages.map((m, i) => {
        if (i === messages.length - 1 && m.role === "user") {
          return { ...m, imageBase64, imageMime };
        }
        return m;
      });
    }
    // Handle web search for text-only messages
    else if (needsWebSearch(latestMessage)) {
      const searchResults = await webSearch(latestMessage);
      const searchContext = formatSearchContext(searchResults, latestMessage);
      enrichedMessages = messages.map((m, i) => {
        if (i === messages.length - 1 && m.role === "user") {
          return { ...m, content: m.content + searchContext };
        }
        return m;
      });
    }

    const aiResponse = await getChatCompletion(enrichedMessages);

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error("Chat API error:", error);
    const msg = error?.message ?? "";
    if (msg.includes("401") || msg.includes("API key")) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again." }, { status: 429 });
    }
    return NextResponse.json({ error: `Error: ${msg || "Please try again."}` }, { status: 500 });
  }
}
