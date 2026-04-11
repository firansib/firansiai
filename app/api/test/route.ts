import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function GET() {
  const key = process.env.GROQ_API_KEY;

  if (!key || key.includes("your_")) {
    return NextResponse.json({ error: "GROQ_API_KEY is missing in .env.local" }, { status: 500 });
  }

  try {
    const groq = new Groq({ apiKey: key });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say hello in one word." }],
      max_tokens: 10,
    });
    const text = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({ success: true, response: text, keyPrefix: key.slice(0, 8) + "..." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, keyPrefix: key.slice(0, 8) + "..." }, { status: 500 });
  }
}
