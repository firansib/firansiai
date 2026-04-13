"use client";

import { useState } from "react";
import { Code2, Loader2, Copy, Check, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LANGUAGES = ["JavaScript", "Python", "TypeScript", "Java", "C++", "Go", "Rust", "SQL", "HTML/CSS"];
const TASKS = ["Write code", "Explain code", "Debug code", "Optimize code", "Convert code"];

export default function CodexPanel() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [task, setTask] = useState("Write code");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are an expert ${language} developer. Task: ${task}\n\n${prompt}\n\nProvide clean, well-commented code with explanation.`,
          }],
          latestMessage: prompt,
        }),
      });
      const data = await response.json();
      setResult(data.response ?? "Failed to generate code");
    } catch {
      setResult("Error generating code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#212121] p-6">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Codex</h1>
            <p className="text-gray-500 text-sm">AI-powered coding assistant</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500"
          >
            {LANGUAGES.map((l) => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
          </select>
          <select
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500"
          >
            {TASKS.map((t) => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
          </select>
        </div>

        {/* Input */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build or paste your code here..."
          rows={4}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
        />

        <button
          onClick={generate}
          disabled={!prompt.trim() || loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate Code"}
        </button>

        {/* Result */}
        {result && (
          <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-gray-400 text-xs font-medium">Result</span>
              <button onClick={copy} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors">
                {copied ? <><Check className="w-3 h-3 text-green-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[400px]">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
