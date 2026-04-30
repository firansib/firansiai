"use client";

import { useState, useEffect, useRef } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { Chat, Message, Project, createChat, getUserChats, getChatById, addMessageToChat, deleteChat, getUserProjects, createProject, deleteProject } from "@/lib/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImageGenerator from "./ImageGenerator";
import CodexPanel from "./CodexPanel";
import ProjectsPanel from "./ProjectsPanel";
import AppsPanel from "./AppsPanel";
import { PanelLeft, SquarePen, Search, ImageIcon, Layers, Code2, FolderOpen, Trash2, LogOut, ChevronDown, Check, Mic, ArrowUp, Loader2, Paperclip, Camera, X, Copy } from "lucide-react";

type View = "chat" | "image" | "codex" | "projects" | "apps";
type AIMode = "fast" | "thinking" | "pro";

const MODES: { value: AIMode; label: string; desc: string }[] = [
  { value: "fast",     label: "Fast",     desc: "Answers quickly" },
  { value: "thinking", label: "Thinking", desc: "Solves complex problems" },
  { value: "pro",      label: "Pro",      desc: "Advanced math and code" },
];

export default function ChatApp() {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>("chat");
  const [mode, setMode] = useState<AIMode>("fast");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [search, setSearch] = useState("");
  const [image, setImage] = useState<{ base64: string; mime: string; preview: string; fileName?: string } | null>(null);
  // Store last image for memory — so follow-up questions about same image work
  const [lastImageData, setLastImageData] = useState<{ base64: string; mime: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { if (user) { loadChats(); loadProjects(); } }, [user]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const loadChats = async () => { if (!user) return; try { setChats(await getUserChats(user.uid)); } catch {} };
  const loadProjects = async () => { if (!user) return; try { setProjects(await getUserProjects(user.uid)); } catch {} };

  const selectChat = async (id: string) => {
    setActiveChatId(id); setError(""); setView("chat");
    try { const c = await getChatById(id); setMessages(c?.messages ?? []); } catch { setMessages([]); }
  };

  const newChat = () => { setActiveChatId(null); setMessages([]); setError(""); setView("chat"); setImage(null); setLastImageData(null); };

  const removeChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteChat(id);
    if (activeChatId === id) newChat();
    setChats((p) => p.filter((c) => c.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (file.type === "application/pdf") setImage({ base64, mime: file.type, preview: "pdf", fileName: file.name });
      else setImage({ base64, mime: file.type, preview: result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setShowAttach(false);
  };

  const openCamera = async (facing: "user" | "environment") => {
    setShowAttach(false);
    setCameraFacing(facing);
    try {
      cameraStream?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 100);
    } catch { alert("Camera access denied."); }
  };

  const switchCamera = () => openCamera(cameraFacing === "user" ? "environment" : "user");

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg");
    setImage({ base64: dataUrl.split(",")[1], mime: "image/jpeg", preview: dataUrl });
    closeCamera();
  };

  const closeCamera = () => { cameraStream?.getTracks().forEach((t) => t.stop()); setCameraStream(null); setShowCamera(false); };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !image) || loading || !user) return;
    setInput(""); setError("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const imgKw = ["generate image", "create image", "make image", "draw", "generate a picture", "make a picture", "generate logo", "create logo"];
    if (!image && imgKw.some((k) => text.toLowerCase().includes(k))) { setView("image"); return; }

    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (!image && urlMatch) {
      const url = urlMatch[0];
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: Timestamp.now() };
      setMessages((p) => [...p, userMsg]); setLoading(true);
      let cid = activeChatId;
      try {
        if (!cid) { cid = await createChat(user.uid, text, "fast"); setActiveChatId(cid); }
        addMessageToChat(cid, { role: "user", content: text, timestamp: Timestamp.now() }).catch(() => {});
        const res = await fetch("/api/webpage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
        const data = await res.json();
        const aiContent = res.ok ? data.analysis : `❌ ${data.error}`;
        const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: aiContent, timestamp: Timestamp.now() };
        setMessages((p) => [...p, aiMsg]);
        addMessageToChat(cid!, { role: "assistant", content: aiContent, timestamp: Timestamp.now() }).catch(() => {});
        loadChats();
      } catch (err: any) { setError(err.message ?? "Failed"); }
      finally { setLoading(false); }
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(), role: "user", content: text || "What is in this image?",
      ...(image?.preview && image.preview !== "pdf" ? { imagePreview: image.preview } : {}),
      timestamp: Timestamp.now(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated); setLoading(true);

    // Use current image OR last image (memory for follow-up questions)
    const currentImg = image || (lastImageData ? { ...lastImageData, preview: "", fileName: undefined } : null);
    const imgData = currentImg ? { imageBase64: currentImg.base64, imageMime: currentImg.mime } : {};

    // Save image for memory if new image attached
    if (image) setLastImageData({ base64: image.base64, mime: image.mime });
    setImage(null);

    let cid = activeChatId;
    try {
      if (!cid) { cid = await createChat(user.uid, text || "Image", "fast"); setActiveChatId(cid); }
      addMessageToChat(cid, { role: "user", content: userMsg.content, timestamp: Timestamp.now() }).catch(() => {});
      const prefix = mode === "thinking" ? "Think step by step: " : mode === "pro" ? "As an expert, provide detailed analysis: " : "";
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.slice(-20).map((m) => ({ role: m.role, content: m.content })), latestMessage: prefix + (text || "Analyze this image"), ...imgData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.response === "SWITCH_TO_IMAGE_GENERATOR") { setView("image"); setLoading(false); return; }
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: data.response, timestamp: Timestamp.now() };
      setMessages((p) => [...p, aiMsg]);
      addMessageToChat(cid!, { role: "assistant", content: data.response, timestamp: Timestamp.now() }).catch(() => {});
      loadChats();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
      setMessages(updated.slice(0, -1));
    } finally { setLoading(false); }
  };

  const filteredChats = chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  const renderMain = () => {
    switch (view) {
      case "image":    return <ImageGenerator />;
      case "codex":    return <CodexPanel />;
      case "projects": return <ProjectsPanel projects={projects} chats={chats} onCreateProject={async (n, d) => { if (!user) return; await createProject(user.uid, n, d); loadProjects(); }} onDeleteProject={async (id) => { await deleteProject(id); setProjects((p) => p.filter((x) => x.id !== id)); }} onSelectChat={selectChat} />;
      case "apps":     return <AppsPanel onViewChange={setView} />;
      default: return (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4">
            {messages.length === 0 && !loading ? (
              <WelcomeScreen onSuggest={(s) => setInput(s)} />
            ) : (
              <div className="max-w-3xl mx-auto px-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex mb-5 ${msg.role === "user" ? "justify-end" : "justify-start"} group`}>
                    {msg.role === "assistant" && (
                      <img src="/icon.png" alt="AI" className="w-7 h-7 rounded-full mr-3 flex-shrink-0 mt-1" />
                    )}
                    <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      {msg.imagePreview && (
                        <img src={msg.imagePreview} alt="uploaded" className="max-h-52 rounded-2xl border border-white/10 object-cover" />
                      )}
                      {msg.content && msg.content !== "What is in this image?" && (
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-[#7c3aed] text-white rounded-br-sm" : "bg-[#2f2f2f] text-gray-100 rounded-bl-sm"}`}>
                          {msg.role === "user" ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="prose-dark">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.role === "assistant" && (
                        <button onClick={() => copyText(msg.id, msg.content)} className="flex items-center gap-1 text-gray-600 hover:text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-all px-1">
                          {copied === msg.id ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy className="w-3 h-3" />Copy</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-start gap-3 mb-5">
                    <img src="/icon.png" alt="AI" className="w-7 h-7 rounded-full flex-shrink-0 mt-1" />
                    <div className="bg-[#2f2f2f] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                      {[0,1,2].map((i) => <span key={i} className="w-2 h-2 bg-[#a78bfa] rounded-full" style={{ animation: `bounce 1.2s ${i*0.15}s infinite` }} />)}
                    </div>
                  </div>
                )}
                {error && <p className="text-red-400 text-sm text-center mb-4">⚠ {error}</p>}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 pb-5 pt-2">
            <div className="max-w-3xl mx-auto relative">
              {/* Attach menu */}
              {showAttach && (
                <div className="absolute bottom-20 left-0 bg-[#2f2f2f] border border-[#3f3f3f] rounded-2xl p-2 z-50 min-w-[220px] shadow-2xl">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-300 hover:bg-white/10 rounded-xl text-sm transition-colors">
                    <Paperclip className="w-4 h-4 text-violet-400" /> Upload image / PDF
                  </button>
                  <button onClick={() => openCamera("environment")} className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-300 hover:bg-white/10 rounded-xl text-sm transition-colors">
                    <Camera className="w-4 h-4 text-blue-400" /> Back camera
                  </button>
                  <button onClick={() => openCamera("user")} className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-300 hover:bg-white/10 rounded-xl text-sm transition-colors">
                    <Camera className="w-4 h-4 text-green-400" /> Front camera (selfie)
                  </button>
                </div>
              )}

              {/* Image preview */}
              {image && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="relative">
                    {image.preview === "pdf" ? (
                      <div className="h-12 px-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                        <span className="text-red-400 text-xs">📄 {image.fileName}</span>
                      </div>
                    ) : (
                      <img src={image.preview} alt="preview" className="h-12 w-12 object-cover rounded-xl border border-white/10" />
                    )}
                    <button onClick={() => setImage(null)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input box */}
              <div className="bg-[#2f2f2f] rounded-2xl border border-[#3f3f3f] focus-within:border-[#7c3aed] transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Ask anything..."
                  rows={1}
                  disabled={loading}
                  className="w-full bg-transparent border-none outline-none text-white text-sm px-4 pt-4 pb-2 resize-none leading-relaxed max-h-40 placeholder-gray-600 disabled:opacity-50"
                />
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  {/* Left: camera + attach */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openCamera("environment")} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Camera">
                      <Camera className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setShowAttach(!showAttach); setShowModeMenu(false); }} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Attach">
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right: mode + mic + send */}
                  <div className="flex items-center gap-1.5 relative">
                    <button onClick={() => { setShowModeMenu(!showModeMenu); setShowAttach(false); }}
                      className="flex items-center gap-1.5 bg-[#3f3f3f] hover:bg-[#4a4a4a] border-none rounded-full px-3 py-1.5 text-gray-300 text-sm font-medium cursor-pointer transition-colors">
                      {mode === "fast" ? "⚡ Fast" : mode === "thinking" ? "🧠 Thinking" : "🔬 Pro"}
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>
                    {showModeMenu && (
                      <div className="absolute bottom-10 right-0 bg-white rounded-2xl shadow-2xl z-50 w-[240px] overflow-hidden border border-gray-100">
                        {MODES.map((m, i) => (
                          <button key={m.value} onClick={() => { setMode(m.value); setShowModeMenu(false); }}
                            className={`flex items-center justify-between w-full px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${i < MODES.length - 1 ? "border-b border-gray-100" : ""}`}>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                            </div>
                            {mode === m.value && (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Voice input"
                      onClick={() => {
                        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        if (!SR) return alert("Use Chrome for voice input");
                        const r = new SR(); r.lang = "en-US";
                        r.onresult = (e: any) => setInput((p) => p + e.results[0][0].transcript);
                        r.start();
                      }}>
                      <Mic className="w-4 h-4" />
                    </button>
                    <button onClick={send} disabled={(!input.trim() && !image) || loading}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${(input.trim() || image) && !loading ? "bg-white text-black hover:bg-gray-200 shadow-md" : "bg-[#3f3f3f] text-gray-600 cursor-not-allowed"}`}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-600 text-xs mt-2">Firansi AI can make mistakes. Verify important information.</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
          <canvas ref={canvasRef} className="hidden" />
        </>
      );
    }
  };

  return (
    <div className="flex h-screen bg-[#212121] overflow-hidden">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-md border border-[#3f3f3f]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-base">📷 Camera</span>
              <div className="flex gap-2">
                <button onClick={switchCamera} className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-xl px-3 py-1.5 text-gray-300 text-sm cursor-pointer hover:bg-[#3f3f3f] transition-colors">
                  🔄 {cameraFacing === "user" ? "Back" : "Front"}
                </button>
                <button onClick={closeCamera} className="bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-1.5 text-red-400 text-sm cursor-pointer hover:bg-red-500/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-black" />
            <button onClick={capturePhoto} className="mt-4 w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              📸 Capture Photo
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-[260px] bg-[#171717] border-r border-[#2f2f2f] flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="Firansi AI" className="w-7 h-7" />
              <span className="font-bold text-white text-sm">Firansi AI</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <div className="px-2 space-y-0.5">
            <NavBtn icon={<SquarePen className="w-4 h-4" />} label="New chat" onClick={newChat} />
            <NavBtn icon={<Search className="w-4 h-4" />} label="Search chats" onClick={() => {}} />
            <NavBtn icon={<ImageIcon className="w-4 h-4" />} label="Images" onClick={() => setView("image")} active={view === "image"} />
            <NavBtn icon={<Layers className="w-4 h-4" />} label="Apps" onClick={() => setView("apps")} active={view === "apps"} />
            <NavBtn icon={<Code2 className="w-4 h-4" />} label="Codex" onClick={() => setView("codex")} active={view === "codex"} />
            <NavBtn icon={<FolderOpen className="w-4 h-4" />} label="Projects" onClick={() => setView("projects")} active={view === "projects"} />
          </div>

          {/* Recents label */}
          <div className="px-4 pt-4 pb-1">
            <span className="text-[11px] text-gray-600 font-semibold uppercase tracking-wider">Recents</span>
          </div>

          {/* Search */}
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 bg-[#2f2f2f] rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="bg-transparent text-white text-xs placeholder-gray-600 outline-none flex-1" />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {filteredChats.length === 0 && <p className="text-gray-600 text-xs px-3 py-4">No chats yet</p>}
            {filteredChats.map((chat) => (
              <div key={chat.id} onClick={() => selectChat(chat.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${activeChatId === chat.id && view === "chat" ? "bg-violet-600/15 text-violet-300" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"}`}>
                <span className="flex-1 text-xs truncate">{chat.title}</span>
                <button onClick={(e) => removeChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* User */}
          <div className="border-t border-[#2f2f2f] p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : (user?.displayName ?? user?.email ?? "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.displayName ?? user?.email?.split("@")[0]}</p>
              <p className="text-gray-600 text-[10px] truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2f2f2f]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <PanelLeft className="w-5 h-5" />
          </button>
          <button onClick={newChat} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="New chat">
            <SquarePen className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">Firansi AI</span>
            <img src="/icon.png" alt="Firansi AI" className="w-6 h-6" />
          </div>
          <div className="flex-1" />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {renderMain()}
        </div>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

function NavBtn({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-violet-600/15 text-violet-300" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
      {icon} {label}
    </button>
  );
}

function WelcomeScreen({ onSuggest }: { onSuggest: (s: string) => void }) {
  const suggestions = ["What's happening in tech today?", "Explain quantum computing simply", "Write a Python function to sort a list", "Summarize global economy trends"];
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-16 text-center">
      <img src="/icon.png" alt="Firansi AI" className="w-20 h-20 mb-5" />
      <h2 className="text-3xl font-bold text-white mb-3">Firansi AI</h2>
      <p className="text-gray-500 text-base mb-10 max-w-sm">Ask me anything — I search the web for real answers.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {suggestions.map((s) => (
          <button key={s} onClick={() => onSuggest(s)}
            className="bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-[#3f3f3f] hover:border-[#7c3aed]/50 rounded-2xl p-4 text-gray-400 hover:text-white text-sm text-left transition-all leading-relaxed">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
