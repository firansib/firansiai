"use client";

import { ExternalLink, Search } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface NewsCardProps {
  articles: SearchResult[];
}

export default function NewsCard({ articles }: NewsCardProps) {
  if (!articles.length) return null;

  return (
    <div className="mb-4">
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-400 text-xs font-semibold uppercase tracking-wide">Web Sources</span>
        </div>
        <div className="space-y-1">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group hover:bg-white/5 rounded-xl p-2.5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium group-hover:text-violet-300 transition-colors line-clamp-1">
                  {article.title}
                </p>
                <p className="text-gray-600 text-[10px] mt-0.5">{article.source}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-700 group-hover:text-violet-400 flex-shrink-0 mt-0.5 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
