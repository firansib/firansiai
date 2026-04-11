"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Chat } from "@/lib/firestore";
import {
  Sparkles, Plus, MessageSquare, Trash2, LogOut,
  ChevronLeft, ChevronRight, Search,
} from "lucide-react";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  chats, activeChatId, onSelectChat, onNewChat,
  onDeleteChat, collapsed, onToggleCollapse,
}: SidebarProps) {
  const { user, logout, updateAvatar } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      updateAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeletingId(chatId);
    await onDeleteChat(chatId);
    setDeletingId(null);
  };

  return (
    <aside className={`flex flex-col bg-[#0d0d14] border-r border-white/[0.06] transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-[260px]"} h-full`}>

      {/* Logo */}
      <div className={`flex items-center border-b border-white/[0.06] h-16 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/icon.png" alt="Firansi AI" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Firansi AI</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/icon.png" alt="Firansi AI" className="w-full h-full object-contain" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggleCollapse} className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={onToggleCollapse} className="flex items-center justify-center py-3 text-gray-600 hover:text-gray-300 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`flex items-center gap-2.5 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-violet-500/20 ${collapsed ? "justify-center p-2.5" : "px-4 py-2.5"}`}
          title="New Chat"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white text-xs placeholder-gray-600 outline-none flex-1 min-w-0"
            />
          </div>
        </div>
      )}

      {/* Chat list label */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Recent Chats</span>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
        {!collapsed && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-gray-600 text-xs">No chats yet</p>
            <p className="text-gray-700 text-xs mt-1">Start a new conversation</p>
          </div>
        )}
        {filtered.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeChatId === chat.id
                ? "bg-violet-600/15 border border-violet-500/20 text-white"
                : "text-gray-500 hover:bg-white/5 hover:text-gray-300 border border-transparent"
            } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? chat.title : undefined}
          >
            <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeChatId === chat.id ? "text-violet-400" : ""}`} />
            {!collapsed && (
              <>
                <span className="flex-1 text-xs truncate font-medium">{chat.title}</span>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all p-0.5 rounded"
                  disabled={deletingId === chat.id}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <label className="relative cursor-pointer group/avatar flex-shrink-0" title="Change profile photo" onClick={() => avatarInputRef.current?.click()}>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center ring-2 ring-transparent group-hover/avatar:ring-violet-500 transition-all">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {(user?.displayName ?? user?.email ?? "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[8px]">📷</span>
            </div>
          </label>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">
                  {user?.displayName ?? user?.email?.split("@")[0] ?? "User"}
                </p>
                <p className="text-gray-600 text-[10px] truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
