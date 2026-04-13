"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Plus, Mic, MicOff, ArrowUp, Loader2, X, FileText, ChevronDown, Check } from "lucide-react";

export type AIMode = "fast" | "thinking" | "pro";

const MODES: { value: AIMode; label: string; desc: string }[] = [
  { value: "fast",     label: "Fast",     desc: "Answers quickly" },
  { value: "thinking", label: "Thinking", desc: "Solves complex problems" },
  { value: "pro",      label: "Pro",      desc: "Advanced math and code" },
];

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string, imageMime?: string) => void;
  loading: boolean;
  disabled?: boolean;
  mode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

export default function ChatInput({ onSend, loading, disabled, mode, onModeChange }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [image, setImage] = useState<{ base64: string; mime: string; preview: string; fileName?: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentMode = MODES.find((m) => m.value === mode) ?? MODES[0];

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && !image) || loading || disabled) return;
    onSend(trimmed || "What is in this image?", image?.base64, image?.mime);
    setInput("");
    setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (file.type === "application/pdf") {
        setImage({ base64, mime: file.type, preview: "pdf", fileName: file.name });
      } else {
        setImage({ base64, mime: file.type, preview: result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setShowAttachMenu(false);
  };

  const openCamera = async () => {
    setShowAttachMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      }, 100);
    } catch { alert("Camera access denied."); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg");
    setImage({ base64: dataUrl.split(",")[1], mime: "image/jpeg", preview: dataUrl });
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const toggleRecording = () => {
    if (recording) {
      (window as any)._speechRecognition?.stop();
      setRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Use Chrome."); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: any) => setInput((p) => p + (p ? " " : "") + e.results[0][0].transcript);
    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);
    (window as any)._speechRecognition = r;
    r.start();
    setRecording(true);
  };

  const hasContent = input.trim().length > 0 || !!image;

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="max-w-3xl mx-auto relative">

        {/* Camera modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-5 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Take a Photo</span>
                <button onClick={() => { cameraStream?.getTracks().forEach((t) => t.stop()); setShowCamera(false); }}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <video ref={videoRef} className="w-full rounded-xl bg-black" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <button onClick={capturePhoto} className="mt-4 w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors">
                Capture Photo
              </button>
            </div>
          </div>
        )}

        {/* Attach menu */}
        {showAttachMenu && (
          <div className="absolute bottom-[90px] left-0 bg-[#2a2a2a] border border-white/10 rounded-2xl p-2 shadow-2xl z-40 min-w-[190px]">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-300 hover:bg-white/10 rounded-xl text-sm transition-colors">
              <FileText className="w-4 h-4 text-red-400" /> Upload file / image
            </button>
            <button onClick={openCamera} className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-300 hover:bg-white/10 rounded-xl text-sm transition-colors">
              📷 Take photo
            </button>
          </div>
        )}

        {/* Mode dropdown */}
        {showModeMenu && (
          <div className="absolute bottom-[90px] right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 w-[280px] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Firansi AI</span>
            </div>
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => { onModeChange(m.value); setShowModeMenu(false); }}
                className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{m.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{m.desc}</p>
                </div>
                {mode === m.value && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Image/PDF preview */}
        {image && (
          <div className="mb-2 flex items-center gap-2">
            <div className="relative">
              {image.preview === "pdf" ? (
                <div className="h-12 px-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-400" />
                  <span className="text-gray-400 text-xs truncate max-w-[120px]">{image.fileName}</span>
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

        {/* Main input box */}
        <div className="bg-[#2f2f2f] rounded-3xl overflow-hidden shadow-lg">
          {/* Text area */}
          <div className="px-4 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Ask anything"
              rows={1}
              disabled={loading || disabled}
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-relaxed max-h-40 disabled:opacity-50"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left: + attach */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setShowAttachMenu(!showAttachMenu); setShowModeMenu(false); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Attach"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Mode dropdown + Mic + Send */}
            <div className="flex items-center gap-1.5">
              {/* Mode dropdown button */}
              <button
                onClick={() => { setShowModeMenu(!showModeMenu); setShowAttachMenu(false); }}
                className="flex items-center gap-1.5 bg-[#3f3f3f] hover:bg-[#4a4a4a] text-gray-200 px-3 py-1.5 rounded-full transition-colors text-sm font-medium"
              >
                {currentMode.label}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* Mic */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${recording ? "bg-red-500/20 text-red-400 animate-pulse" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
                title="Voice input"
              >
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={!hasContent || loading || disabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  hasContent && !loading
                    ? "bg-white text-black hover:bg-gray-200 shadow-md"
                    : "bg-[#3f3f3f] text-gray-600 cursor-not-allowed"
                }`}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ArrowUp className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
        <p className="text-center text-gray-600 text-[11px] mt-2">Firansi AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
}
