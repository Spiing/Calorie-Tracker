// src/components/LoginScreen.jsx
import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginScreen({ onLogin, isLoading, error }) {
  const [code, setCode] = useState("");

  const submit = () => {
    const t = code.trim();
    if (t) onLogin(t);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-7 pt-20 pb-14"
         style={{ background: "var(--surface-0)" }}>

      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <div className="fade-up">
        {/* Accent mark */}
        <div className="w-6 h-6 rounded-md mb-14"
             style={{ background: "var(--accent)" }} />

        <p className="section-cap mb-5" style={{ color: "var(--text-2)" }}>
          Nutrition Tracker
        </p>

        <h1 className="font-semibold tracking-tighter leading-[1.05]"
            style={{ fontSize: "2.8rem", color: "var(--text-1)" }}>
          Hello, Welcom to Ping's Coaching<br />
          <span style={{ color: "var(--text-3)" }}>Sign in.</span>
        </h1>
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className="space-y-3 fade-up delay-2">
        {error && (
          <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="access code"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 rounded-lg px-5 py-4 text-sm font-mono-num tracking-widest
                       focus:outline-none transition-colors
                       placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
            style={{
              background: "var(--surface-3)",
              color: "var(--text-1)",
              border: `1px solid ${error ? "rgba(248,113,113,0.25)" : "var(--border-dim)"}`,
            }}
          />
          <button
            onClick={submit}
            disabled={!code.trim() || isLoading}
            className="w-14 rounded-lg flex items-center justify-center transition-all
                       disabled:opacity-25 active:scale-95"
            style={{ background: "var(--accent)" }}>
            {isLoading
              ? <Loader2 size={17} className="text-white animate-spin" />
              : <ArrowRight size={17} className="text-white" />}
          </button>
        </div>

        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Contact IG: ping.kt for code · Firebase Firestore
        </p>
      </div>
    </div>
  );
}
