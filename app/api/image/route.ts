import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    // Use AI to enhance and rewrite the prompt for better results
    const enhancedPrompt = await getChatCompletion([{
      role: "user",
      content: `You are an expert image prompt engineer. Rewrite this image prompt to be more detailed and descriptive for an AI image generator. 
      - If the prompt mentions a real person by name, describe their appearance, style, and context instead of using their name
      - Add artistic style, lighting, quality descriptors
      - Keep it under 200 characters
      - Return ONLY the improved prompt, nothing else
      
      Original prompt: "${prompt}"`,
    }]);

    const finalPrompt = enhancedPrompt.trim().replace(/^["']|["']$/g, "");

    const seed = Math.floor(Math.random() * 999999);
    const encoded = encodeURIComponent(finalPrompt);

    // Try multiple Pollinations models
    const models = ["flux", "flux-realism", "turbo"];
    let imageBuffer: ArrayBuffer | null = null;
    let contentType = "image/jpeg";

    for (const model of models) {
      try {
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&model=${model}&nologo=true&enhance=true`;
        const imageRes = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          signal: AbortSignal.timeout(55000),
        });

        if (imageRes.ok) {
          const ct = imageRes.headers.get("content-type") || "";
          // Make sure it's actually an image, not an error JSON
          if (ct.includes("image")) {
            imageBuffer = await imageRes.arrayBuffer();
            contentType = ct;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!imageBuffer) {
      return NextResponse.json({ error: "Image generation failed. Please try a more descriptive prompt." }, { status: 500 });
    }

    const base64 = Buffer.from(imageBuffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ url: dataUrl, enhancedPrompt: finalPrompt });
  } catch (error: any) {
    if (error.name === "TimeoutError") {
      return NextResponse.json({ error: "Image generation timed out. Please try again." }, { status: 408 });
    }
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: 500 });
  }
}
