import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function GET() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
  try {
    const groq = new Groq({ apiKey: key });
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say hello in one word." }],
      max_tokens: 10,
    });
    return NextResponse.json({ success: true, response: res.choices[0]?.message?.content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
