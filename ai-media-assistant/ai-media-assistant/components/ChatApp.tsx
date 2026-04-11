"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { Chat, Message, createChat, getUserChats, getChatById, addMessageToChat, deleteChat } from "@/lib/firestore";
import { NewsArticle } from "@/lib/news";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import { Menu, X } from "lucide-react";

export default function ChatApp() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[] | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) loadChats();
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    try {
      const userChats = await getUserChats(user.uid);
      setChats(userChats);
    } catch (e) {
      console.error("Failed to load chats", e);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    setError(null);
    setNewsArticles(null);
    setMobileSidebarOpen(false);
    try {
      const chat = await getChatById(chatId);
      setMessages(chat?.messages ?? []);
    } catch {
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setError(null);
    setNewsArticles(null);
    setMobileSidebarOpen(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId);
    if (activeChatId === chatId) handleNewChat();
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  };

  const handleSend = async (userMessage: string, imageBase64?: string, imageMime?: string) => {
    if (!user || loading) return;
    setError(null);
    setNewsArticles(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      imagePreview: imageBase64 ? `data:${imageMime || "image/jpeg"};base64,${imageBase64}` : undefined,
      timestamp: Timestamp.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    let currentChatId = activeChatId;

    try {
      if (!currentChatId) {
        currentChatId = await createChat(user.uid, userMessage);
        setActiveChatId(currentChatId);
      }

      await addMessageToChat(currentChatId, {
        role: "user",
        content: userMessage,
        timestamp: Timestamp.now(),
      });

      const apiMessages = updatedMessages.slice(-20).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, latestMessage: userMessage, imageBase64, imageMime }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to get response");

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: Timestamp.now(),
      };

      await addMessageToChat(currentChatId, {
        role: "assistant",
        content: data.response,
        timestamp: Timestamp.now(),
      });

      setMessages((prev) => [...prev, aiMsg]);
      if (data.newsArticles) setNewsArticles(data.newsArticles);
      await loadChats();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 md:hidden transition-transform duration-300 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          collapsed={false}
          onToggleCollapse={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0d0d14]">
          <button onClick={() => setMobileSidebarOpen(true)} className="text-gray-400 hover:text-white transition-colors p-1">
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Firansi AI" className="w-6 h-6 object-contain" />
            <span className="text-white font-bold text-sm">Firansi AI</span>
          </div>
          <div className="w-7" />
        </div>

        <ChatView
          chatId={activeChatId}
          messages={messages}
          loading={loading}
          error={error}
          newsArticles={newsArticles}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
