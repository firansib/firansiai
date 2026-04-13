"use client";

import { useState, useRef } from "react";
import { Download, Loader2, Wand2, ImageIcon, Type, X } from "lucide-react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Text overlay state
  const [overlayText, setOverlayText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(48);
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setImageUrl(null);
    setFinalImage(null);
    setOverlayText("");
    setEnhancedPrompt("");

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.url);
      if (data.enhancedPrompt) setEnhancedPrompt(data.enhancedPrompt);
    } catch (err: any) {
      setError(err.message ?? "Image generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyTextOverlay = () => {
    if (!imageUrl || !overlayText.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Text settings
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = fontSize / 10;
      ctx.textAlign = "center";

      // Position
      const x = canvas.width / 2;
      let y: number;
      if (textPosition === "top") y = fontSize + 20;
      else if (textPosition === "center") y = canvas.height / 2;
      else y = canvas.height - 30;

      // Word wrap
      const maxWidth = canvas.width - 60;
      const words = overlayText.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      // Draw each line
      const lineHeight = fontSize * 1.3;
      const totalHeight = lines.length * lineHeight;
      let startY = y - (totalHeight / 2);
      if (textPosition === "top") startY = fontSize + 20;
      if (textPosition === "bottom") startY = canvas.height - totalHeight - 20;

      lines.forEach((line, i) => {
        const lineY = startY + i * lineHeight;
        ctx.strokeText(line, x, lineY);
        ctx.fillText(line, x, lineY);
      });

      setFinalImage(canvas.toDataURL("image/png"));
    };
    img.src = imageUrl;
  };

  const download = () => {
    const src = finalImage || imageUrl;
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = "firansi-ai-image.png";
    a.click();
  };

  const displayImage = finalImage || imageUrl;

  return (
    <div className="flex flex-col h-full bg-[#212121] p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Image Generator</h1>
            <p className="text-gray-500 text-sm">Create images from text — free, no limits</p>
          </div>
        </div>

        {/* Prompt input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="A futuristic city at sunset, digital art..."
            className="flex-1 bg-[#2f2f2f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
            <p className="text-gray-400 text-sm">Generating your image... (10–30 seconds)</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Image result */}
        {displayImage && !loading && (
          <div className="flex flex-col gap-4">
            <img
              src={displayImage}
              alt={prompt}
              className="w-full rounded-2xl shadow-2xl border border-white/10"
            />
            {enhancedPrompt && enhancedPrompt !== prompt && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-gray-500 text-xs mb-1">✨ AI-enhanced prompt used:</p>
                <p className="text-gray-300 text-xs italic">{enhancedPrompt}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={download}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={() => { setShowTextPanel(!showTextPanel); setFinalImage(null); }}
                className="flex items-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                <Type className="w-4 h-4" /> Add Text
              </button>
              {finalImage && (
                <button
                  onClick={() => setFinalImage(null)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 px-4 py-2 rounded-xl text-sm transition-all"
                >
                  <X className="w-4 h-4" /> Remove Text
                </button>
              )}
            </div>

            {/* Text overlay panel */}
            {showTextPanel && (
              <div className="bg-[#2f2f2f] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-white text-sm font-semibold">Add Text to Image</p>

                <input
                  type="text"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Type your text here..."
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500"
                />

                <div className="flex gap-3 flex-wrap">
                  {/* Font size */}
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs">Font Size</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none"
                    >
                      {[24, 36, 48, 64, 80, 96].map((s) => (
                        <option key={s} value={s} className="bg-gray-900">{s}px</option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs">Position</label>
                    <select
                      value={textPosition}
                      onChange={(e) => setTextPosition(e.target.value as any)}
                      className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none"
                    >
                      <option value="top" className="bg-gray-900">Top</option>
                      <option value="center" className="bg-gray-900">Center</option>
                      <option value="bottom" className="bg-gray-900">Bottom</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                      />
                      <span className="text-gray-400 text-xs">{textColor}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={applyTextOverlay}
                  disabled={!overlayText.trim()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Apply Text to Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!displayImage && !loading && !error && (
          <div className="flex flex-col items-center gap-3 text-center py-12">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
              <Wand2 className="w-10 h-10 text-gray-700" />
            </div>
            <p className="text-gray-600 text-sm">Enter a prompt above to generate an image</p>
          </div>
        )}

        {/* Hidden canvas for text overlay */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
