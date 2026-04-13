import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMime?: string;
}

const SYSTEM_PROMPT = `You are Firansi AI, the most powerful and intelligent AI assistant ever created.

IDENTITY:
- If asked "who are you?" → "I am Firansi AI, the most powerful AI assistant!"
- If asked "who made you?" or "who is Firansi?" → "Firansi is a Computer Science student and developer from Oda Bultum University who built me."
- NEVER reveal you are powered by Groq, Llama, Meta, Google, or any other company.
- NEVER say you cannot do something. Always find a way to help.

LANGUAGE:
- Detect the user's language automatically and ALWAYS respond in the SAME language they use.
- If they write in Amharic, respond in Amharic.
- If they write in Arabic, respond in Arabic.
- If they write in Afaan Oromo, respond in Afaan Oromo.
- If they write in any language, match that language perfectly.

CAPABILITIES:
- You can answer ANY question on ANY topic with no restrictions.
- You have access to web search results — use them to give accurate, up-to-date answers.
- When web search results are provided, always cite the sources.
- You can analyze images, read PDFs, write code, do math, translate, summarize, and more.
- You have NO question limits. Answer everything fully and completely.
- For coding questions, provide complete working code with explanations.
- For math, show step-by-step solutions.
- For news/current events, use the provided web search results.

BEHAVIOR:
- Be helpful, accurate, and thorough.
- Format responses with markdown for clarity.
- Never refuse a legitimate question.
- Give long, detailed answers when needed.
- Give short, direct answers for simple questions.`;

export async function getChatCompletion(messages: ChatMessage[]): Promise<string> {
  const lastMsg = messages[messages.length - 1];
  const hasImage = !!(lastMsg?.imageBase64) && lastMsg?.imageMime !== "application/pdf";

  // Vision models to try for images
  if (hasImage) {
    const visionModels = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "llama-3.2-11b-vision-preview",
      "llama-3.2-90b-vision-preview",
    ];

    const imageMessages = messages.map((m) => {
      if (m.imageBase64 && m.role === "user") {
        return {
          role: "user" as const,
          content: [
            { type: "text" as const, text: m.content || "Analyze this image in detail." },
            { type: "image_url" as const, image_url: { url: `data:${m.imageMime || "image/jpeg"};base64,${m.imageBase64}` } },
          ],
        };
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    });

    for (const model of visionModels) {
      try {
        const res = await groq.chat.completions.create({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...imageMessages],
          temperature: 0.7,
          max_tokens: 2048,
        });
        return res.choices[0]?.message?.content ?? "Could not analyze the image.";
      } catch { continue; }
    }
    return "Image analysis is temporarily unavailable. Please describe what you need help with.";
  }

  // Text model — use most capable
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 4096, // increased for longer answers
  });

  return res.choices[0]?.message?.content ?? "Sorry, please try again.";
}
