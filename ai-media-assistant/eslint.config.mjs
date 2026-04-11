import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;


import Groq from "groq-sdk";

export async function POST(req) {
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const body = await req.json();

  const response = await client.chat.completions.create({
    messages: body.messages,
    model: "llama-3.1-70b-versatile",
  });

  return Response.json(response);
}