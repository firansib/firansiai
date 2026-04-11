"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/firestore";
import { NewsArticle } from "@/lib/news";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import NewsCard from "./NewsCard";
import { Sparkles, Zap, Globe, BookOpen, TrendingUp } from "lucide-react";

interface ChatViewProps {
  chatId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  newsArticles: NewsArticle[] | null;
  onSend: (message: string, imageBase64?: string, imageMime?: string) => void;
}

const SUGGESTIONS = [
  { icon: TrendingUp, text: "What's happening in tech news today?", color: "text-violet-400" },
  { icon: Zap, text: "Explain quantum computing simply", color: "text-indigo-400" },
  { icon: Globe, text: "Latest AI developments in 2026", color: "text-blue-400" },
  { icon: BookOpen, text: "Summarize global economy trends", color: "text-purple-400" },
];

export default function ChatView({ chatId, messages, loading, error, newsArticles, onSend }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {isEmpty && !loading ? (
          <WelcomeScreen onSuggestion={onSend} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
                ⚠ {error}
              </div>
            )}
            {newsArticles && newsArticles.length > 0 && !loading && (
              <NewsCard articles={newsArticles} />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <ChatInput onSend={onSend} loading={loading} />
    </div>
  );
}

function WelcomeScreen({ onSuggestion }: { onSuggestion: (s: string, img?: string, mime?: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-16 relative">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center animate-scale-in">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/40">
            <img src="/icon.png" alt="Firansi AI" className="w-full h-full object-contain" />
          </div>
        </div>

        <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Firansi AI</h2>
        <p className="text-gray-400 text-center max-w-sm mb-12 leading-relaxed">
          Ask me anything — questions, analysis, news, or just a conversation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
          {SUGGESTIONS.map(({ icon: Icon, text, color }) => (
            <button
              key={text}
              onClick={() => onSuggestion(text)}
              className="flex items-start gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30 rounded-2xl p-4 text-left transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/10 transition-colors">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-gray-400 text-sm group-hover:text-gray-200 transition-colors leading-relaxed">{text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
