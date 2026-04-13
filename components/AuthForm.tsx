"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthForm() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(email, password, name);
    } catch (err: any) {
      setError(friendlyError(err?.code ?? err?.message ?? ""));
    } finally { setLoading(false); }
  };

  const google = async () => {
    setError(""); setGLoading(true);
    try { await signInWithGoogle(); }
    catch (err: any) { setError(friendlyError(err?.code ?? "")); }
    finally { setGLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/icon.png" alt="Firansi AI" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-bold text-white">Firansi AI</h1>
          <p className="text-gray-500 text-sm mt-1">Your intelligent AI assistant</p>
        </div>

        {/* Card */}
        <div className="bg-[#2f2f2f] rounded-2xl p-6 border border-[#3f3f3f]">
          {/* Tabs */}
          <div className="flex bg-[#1a1a1a] rounded-xl p-1 mb-5">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-[#7c3aed] text-white" : "text-gray-500 hover:text-gray-300"}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required
                className="bg-[#1a1a1a] border border-[#3f3f3f] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-[#7c3aed] transition-colors" />
            )}
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="bg-[#1a1a1a] border border-[#3f3f3f] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-[#7c3aed] transition-colors" />
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-[#1a1a1a] border border-[#3f3f3f] rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-gray-600 outline-none focus:border-[#7c3aed] transition-colors" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#3f3f3f]" />
            <span className="text-gray-600 text-xs">OR</span>
            <div className="flex-1 h-px bg-[#3f3f3f]" />
          </div>

          <button onClick={google} disabled={gLoading}
            className="w-full bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-3">
            {gLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-600" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found": "No account with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "Email already registered. Sign in instead.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Invalid email address.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/popup-closed-by-user": "Sign-in cancelled.",
    "auth/operation-not-allowed": "Enable Email/Password in Firebase Console.",
  };
  return map[code] ?? `Error: ${code || "Please try again."}`;
}
