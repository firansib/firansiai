import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMime?: string;
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
  const lastMsg = messages[messages.length - 1];
  const hasImage = !!lastMsg?.imageBase64;

  const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
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
      return {
        role: m.role as "user" | "assistant",
        content: m.content,
      };
    }),
  ];

  const response = await openai.chat.completions.create({
    model: hasImage ? "gpt-4o" : "gpt-4o-mini",
    messages: formattedMessages,
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";
}
