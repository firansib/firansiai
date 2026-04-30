import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion } from "@/lib/groq";

/**
 * POST /api/pdf
 * Accepts: { topic, content? }
 * Returns: { content, topic }
 *
 * - Generates structured document content via AI
 * - Frontend uses jsPDF to render and download
 */
export async function POST(req: NextRequest) {
  try {
    const { topic, content } = await req.json();

    if (!topic && !content) {
      return NextResponse.json({ error: "topic or content is required" }, { status: 400 });
    }

    let documentContent = content;

    // ── Generate content if not provided ─────────────────────────
    if (!documentContent) {
      documentContent = await getChatCompletion([{
        role: "user",
        content: `Write a detailed, well-structured document about: "${topic}"

Format requirements:
- Start with a clear title
- Include an introduction
- Use clear section headings (##)
- Include key points and explanations
- End with a conclusion
- Use plain text, no markdown symbols in the final output

Write the full document now:`,
      }]);
    }

    return NextResponse.json({
      content: documentContent,
      topic: topic || "Document",
    });

  } catch (error: any) {
    console.error("[/api/pdf] Error:", error?.message);
    return NextResponse.json({ error: "PDF generation failed. Please try again." }, { status: 500 });
  }
}
