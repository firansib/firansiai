"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Message } from "@/lib/firestore";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 animate-slide-up group">
        <div className="flex items-end gap-2.5 max-w-[78%]">
          <div className="flex flex-col gap-2 items-end">
            {message.imagePreview && (
              <img src={message.imagePreview} alt="uploaded" className="max-h-52 rounded-2xl border border-white/10 object-cover shadow-lg" />
            )}
            {message.content && message.content !== "What is in this image?" && (
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-lg shadow-violet-500/25 btn-glow">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            )}
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-lg">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-5 animate-slide-up group">
      <div className="flex items-start gap-2.5 max-w-[85%]">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-lg ring-1 ring-violet-500/30">
          <img src="/icon.png" alt="Firansi AI" className="w-full h-full object-contain bg-[#0d0d14]" />
        </div>
        <div className="flex flex-col">
          <div className="bg-white/[0.05] border border-white/[0.08] text-gray-100 px-5 py-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-md hover:bg-white/[0.07] transition-colors duration-200">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-white/10 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-black/40 border border-white/10 text-green-300 p-4 rounded-xl text-xs font-mono overflow-x-auto my-2" {...props}>
                        {children}
                      </code>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                        {children}
                      </a>
                    );
                  },
                  p({ children }) { return <p className="mb-2 last:mb-0 text-gray-200">{children}</p>; },
                  ul({ children }) { return <ul className="list-disc list-inside space-y-1 my-2 text-gray-200">{children}</ul>; },
                  ol({ children }) { return <ol className="list-decimal list-inside space-y-1 my-2 text-gray-200">{children}</ol>; },
                  h1({ children }) { return <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>; },
                  h2({ children }) { return <h2 className="text-base font-bold mb-2 text-white">{children}</h2>; },
                  h3({ children }) { return <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>; },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-violet-500 pl-3 italic text-gray-400 my-2">{children}</blockquote>;
                  },
                  strong({ children }) { return <strong className="font-semibold text-white">{children}</strong>; },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="mt-1.5 self-start flex items-center gap-1.5 text-gray-700 hover:text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-all px-1"
          >
            {copied ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy className="w-3 h-3" />Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}
