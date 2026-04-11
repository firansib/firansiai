"use client";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-5 animate-fade-in">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1 ring-1 ring-violet-500/30">
          <img src="/icon.png" alt="Firansi AI" className="w-full h-full object-contain bg-[#0d0d14]" />
        </div>
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-5 py-4 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="typing-dot w-2 h-2 bg-violet-400 rounded-full" />
            <span className="typing-dot w-2 h-2 bg-violet-400 rounded-full" />
            <span className="typing-dot w-2 h-2 bg-violet-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
