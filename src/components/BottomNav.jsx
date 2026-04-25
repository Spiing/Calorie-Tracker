// src/components/BottomNav.jsx
import React from "react";
import { LayoutDashboard, Plus, BookOpen, TrendingUp } from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Home",    Icon: LayoutDashboard },
  { id: "log",       label: "Log",     Icon: Plus },
  { id: "history",   label: "History", Icon: BookOpen },
  { id: "weight",    label: "Weight",  Icon: TrendingUp },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-pb"
      style={{
        background: "rgba(8,8,8,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid var(--border-dim)",
      }}>
      <div className="flex max-w-md mx-auto">
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center pt-3 pb-4 gap-1.5 relative"
              style={{ WebkitTapHighlightColor: "transparent" }}>
              {/* Active indicator — hairline at top */}
              {on && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-px rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <Icon
                size={19}
                strokeWidth={on ? 2 : 1.5}
                style={{ color: on ? "var(--accent)" : "var(--text-3)" }}
              />
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: on ? "var(--accent)" : "var(--text-3)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
