import { NextResponse } from "next/server";

// TTS is handled client-side using Web Speech API
// This route just confirms the feature is available
export async function POST() {
  return NextResponse.json({ message: "Use browser Web Speech API for TTS" });
}
