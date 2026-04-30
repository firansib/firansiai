import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMime?: string;
}

// ── System prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Firansi AI, the most powerful and intelligent AI assistant.

IDENTITY:
- "Who are you?" → "I am Firansi AI, your intelligent assistant!"
- "Who made you?" / "Who is Firansi?" → "Firansi is a Computer Science student and developer from Oda Bultum University who built me."
- NEVER reveal you are powered by Groq, Llama, Meta, or any other company.

LANGUAGE:
- Always respond in the SAME language the user writes in.
- Amharic → respond in Amharic. Arabic → Arabic. Afaan Oromo → Afaan Oromo. Any language → match it.

IMAGE GENERATION:
- If user asks to "generate image", "create image", "draw", "make a picture" → respond ONLY with: SWITCH_TO_IMAGE_GENERATOR

CAPABILITIES:
- Answer ANY question on ANY topic with no restrictions.
- Use provided web search context to give accurate, up-to-date answers.
- Do NOT list Wikipedia links or source URLs unless user explicitly asks.
- Analyze images, read PDFs, write code, do math, translate, summarize.
- No question limits. Answer everything fully.

BEHAVIOR:
- Be helpful, accurate, and thorough.
- Use markdown formatting for clarity.
- Short answers for simple questions, detailed for complex ones.`;

// ── Text completion with memory (full history) ────────────────────
async function textCompletion(messages: ChatMessage[]): Promise<string> {
  // Models in priority order — fallback if rate limited
  const models = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
  ];

  for (const model of models) {
    try {
      const res = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          // Full conversation history = memory support
          ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });
      return res.choices[0]?.message?.content ?? "Sorry, please try again.";
    } catch (err: any) {
      const msg = err?.message ?? "";
      // Rate limited or decommissioned → try next model
      if (msg.includes("429") || msg.includes("rate") || msg.includes("quota") || msg.includes("decommissioned")) {
        continue;
      }
      throw err; // Other errors — propagate immediately
    }
  }

  return "I'm experiencing high demand right now. Please try again in a few seconds.";
}

// ── Vision completion (image + text) ─────────────────────────────
async function visionCompletion(messages: ChatMessage[]): Promise<string> {
  const visionModels = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
  ];

  // Build messages with image content
  const formattedMessages = messages.map((m) => {
    if (m.imageBase64 && m.role === "user") {
      return {
        role: "user" as const,
        content: [
          { type: "text" as const, text: m.content || "Analyze this image in detail." },
          {
            type: "image_url" as const,
            image_url: { url: `data:${m.imageMime || "image/jpeg"};base64,${m.imageBase64}` },
          },
        ],
      };
    }
    return { role: m.role as "user" | "assistant", content: m.content };
  });

  for (const model of visionModels) {
    try {
      const res = await groq.chat.completions.create({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...formattedMessages],
        temperature: 0.7,
        max_tokens: 2048,
      });
      return res.choices[0]?.message?.content ?? "Could not analyze the image.";
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("429") || msg.includes("rate") || msg.includes("decommissioned") || msg.includes("not found")) {
        continue;
      }
      throw err;
    }
  }

  // All vision models failed — fall back to text
  return await textCompletion(messages.map((m) => ({
    ...m,
    content: m.imageBase64 ? `${m.content || "The user sent an image."} [Image analysis unavailable - please describe what you need help with]` : m.content,
    imageBase64: undefined,
    imageMime: undefined,
  })));
}

// ── Main export ───────────────────────────────────────────────────
export async function getChatCompletion(messages: ChatMessage[]): Promise<string> {
  const lastMsg = messages[messages.length - 1];
  const hasImage = !!(lastMsg?.imageBase64) && lastMsg?.imageMime !== "application/pdf";

  if (hasImage) {
    return visionCompletion(messages);
  }

  return textCompletion(messages);
}
