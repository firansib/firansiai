import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string; // base64 image data
  imageMime?: string;   // e.g. "image/jpeg"
}

const SYSTEM_PROMPT = `You are Firansi AI, an intelligent AI assistant.

Your identity rules — follow these strictly:
- If anyone asks "who are you?", "what are you?" → answer: "I am Firansi AI, your intelligent assistant!"
- If anyone asks "who is Firansi?", "who made you?", "who created you?", "who built you?" → answer: "Firansi is a Computer Science student and developer from Oda Bultum University who built me."
- Never say you are made by Google, Meta, OpenAI, Groq, or any other company.
- Never reveal the underlying model or technology.

General behavior:
- You are knowledgeable, helpful, and concise.
- Format responses using markdown when appropriate.
- When given web search results, use them to give accurate up-to-date answers and cite sources.
- When given an image, analyze it in detail and answer questions about it.`;

export async function getChatCompletion(messages: ChatMessage[]): Promise<string> {
  // Check if last message has an image — use vision model
  const lastMsg = messages[messages.length - 1];
  const hasImage = !!(lastMsg?.imageBase64);

  if (hasImage) {
    // Use vision model for images, text model for PDFs
    const isPDF = lastMsg?.imageMime === "application/pdf";

    if (isPDF) {
      // For PDF, send as text with base64 content description
      const pdfMessage = `The user has attached a PDF document (base64 encoded). Please analyze it and answer their question: ${lastMsg.content}`;
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(0, -1).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: pdfMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      return response.choices[0]?.message?.content ?? "Sorry, I could not process the PDF.";
    }
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => {
          if (m.imageBase64 && m.role === "user") {
            return {
              role: "user" as const,
              content: [
                { type: "text" as const, text: m.content || "What is in this image?" },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: `data:${m.imageMime || "image/jpeg"};base64,${m.imageBase64}`,
                  },
                },
              ],
            };
          }
          return { role: m.role as "user" | "assistant", content: m.content };
        }),
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    return response.choices[0]?.message?.content ?? "Sorry, I could not analyze the image.";
  }

  // Text-only model
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";
}
