// src/components/ImpersonateBanner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Sticky banner shown when Admin is in impersonation mode.
// Always renders at the top, above all content.
//
// App.jsx adds paddingTop = BANNER_H to the scroll container so content
// doesn't get hidden beneath the banner.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Shield, ArrowLeft } from "lucide-react";

export const BANNER_H = 40; // px — must match height below

export default function ImpersonateBanner({ user, onExit }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
      style={{
        height: BANNER_H,
        maxWidth: "448px",    // matches max-w-md
        margin: "0 auto",
        // Distinctive tinted glass — clearly "not normal mode"
        background: "rgba(74,144,255,0.10)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(74,144,255,0.18)",
      }}
    >
      {/* ── Left: breadcrumb ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <Shield size={11} style={{ color: "var(--accent)", flexShrink: 0 }} />

        <span className="section-cap" style={{ color: "rgba(74,144,255,0.6)", flexShrink: 0 }}>
          Admin
        </span>

        <span style={{ color: "rgba(74,144,255,0.35)", fontSize: "0.65rem", flexShrink: 0 }}>
          /
        </span>

        <span
          className="text-xs font-medium truncate"
          style={{ color: "var(--text-1)", maxWidth: 140 }}
        >
          {user.avatar} {user.name}
        </span>
      </div>

      {/* ── Right: exit button ──────────────────────────────────────── */}
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium
                   transition-all active:scale-95 active:opacity-70 shrink-0 ml-3"
        style={{
          background: "rgba(74,144,255,0.12)",
          color: "var(--accent)",
          border: "1px solid rgba(74,144,255,0.2)",
        }}
      >
        <ArrowLeft size={10} />
        กลับ Admin
      </button>
    </div>
  );
}
