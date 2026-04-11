import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function getChatCompletion(messages: ChatMessage[]): Promise<string> {
  const systemMessage: ChatMessage = {
    role: "system",
    content: `You are AI Media Assistant, an intelligent assistant that helps users with questions, 
    analysis, and provides up-to-date information. You are knowledgeable, helpful, and concise. 
    When discussing news or current events, clearly indicate if information may be from your training data 
    and suggest users verify with current sources. Format responses using markdown when appropriate.`,
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";
}

export default openai;
