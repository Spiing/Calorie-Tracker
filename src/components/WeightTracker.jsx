// src/components/WeightTracker.jsx
import React, { useState, useRef, useEffect } from "react";
import { TrendingDown, TrendingUp, Minus, Check, ArrowRight } from "lucide-react";
import { Chart, registerables } from "chart.js";
import { getTodayDate, formatDate } from "../utils/storage";

Chart.register(...registerables);

export default function WeightTracker({ profile, weightLog, onAddWeight }) {
  const [inputWeight, setInputWeight] = useState("");
  const [saved,       setSaved]       = useState(false);
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const today      = getTodayDate();
  const sorted     = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const last30     = sorted.slice(-30);
  const todayEntry = weightLog.find(w => w.date === today);
  const current    = sorted.length > 0 ? sorted[sorted.length - 1].weight : profile.weight;
  const diff       = +(current - profile.targetWeight).toFixed(1);
  const trend      = last30.length < 2
    ? null
    : +(last30[last30.length - 1].weight - last30[0].weight).toFixed(1);

  const handleSave = () => {
    const w = parseFloat(inputWeight);
    if (!w || w < 20 || w > 300) return;
    onAddWeight(today, w);
    setSaved(true);
    setInputWeight("");
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (!canvasRef.current || last30.length === 0) return;
    chartRef.current?.destroy();

    const labels = last30.map(({ date }) =>
      new Date(date + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })
    );

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "kg",
            data: last30.map(w => w.weight),
            borderColor: "#4a90ff",
            backgroundColor: "rgba(74,144,255,0.04)",
            borderWidth: 1.5,
            pointBackgroundColor: "#4a90ff",
            pointRadius: last30.length > 14 ? 0 : 3,
            pointHoverRadius: 5,
            tension: 0.4,
            fill: true,
          },
          {
            label: "target",
            data: last30.map(() => profile.targetWeight),
            borderColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#161616",
            titleColor: "#888",
            bodyColor: "#f0f0f0",
            borderColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: ctx => ` ${ctx.parsed.y} kg` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              font: { size: 9, family: "'DM Mono', monospace" },
              color: "#444",
              maxTicksLimit: 6,
              maxRotation: 0,
            },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.04)" },
            border: { display: false },
            ticks: {
              font: { size: 9, family: "'DM Mono', monospace" },
              color: "#444",
              callback: v => `${v}`,
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [weightLog, profile.targetWeight]);

  const TrendIcon  = trend === null ? Minus : trend < 0 ? TrendingDown : TrendingUp;
  const trendColor = trend === null ? "var(--text-3)" : trend < 0 ? "var(--accent)" : "var(--red)";

  return (
    <div className="pb-4 min-h-screen fade-up">

      {/* Header */}
      <div className="px-7 pt-16 pb-6">
        <p className="section-cap mb-2" style={{ color: "var(--text-3)" }}>Progress</p>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
          น้ำหนัก
        </h1>
      </div>

      {/* Stats */}
      <div className="px-7 mb-8 fade-up delay-1">
        <div className="flex gap-8">
          {[
            { label: "ปัจจุบัน",  val: String(current),          color: "var(--text-1)" },
            { label: "เป้าหมาย", val: String(profile.targetWeight), color: "var(--text-1)" },
            { label: "ห่างเป้า",  val: diff > 0 ? `+${diff}` : String(diff),
              color: Math.abs(diff) < 0.5 ? "var(--accent)" : "var(--text-1)" },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <p className="section-cap mb-1" style={{ color: "var(--text-3)" }}>{label}</p>
              <p className="font-mono-num text-xl font-medium tracking-tight"
                 style={{ color }}>
                {val}
                <span className="text-xs font-normal ml-0.5" style={{ color: "var(--text-3)" }}>kg</span>
              </p>
            </div>
          ))}
        </div>

        {trend !== null && (
          <div className="flex items-center gap-1.5 mt-5 text-xs font-medium fade-up delay-2"
               style={{ color: trendColor }}>
            <TrendIcon size={12} />
            <span className="font-mono-num">{Math.abs(trend)} kg</span>
            <span style={{ color: "var(--text-3)" }}>· 30 วัน · {trend < 0 ? "ลดลง" : "เพิ่มขึ้น"}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-7 h-px mb-8" style={{ background: "var(--border-dim)" }} />

      {/* Input */}
      <div className="px-7 mb-10 fade-up delay-2">
        <p className="section-cap mb-3" style={{ color: "var(--text-3)" }}>
          บันทึกวันนี้
          {todayEntry && (
            <span className="ml-2 normal-case tracking-normal"
                  style={{ color: "var(--accent)" }}>
              · {todayEntry.weight} kg
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number" step="0.1" min="20" max="300"
              value={inputWeight}
              onChange={e => setInputWeight(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder={todayEntry ? String(todayEntry.weight) : "0.0"}
              className="w-full rounded-lg pl-4 pr-10 py-3.5 text-sm font-mono-num
                         focus:outline-none transition-colors"
              style={{
                background: "var(--surface-3)",
                color: "var(--text-1)",
                border: "1px solid var(--border-dim)",
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "var(--text-3)" }}>kg</span>
          </div>
          <button onClick={handleSave} disabled={!inputWeight}
            className="w-14 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-25"
            style={{ background: saved ? "var(--surface-2)" : "var(--accent)" }}>
            {saved
              ? <Check size={15} style={{ color: "var(--text-3)" }} />
              : <ArrowRight size={15} className="text-white" />
            }
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="px-7 mb-10 fade-up delay-3">
        <p className="section-cap mb-5" style={{ color: "var(--text-3)" }}>แนวโน้ม 30 วัน</p>
        {last30.length === 0 ? (
          <div className="h-36 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              บันทึกน้ำหนักทุกวันเพื่อดูกราฟ
            </p>
          </div>
        ) : (
          <div className="h-44"><canvas ref={canvasRef} /></div>
        )}
      </div>

      {/* History */}
      {sorted.length > 0 && (
        <div className="px-7 fade-up delay-4">
          <p className="section-cap mb-5" style={{ color: "var(--text-3)" }}>ประวัติ</p>
          {[...sorted].reverse().slice(0, 10).map((entry, i) => {
            const prev  = sorted[sorted.length - 2 - i];
            const delta = prev ? +(entry.weight - prev.weight).toFixed(1) : null;
            return (
              <div key={entry.date} className="flex items-center justify-between py-4"
                   style={{ borderBottom: "1px solid var(--border-dim)" }}>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  {formatDate(entry.date)}
                </p>
                <div className="flex items-center gap-4">
                  {delta !== null && (
                    <span className="font-mono-num text-xs"
                          style={{ color: delta < 0 ? "var(--accent)" : delta > 0 ? "var(--red)" : "var(--text-3)" }}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                  <span className="font-mono-num text-sm font-medium" style={{ color: "var(--text-1)" }}>
                    {entry.weight}
                    <span className="text-xs font-normal ml-0.5" style={{ color: "var(--text-3)" }}>kg</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
