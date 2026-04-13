import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const aiResponse = await getChatCompletion([
      {
        role: "user",
        content: `Create a PowerPoint presentation outline for: "${topic}".
        Return ONLY valid JSON in this exact format, no other text:
        {
          "title": "Presentation Title",
          "slides": [
            { "title": "Slide Title", "points": ["point 1", "point 2", "point 3"] }
          ]
        }
        Include 6-8 slides with 3-5 bullet points each.`,
      },
    ]);

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to generate presentation structure");

    const slides = JSON.parse(jsonMatch[0]);
    return NextResponse.json(slides);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "PPT generation failed" }, { status: 500 });
  }
}
