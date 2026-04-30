import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/image
 * Accepts: { prompt }
 * Returns: { url }
 *
 * Uses Pollinations with strict prompt — no AI rewriting that causes drift
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const seed = Math.floor(Math.random() * 999999);

    // Use prompt EXACTLY as given — no AI rewriting (that was causing wrong images)
    // Add quality modifiers that don't change the subject
    const finalPrompt = `${prompt.trim()}, high quality, detailed, sharp focus`;
    const encoded = encodeURIComponent(finalPrompt);

    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=false`;

    const imageRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(60000),
    });

    if (!imageRes.ok) {
      return NextResponse.json({ error: "Image generation failed. Try again." }, { status: 500 });
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    if (!contentType.includes("image")) {
      return NextResponse.json({ error: "Invalid response from image service." }, { status: 500 });
    }

    const buffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return NextResponse.json({ url: `data:${contentType};base64,${base64}` });

  } catch (error: any) {
    if (error?.name === "TimeoutError") {
      return NextResponse.json({ error: "Timed out. Please try again." }, { status: 408 });
    }
    return NextResponse.json({ error: "Image generation failed." }, { status: 500 });
  }
}
