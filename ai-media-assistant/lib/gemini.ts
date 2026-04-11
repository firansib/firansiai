import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getChatCompletion(messages: ChatMessage[]): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    systemInstruction: `You are Firansi AI, an intelligent assistant that helps users with 
    questions, analysis, and provides up-to-date information. You are knowledgeable, helpful, and concise. 
    When discussing news or current events, clearly indicate if information may be from your training data 
    and suggest users verify with current sources. Format responses using markdown when appropriate.`,
  });

  // Gemini requires history to alternate user/model and start with user
  // Separate history (all but last) from the current message
  const allButLast = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  // Build valid alternating history — must start with user and alternate
  const history: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const msg of allButLast) {
    const geminiRole = msg.role === "assistant" ? "model" : "user";
    // Skip if same role as last added (Gemini requires alternating)
    if (history.length > 0 && history[history.length - 1].role === geminiRole) {
      // Merge content instead
      history[history.length - 1].parts[0].text += "\n" + msg.content;
    } else {
      history.push({ role: geminiRole, parts: [{ text: msg.content }] });
    }
  }

  // History must start with "user" role — if it starts with model, remove it
  while (history.length > 0 && history[0].role !== "user") {
    history.shift();
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}
