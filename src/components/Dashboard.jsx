// src/components/Dashboard.jsx
import React from "react";
import { LogOut, Download } from "lucide-react";
import { formatDate, getTodayDate } from "../utils/storage";

// ── Single macro row: label · hairline progress · numbers ────────────────────
function MacroRow({ label, current, target, unit = "g", accent }) {
  const pct  = Math.min((current / target) * 100, 100);
  const over = current > target;
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <span className="section-cap" style={{ color: "var(--text-3)" }}>{label}</span>
        <span className="font-mono-num text-xs" style={{ color: over ? "var(--red)" : "var(--text-3)" }}>
          <span style={{ color: over ? "var(--red)" : "var(--text-2)" }}>{current.toFixed(0)}</span>
          {" "}/{" "}{target}{unit}
        </span>
      </div>
      {/* hairline track */}
      <div className="relative h-px w-full" style={{ background: "var(--border-dim)" }}>
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? "var(--red)" : accent }}
        />
      </div>
    </div>
  );
}

export default function Dashboard({ profile, consumed, todayEntries, onLogout, onExport }) {
  const today     = getTodayDate();
  const remainCal = profile.targets.calories - consumed.calories;
  const calPct    = Math.min((consumed.calories / profile.targets.calories) * 100, 100);
  const goalMap   = { lose: "Weight Loss", gain: "Muscle Gain", maintain: "Maintenance" };

  return (
    <div className="pb-4">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="px-7 pt-14 pb-2 flex items-start justify-between fade-up">
        <div>
          <p className="section-cap mb-2.5" style={{ color: "var(--text-3)" }}>
            {goalMap[profile.goalType] ?? "Nutrition"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
            {profile.name.split(" ")[0]}
          </h1>
        </div>
        <div className="flex gap-1.5 mt-1">
          {[{ fn: onExport, Icon: Download }, { fn: onLogout, Icon: LogOut }].map(({ fn, Icon }, i) => (
            <button key={i} onClick={fn}
              className="w-9 h-9 rounded-lg flex items-center justify-center active:opacity-50"
              style={{ background: "var(--surface-2)" }}>
              <Icon size={14} style={{ color: "var(--text-3)" }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Calorie hero ─────────────────────────────────────────────────── */}
      <div className="px-7 pt-10 pb-10 fade-up delay-1">
        <p className="section-cap mb-4" style={{ color: "var(--text-3)" }}>แคลอรี่วันนี้</p>

        <div className="flex items-end gap-3">
          <span
            className="font-mono-num leading-none font-medium tracking-tighter"
            style={{ fontSize: "4rem", color: "var(--text-1)" }}>
            {consumed.calories.toFixed(0)}
          </span>
          <div className="pb-2 space-y-0.5">
            <p className="font-mono-num text-sm" style={{ color: "var(--text-3)" }}>
              / {profile.targets.calories}
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>kcal</p>
          </div>
        </div>

        {/* Hairline progress */}
        <div className="mt-6 h-px" style={{ background: "var(--border-dim)" }}>
          <div className="h-px transition-all duration-700"
               style={{
                 width: `${calPct}%`,
                 background: remainCal < 0 ? "var(--red)" : "var(--accent)",
               }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-mono-num text-xs" style={{ color: "var(--text-3)" }}>
            {calPct.toFixed(0)}%
          </span>
          <span className="font-mono-num text-xs"
                style={{ color: remainCal < 0 ? "var(--red)" : "var(--text-3)" }}>
            {remainCal < 0 ? "+" : ""}{Math.abs(remainCal).toFixed(0)} kcal{remainCal >= 0 ? " เหลือ" : " เกิน"}
          </span>
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="mx-7 h-px" style={{ background: "var(--border-dim)" }} />

      {/* ── Profile strip ────────────────────────────────────────────────── */}
      <div className="px-7 py-8 fade-up delay-2">
        <div className="flex gap-8">
          {[
            { label: "อายุ",      val: `${profile.age}y` },
            { label: "ปัจจุบัน", val: `${profile.weight}` },
            { label: "เป้า",     val: `${profile.targetWeight}` },
            { label: "เริ่ม",    val: new Date(profile.startDate + "T00:00:00")
                                        .toLocaleDateString("th-TH", { day: "numeric", month: "short" }) },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="section-cap mb-1" style={{ color: "var(--text-3)" }}>{label}</p>
              <p className="font-mono-num text-sm font-medium" style={{ color: "var(--text-2)" }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="mx-7 h-px" style={{ background: "var(--border-dim)" }} />

      {/* ── Macros ───────────────────────────────────────────────────────── */}
      <div className="px-7 pt-8 space-y-6 fade-up delay-3">
        <p className="section-cap" style={{ color: "var(--text-3)" }}>{formatDate(today)}</p>
        <MacroRow label="Protein" current={consumed.protein} target={profile.targets.protein} accent="#f87171" />
        <MacroRow label="Carbs"   current={consumed.carbs}   target={profile.targets.carbs}   accent="#fbbf24" />
        <MacroRow label="Fat"     current={consumed.fats}    target={profile.targets.fats}     accent="var(--accent)" />
      </div>

      {/* ── Recent entries ───────────────────────────────────────────────── */}
      {todayEntries.length > 0 && (
        <div className="px-7 mt-12 fade-up delay-4">
          <p className="section-cap mb-6" style={{ color: "var(--text-3)" }}>ล่าสุด</p>
          <div className="space-y-5">
            {todayEntries.slice(-4).reverse().map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                    {e.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    {e.time ? `${e.time} · ` : ""}P {e.protein}g · C {e.carbs}g · F {e.fats}g
                  </p>
                </div>
                <span className="font-mono-num text-sm shrink-0" style={{ color: "var(--text-2)" }}>
                  {e.calories}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
