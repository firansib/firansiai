import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion, ChatMessage } from "@/lib/groq";
import { webSearch, formatSearchContext, needsWebSearch } from "@/lib/websearch";
import { extractTextFromPDF } from "@/lib/pdfparser";

/**
 * POST /api/chat
 * Accepts: { messages, latestMessage, imageBase64?, imageMime? }
 * Returns: { response }
 *
 * - Full conversation history sent to AI (memory support)
 * - Web search injected as silent context
 * - Image vision support
 * - PDF text extraction support
 */
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
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    if (!latestMessage && !imageBase64) {
      return NextResponse.json({ error: "latestMessage or imageBase64 is required" }, { status: 400 });
    }

    let enrichedMessages: ChatMessage[] = [...messages];

    // ── PDF: extract text and inject as context ──────────────────
    if (imageBase64 && imageMime === "application/pdf") {
      const pdfText = await extractTextFromPDF(imageBase64);
      enrichedMessages = messages.map((m, i) =>
        i === messages.length - 1 && m.role === "user"
          ? {
              ...m,
              content: `${m.content || "Analyze this PDF document."}\n\n---\n**PDF Content:**\n${pdfText}`,
              imageBase64: undefined,
              imageMime: undefined,
            }
          : m
      );
    }

    // ── Image: pass base64 to vision model ───────────────────────
    else if (imageBase64) {
      enrichedMessages = messages.map((m, i) =>
        i === messages.length - 1 && m.role === "user"
          ? { ...m, imageBase64, imageMime }
          : m
      );
    }

    // ── Text: inject web search context silently ─────────────────
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
        // Search failed — continue without it, never block the response
      }
    }

    // ── Call AI with full conversation history (memory) ──────────
    const aiResponse = await getChatCompletion(enrichedMessages);

    // Handle image generator redirect signal
    if (aiResponse.trim() === "SWITCH_TO_IMAGE_GENERATOR") {
      return NextResponse.json({ response: "SWITCH_TO_IMAGE_GENERATOR" });
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    console.error("[/api/chat] Error:", error?.message);
    const msg = error?.message ?? "";

    if (msg.includes("401") || msg.includes("API key")) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }
    if (msg.includes("429") || msg.includes("rate") || msg.includes("quota")) {
      return NextResponse.json({ error: "Rate limit reached. Please wait a moment." }, { status: 429 });
    }
    return NextResponse.json({ error: "AI service error. Please try again." }, { status: 500 });
  }
}
