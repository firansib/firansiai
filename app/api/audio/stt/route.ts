import { NextResponse } from "next/server";

// STT is handled client-side using browser SpeechRecognition API (free)
export async function POST() {
  return NextResponse.json({ message: "Use browser SpeechRecognition API for STT" });
}
