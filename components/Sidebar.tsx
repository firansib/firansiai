"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Chat, Project } from "@/lib/firestore";
import {
  Plus, Search, Image, Layers, Code2, FolderOpen,
  MessageSquare, Trash2, LogOut, PanelLeft,
} from "lucide-react";

export type SidebarView = "chat" | "image" | "codex" | "projects" | "apps";

interface SidebarProps {
  chats: Chat[];
  projects: Project[];
  activeChatId: string | null;
  activeView: SidebarView;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onViewChange: (view: SidebarView) => void;
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  chats, projects, activeChatId, activeView,
  onSelectChat, onNewChat, onDeleteChat, onDeleteProject,
  onViewChange, open, onToggle,
}: SidebarProps) {
  const { user, logout, updateAvatar } = useAuth();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await onDeleteChat(id);
    setDeletingId(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateAvatar(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={onToggle} />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col bg-[#171717] transition-all duration-300 ease-in-out ${open ? "w-[260px]" : "w-0 overflow-hidden md:w-0"} h-full`}>
        <div className="flex flex-col h-full w-[260px]">
          {/* Top */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="Firansi AI" className="w-7 h-7 object-contain" />
            </div>
            <button onClick={onToggle} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Nav items */}
          <div className="px-2 space-y-0.5">
            <button
              onClick={onNewChat}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> New chat
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors text-sm"
            >
              <Search className="w-4 h-4" /> Search chats
            </button>
            <button
              onClick={() => onViewChange("image")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-sm ${activeView === "image" ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"}`}
            >
              <Image className="w-4 h-4" /> Images
            </button>
            <button
              onClick={() => onViewChange("apps")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-sm ${activeView === "apps" ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"}`}
            >
              <Layers className="w-4 h-4" /> Apps
            </button>
            <button
              onClick={() => onViewChange("codex")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-sm ${activeView === "codex" ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"}`}
            >
              <Code2 className="w-4 h-4" /> Codex
            </button>
            <button
              onClick={() => onViewChange("projects")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-sm ${activeView === "projects" ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"}`}
            >
              <FolderOpen className="w-4 h-4" /> Projects
            </button>
          </div>

          {/* Recents */}
          <div className="mt-4 px-3 mb-1">
            <span className="text-xs text-gray-500 font-medium">Recents</span>
          </div>

          {/* Search input */}
          <div className="px-2 mb-2">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-white text-xs placeholder-gray-600 outline-none flex-1"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-gray-600 text-xs px-3 py-4">No chats yet</p>
            )}
            {filtered.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { onSelectChat(chat.id); onViewChange("chat"); }}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                  activeChatId === chat.id && activeView === "chat"
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex-1 text-xs truncate">{chat.title}</span>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                  disabled={deletingId === chat.id}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* User footer */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2.5">
              <button onClick={() => avatarInputRef.current?.click()} className="relative group/av flex-shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent group-hover/av:ring-violet-500 transition-all">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {(user?.displayName ?? user?.email ?? "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">
                  {user?.displayName ?? user?.email?.split("@")[0]}
                </p>
              </div>
              <button onClick={logout} className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
