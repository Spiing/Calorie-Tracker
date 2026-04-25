// src/components/FoodLog.jsx
import React, { useState } from "react";
import { Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, getTodayDate } from "../utils/storage";

// ── Bug fix: use local Date constructor, never toISOString() ─────────────────
// toISOString() returns UTC. In GMT+7, midnight local = 17:00 UTC (prev day),
// so splitting "T" gives yesterday's date — causing the double-skip bug.
function shiftDate(dateStr, dir) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + dir);   // local time, no UTC conversion
  return [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, "0"),
    String(next.getDate()).padStart(2, "0"),
  ].join("-");
}

// ── Edit bottom sheet ────────────────────────────────────────────────────────
function EditSheet({ entry, onSave, onClose }) {
  const [f, setF] = useState({
    name: entry.name, calories: entry.calories,
    protein: entry.protein, carbs: entry.carbs,
    fats: entry.fats, time: entry.time || "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const iStyle = {
    background: "var(--surface-3)",
    border: "1px solid var(--border-dim)",
    color: "var(--text-1)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0"
           style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }} />

      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-h-[82vh] overflow-y-auto"
        style={{
          background: "var(--surface-1)",
          borderTop: "1px solid var(--border-dim)",
        }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-0.5 rounded-full" style={{ background: "var(--border-soft)" }} />
        </div>

        <div className="px-7 pb-10 pt-4 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              แก้ไข
            </p>
            <button onClick={onClose} className="p-1 -mr-1 active:opacity-50">
              <X size={16} style={{ color: "var(--text-3)" }} />
            </button>
          </div>

          {[
            { k: "name",     l: "ชื่ออาหาร", t: "text"   },
            { k: "time",     l: "เวลา",       t: "time"   },
            { k: "calories", l: "แคลอรี่",    t: "number" },
            { k: "protein",  l: "โปรตีน",    t: "number" },
            { k: "carbs",    l: "คาร์บ",     t: "number" },
            { k: "fats",     l: "ไขมัน",     t: "number" },
          ].map(({ k, l, t }) => (
            <div key={k}>
              <label className="section-cap mb-1.5 block" style={{ color: "var(--text-3)" }}>{l}</label>
              <input
                type={t} value={f[k]}
                onChange={e => set(k, e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors"
                style={iStyle}
              />
            </div>
          ))}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl text-sm"
              style={{ border: "1px solid var(--border-soft)", color: "var(--text-3)" }}>
              ยกเลิก
            </button>
            <button
              onClick={() => onSave({
                name: f.name, time: f.time,
                calories: +f.calories || 0, protein: +f.protein || 0,
                carbs: +f.carbs || 0, fats: +f.fats || 0,
              })}
              className="flex-1 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}>
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FoodLog({ entries, onDelete, onEdit }) {
  const [editing,    setEditing]    = useState(null);
  const [viewDate,   setViewDate]   = useState(getTodayDate());
  const [confirmDel, setConfirmDel] = useState(null);

  const today   = getTodayDate();
  const isToday = viewDate === today;

  const changeDate = (dir) => {
    const next = shiftDate(viewDate, dir);
    if (next <= today) setViewDate(next);
  };

  const list   = entries[viewDate] || [];
  const totals = list.reduce(
    (a, e) => ({
      calories: a.calories + e.calories, protein: a.protein + e.protein,
      carbs:    a.carbs    + e.carbs,    fats:    a.fats    + e.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <div className="pb-4 min-h-screen fade-up">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-7 pt-16 pb-8">
        <p className="section-cap mb-2" style={{ color: "var(--text-3)" }}>ประวัติ</p>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => changeDate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg active:opacity-40"
            style={{ background: "var(--surface-2)" }}>
            <ChevronLeft size={15} style={{ color: "var(--text-2)" }} />
          </button>

          <div className="flex-1">
            <p className="text-base font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              {formatDate(viewDate)}
            </p>
            {isToday && (
              <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>วันนี้</p>
            )}
          </div>

          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="w-8 h-8 flex items-center justify-center rounded-lg active:opacity-40"
            style={{ background: "var(--surface-2)", opacity: isToday ? 0.15 : 1 }}>
            <ChevronRight size={15} style={{ color: "var(--text-2)" }} />
          </button>
        </div>
      </div>

      {/* ── Totals ──────────────────────────────────────────────────────── */}
      {list.length > 0 && (
        <div className="px-7 pb-8 fade-up delay-1">
          <div className="flex gap-8">
            {[
              { l: "kcal",    v: totals.calories.toFixed(0) },
              { l: "protein", v: `${totals.protein.toFixed(0)}g` },
              { l: "carbs",   v: `${totals.carbs.toFixed(0)}g` },
              { l: "fat",     v: `${totals.fats.toFixed(0)}g` },
            ].map(({ l, v }) => (
              <div key={l}>
                <p className="font-mono-num text-xl font-medium" style={{ color: "var(--text-1)" }}>{v}</p>
                <p className="section-cap mt-0.5" style={{ color: "var(--text-3)" }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 h-px" style={{ background: "var(--border-dim)" }} />
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="px-7">
        {list.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>ยังไม่มีรายการ</p>
          </div>
        ) : list.map((entry) => (
          <div key={entry.id}
            className="flex items-center gap-4 py-4 transition-opacity"
            style={{
              borderBottom: "1px solid var(--border-dim)",
              opacity: confirmDel === entry.id ? 0.3 : 1,
            }}>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                {entry.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {entry.time ? `${entry.time} · ` : ""}P {entry.protein}g · C {entry.carbs}g · F {entry.fats}g
              </p>
            </div>

            <span className="font-mono-num text-sm shrink-0" style={{ color: "var(--text-2)" }}>
              {entry.calories}
            </span>

            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing(entry)}
                className="w-7 h-7 rounded-md flex items-center justify-center active:opacity-50"
                style={{ background: "var(--surface-2)" }}>
                <Edit2 size={11} style={{ color: "var(--text-3)" }} />
              </button>

              {confirmDel === entry.id ? (
                <>
                  <button
                    onClick={() => { onDelete(viewDate, entry.id); setConfirmDel(null); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: "rgba(248,113,113,0.12)" }}>
                    <Check size={11} style={{ color: "var(--red)" }} />
                  </button>
                  <button onClick={() => setConfirmDel(null)}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: "var(--surface-2)" }}>
                    <X size={11} style={{ color: "var(--text-3)" }} />
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmDel(entry.id)}
                  className="w-7 h-7 rounded-md flex items-center justify-center active:opacity-50"
                  style={{ background: "var(--surface-2)" }}>
                  <Trash2 size={11} style={{ color: "var(--text-3)" }} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditSheet
          entry={editing}
          onSave={(u) => { onEdit(viewDate, editing.id, u); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
