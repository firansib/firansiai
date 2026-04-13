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
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let enrichedMessages: ChatMessage[] = [...messages];

    // PDF — extract text
    if (imageBase64 && imageMime === "application/pdf") {
      const pdfText = await extractTextFromPDF(imageBase64);
      enrichedMessages = messages.map((m, i) =>
        i === messages.length - 1 && m.role === "user"
          ? { ...m, content: `${m.content || "Analyze this PDF document."}\n\n---\n**PDF Content:**\n${pdfText}`, imageBase64: undefined, imageMime: undefined }
          : m
      );
    }
    // Image — pass to vision model
    else if (imageBase64) {
      enrichedMessages = messages.map((m, i) =>
        i === messages.length - 1 && m.role === "user"
          ? { ...m, imageBase64, imageMime }
          : m
      );
    }
    // Text — always search web for better answers
    else if (needsWebSearch(latestMessage)) {
      try {
        const results = await webSearch(latestMessage);
        if (results.length > 0) {
          const context = formatSearchContext(results, latestMessage);
          enrichedMessages = messages.map((m, i) =>
            i === messages.length - 1 && m.role === "user"
              ? { ...m, content: m.content + context }
              : m
          );
        }
      } catch {
        // Search failed — continue without it
      }
    }

    const aiResponse = await getChatCompletion(enrichedMessages);

    // Check if AI wants to switch to image generator
    if (aiResponse.trim() === "SWITCH_TO_IMAGE_GENERATOR") {
      return NextResponse.json({ response: "SWITCH_TO_IMAGE_GENERATOR" });
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error("Chat error:", error);
    const msg = error?.message ?? "";
    if (msg.includes("401") || msg.includes("API key")) {
      return NextResponse.json({ error: "Invalid API key. Check your .env.local file." }, { status: 401 });
    }
    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
    }
    return NextResponse.json({ error: `Error: ${msg || "Please try again."}` }, { status: 500 });
  }
}
