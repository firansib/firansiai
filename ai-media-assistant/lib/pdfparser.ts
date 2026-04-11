import { extractText } from "unpdf";

export async function extractTextFromPDF(base64: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64, "base64");
    const uint8Array = new Uint8Array(buffer);
    const { text } = await extractText(uint8Array, { mergePages: true });
    const cleaned = text?.trim();
    if (!cleaned) return "The PDF appears to be empty or contains only images with no readable text.";
    // Limit to 8000 chars to stay within token limits
    return cleaned.length > 8000
      ? cleaned.slice(0, 8000) + "\n\n[Document truncated due to length...]"
      : cleaned;
  } catch (err: any) {
    return `Could not extract text from PDF: ${err.message}`;
  }
}
