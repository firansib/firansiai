"use client";

import { SidebarView } from "./Sidebar";
import { Image, Code2, FileText, Mic, Wand2, Brain } from "lucide-react";

interface AppsPanelProps {
  onViewChange: (view: SidebarView) => void;
}

const APPS = [
  { icon: Image,    label: "Image Generator", desc: "Create images from text prompts using DALL-E 3", view: "image" as SidebarView, color: "from-blue-600 to-violet-600", iconColor: "text-blue-400" },
  { icon: Code2,    label: "Codex",            desc: "AI coding assistant for any language",           view: "codex" as SidebarView, color: "from-yellow-600 to-orange-600", iconColor: "text-yellow-400" },
  { icon: FileText, label: "PDF Generator",    desc: "Generate PDF documents from AI responses",       view: "chat" as SidebarView,  color: "from-red-600 to-pink-600",    iconColor: "text-red-400" },
  { icon: Mic,      label: "Audio / TTS",      desc: "Convert AI responses to speech audio",           view: "chat" as SidebarView,  color: "from-green-600 to-teal-600",  iconColor: "text-green-400" },
  { icon: Wand2,    label: "PPT Generator",    desc: "Create PowerPoint presentations with AI",        view: "chat" as SidebarView,  color: "from-orange-600 to-red-600",  iconColor: "text-orange-400" },
  { icon: Brain,    label: "Deep Think",       desc: "Slow, detailed reasoning for complex problems",  view: "chat" as SidebarView,  color: "from-indigo-600 to-violet-600", iconColor: "text-indigo-400" },
];

export default function AppsPanel({ onViewChange }: AppsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#212121] p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-white font-bold text-2xl mb-2">Apps</h1>
          <p className="text-gray-500 text-sm">Powerful AI tools at your fingertips</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.map(({ icon: Icon, label, desc, view, color, iconColor }) => (
            <button
              key={label}
              onClick={() => onViewChange(view)}
              className="flex flex-col items-start gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30 rounded-2xl p-5 text-left transition-all duration-200 group"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">{label}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
