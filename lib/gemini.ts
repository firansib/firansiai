import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

  const model = genAI.getGenerativeModel({
    model: hasImage ? "gemini-1.5-pro" : "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build history (all except last message)
  const history = messages.slice(0, -1).reduce((acc, m) => {
    const geminiRole = m.role === "assistant" ? "model" : "user";
    if (acc.length > 0 && acc[acc.length - 1].role === geminiRole) {
      acc[acc.length - 1].parts[0].text += "\n" + m.content;
    } else {
      acc.push({ role: geminiRole, parts: [{ text: m.content }] });
    }
    return acc;
  }, [] as { role: "user" | "model"; parts: { text: string }[] }[]);

  // Remove leading model messages
  while (history.length > 0 && history[0].role !== "user") {
    history.shift();
  }

  const chat = model.startChat({ history });

  // Build last message content
  if (hasImage && lastMsg.imageBase64) {
    const result = await chat.sendMessage([
      { text: lastMsg.content || "What is in this image?" },
      {
        inlineData: {
          mimeType: lastMsg.imageMime || "image/jpeg",
          data: lastMsg.imageBase64,
        },
      },
    ]);
    return result.response.text();
  }

  const result = await chat.sendMessage(lastMsg.content);
  return result.response.text();
}
