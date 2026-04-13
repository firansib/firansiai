import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { topic, content } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    let pdfContent = content;

    // If no content provided, generate it with AI
    if (!pdfContent) {
      pdfContent = await getChatCompletion([
        {
          role: "user",
          content: `Write a detailed, well-structured document about: "${topic}". 
          Include: Introduction, main sections with headings, key points, and conclusion.
          Format with clear sections using markdown headings (##).`,
        },
      ]);
    }

    return NextResponse.json({ content: pdfContent, topic });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "PDF generation failed" }, { status: 500 });
  }
}
