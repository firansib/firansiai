"use client";

import { useState, useRef, KeyboardEvent, useCallback } from "react";
import { ArrowUp, Loader2, Paperclip, Camera, X, Image as ImageIcon } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string, imageMime?: string) => void;
  loading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, loading, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [image, setImage] = useState<{ base64: string; mime: string; preview: string; fileName?: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && !image) || loading || disabled) return;
    onSend(trimmed || "What is in this image?", image?.base64, image?.mime);
    setInput("");
    setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

    if (file.type.startsWith("image/")) {
      // Handle image
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setImage({ base64, mime: file.type, preview: result });
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      // Handle PDF — read as base64 and show PDF icon preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setImage({ base64, mime: file.type, preview: "pdf", fileName: file.name });
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select an image or PDF file.");
    }

    e.target.value = "";
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      alert("Camera access denied. Please allow camera permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    const base64 = dataUrl.split(",")[1];
    setImage({ base64, mime: "image/jpeg", preview: dataUrl });
    closeCamera();
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const hasContent = input.trim().length > 0 || !!image;

  return (
    <div className="px-4 pb-5 pt-3">
      <div className="max-w-3xl mx-auto">

        {/* Camera modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d14] border border-white/10 rounded-3xl p-5 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Take a Photo</span>
                <button onClick={closeCamera} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <video ref={videoRef} className="w-full rounded-2xl bg-black" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={capturePhoto}
                className="mt-4 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" /> Capture Photo
              </button>
            </div>
          </div>
        )}

        {/* Image/PDF preview */}
        {image && (
          <div className="mb-3 flex items-start gap-2">
            <div className="relative inline-block">
              {image.preview === "pdf" ? (
                <div className="h-20 w-20 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center justify-center gap-1">
                  <span className="text-red-400 text-xs font-bold">PDF</span>
                  <span className="text-gray-500 text-[10px] text-center px-1 truncate w-full text-center">{image.fileName}</span>
                </div>
              ) : (
                <img src={image.preview} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-white/10" />
              )}
              <button
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
              <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-gray-400 text-xs">{image.preview === "pdf" ? "PDF attached" : "Image attached"}</span>
            </div>
          </div>
        )}

        {/* Input box */}
        <div className={`flex items-end gap-2 bg-white/[0.05] border rounded-2xl px-3 py-3 transition-all duration-300 ${hasContent ? "border-violet-500/60 shadow-lg shadow-violet-500/15 bg-white/[0.07]" : "border-white/[0.08]"}`}>

          {/* Attach image */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || disabled}
            className="text-gray-600 hover:text-violet-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0"
            title="Attach image"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Camera */}
          <button
            type="button"
            onClick={openCamera}
            disabled={loading || disabled}
            className="text-gray-600 hover:text-violet-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0"
            title="Take photo"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Message Firansi AI..."
            rows={1}
            disabled={loading || disabled}
            className="flex-1 bg-transparent text-white placeholder-gray-600 resize-none outline-none text-sm leading-relaxed max-h-40 disabled:opacity-50 py-0.5"
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!hasContent || loading || disabled}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              hasContent && !loading
                ? "bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30"
                : "bg-white/10 opacity-40 cursor-not-allowed"
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <ArrowUp className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>

        <p className="text-center text-gray-700 text-[11px] mt-2">
          Firansi AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
