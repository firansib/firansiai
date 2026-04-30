import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion, ChatMessage } from "@/lib/groq";
import { webSearch, formatSearchContext, needsWebSearch } from "@/lib/websearch";
import { extractTextFromPDF } from "@/lib/pdfparser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      messages,
      latestMessage,
      imageBase64,
      imageMime,
    }: {
      messages: ChatMessage[];
      latestMessage: string;
      imageBase64?: string;
      imageMime?: string;
    } = body;

    // ✅ Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages must be an array" },
        { status: 400 }
      );
    }

    let enrichedMessages: ChatMessage[] = [...messages];

    // =========================================
    // ✅ HANDLE PDF INPUT
    // =========================================
    if (imageBase64 && imageMime === "application/pdf") {
      try {
        const pdfText = await extractTextFromPDF(imageBase64);

        enrichedMessages = messages.map((m, i) => {
          if (i === messages.length - 1 && m.role === "user") {
            return {
              ...m,
              content: `${m.content || "Analyze this PDF document."}

--- PDF CONTENT START ---
${pdfText}
--- PDF CONTENT END ---`,
              imageBase64: undefined,
              imageMime: undefined,
            };
          }
          return m;
        });

      } catch (pdfError) {
        console.error("PDF parse error:", pdfError);
        return NextResponse.json(
          { error: "Failed to read PDF file" },
          { status: 500 }
        );
      }
    }

    // =========================================
    // ✅ HANDLE IMAGE INPUT (KEEP IN MEMORY)
    // =========================================
    else if (imageBase64 && imageMime?.startsWith("image/")) {
      enrichedMessages = messages.map((m, i) => {
        if (i === messages.length - 1 && m.role === "user") {
          return {
            ...m,
            imageBase64,
            imageMime,
          };
        }
        return m;
      });
    }

    // =========================================
    // ✅ HANDLE WEB SEARCH (SMART TRIGGER)
    // =========================================
    else if (latestMessage && needsWebSearch(latestMessage)) {
      try {
        const searchResults = await webSearch(latestMessage);
        const searchContext = formatSearchContext(
          searchResults,
          latestMessage
        );

        enrichedMessages = messages.map((m, i) => {
          if (i === messages.length - 1 && m.role === "user") {
            return {
              ...m,
              content: `${m.content}\n\n${searchContext}`,
            };
          }
          return m;
        });
      } catch (searchError) {
        console.error("Search error:", searchError);
        // Continue without breaking AI
      }
    }

    // =========================================
    // ✅ CALL AI MODEL
    // =========================================
    const aiResponse = await getChatCompletion(enrichedMessages);

    // =========================================
    // ✅ RETURN RESPONSE WITH MEMORY SUPPORT
    // =========================================
    return NextResponse.json({
      response: aiResponse,
      messages: enrichedMessages, // 🔥 send back updated history
    });

  } catch (error: any) {
    console.error("Chat API error:", error);

    const msg = error?.message || "Unknown error";

    if (msg.includes("401") || msg.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid API key." },
        { status: 401 }
      );
    }

    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // 🔥 RETURN REAL ERROR FOR DEBUGGING
    return NextResponse.json(
      {
        error: msg,
        debug: error?.stack || "No stack trace",
      },
      { status: 500 }
    );
  }
}