// src/components/LogForm.jsx
import React, { useState, useMemo } from "react";
import { Search, Check, Clock, ArrowRight } from "lucide-react";
import { PRESET_MEALS, MEAL_CATEGORIES } from "../data/presets";

const empty = { name: "", calories: "", protein: "", carbs: "", fats: "", time: "" };

export default function LogForm({ onAdd }) {
  const [mode,     setMode]     = useState("preset");
  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState("ทั้งหมด");
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(empty);
  const [done,     setDone]     = useState(false);
  const [errors,   setErrors]   = useState({});

  const filtered = useMemo(() => {
    let list = PRESET_MEALS;
    if (cat !== "ทั้งหมด") list = list.filter(m => m.category === cat);
    if (search.trim()) list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [search, cat]);

  const pick = (meal) => {
    setSelected(meal);
    setForm({
      name: meal.name, calories: meal.calories,
      protein: meal.protein, carbs: meal.carbs, fats: meal.fats,
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const change = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const submit = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.calories || isNaN(form.calories)) e.calories = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onAdd({
      name: form.name.trim(),
      calories: +form.calories || 0, protein: +form.protein || 0,
      carbs: +form.carbs || 0, fats: +form.fats || 0,
      time: form.time || new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    });
    setDone(true); setForm(empty); setSelected(null); setErrors({});
    setTimeout(() => setDone(false), 2000);
  };

  const inputCls = (err) => [
    "w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors",
    "placeholder:text-sm",
  ].join(" ");

  const inputStyle = (err) => ({
    background: "var(--surface-3)",
    color: "var(--text-1)",
    border: `1px solid ${err ? "rgba(248,113,113,0.3)" : "var(--border-dim)"}`,
  });

  return (
    <div className="pb-4 min-h-screen fade-up">

      {/* Header */}
      <div className="px-7 pt-16 pb-6">
        <p className="section-cap mb-2" style={{ color: "var(--text-3)" }}>บันทึก</p>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
          เพิ่มอาหาร
        </h1>
      </div>

      {/* Mode toggle */}
      <div className="px-7 mb-7">
        <div className="flex gap-0 rounded-lg p-1" style={{ background: "var(--surface-2)" }}>
          {[["preset", "Preset"], ["custom", "Manual"]].map(([m, l]) => (
            <button key={m}
              onClick={() => { setMode(m); setSelected(null); setForm(empty); }}
              className="flex-1 py-2 text-xs font-medium rounded-md transition-all"
              style={{
                background: mode === m ? "var(--surface-3)" : "transparent",
                color: mode === m ? "var(--text-1)" : "var(--text-3)",
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRESET ─────────────────────────────────────────────────────── */}
      {mode === "preset" && (
        <div className="px-7 space-y-5">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2"
                   style={{ color: "var(--text-3)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาเมนู…"
              className="w-full rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors"
              style={{
                background: "var(--surface-3)",
                color: "var(--text-1)",
                border: "1px solid var(--border-dim)",
              }}
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {MEAL_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: cat === c ? "var(--text-1)" : "var(--surface-2)",
                  color: cat === c ? "var(--surface-0)" : "var(--text-3)",
                }}>
                {c}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-0 max-h-64 overflow-y-auto -mx-7 px-7">
            {filtered.map(meal => (
              <button key={meal.id} onClick={() => pick(meal)}
                className="w-full text-left flex items-center justify-between py-4 transition-opacity active:opacity-50"
                style={{ borderBottom: "1px solid var(--border-dim)" }}>
                <div>
                  <p className="text-sm font-medium"
                     style={{ color: selected?.id === meal.id ? "var(--accent)" : "var(--text-1)" }}>
                    {meal.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono-num text-sm" style={{ color: "var(--text-2)" }}>
                    {meal.calories}
                  </span>
                  {selected?.id === meal.id
                    ? <Check size={13} style={{ color: "var(--accent)" }} />
                    : <span className="w-3" />
                  }
                </div>
              </button>
            ))}
            {!filtered.length && (
              <p className="text-sm text-center py-10" style={{ color: "var(--text-3)" }}>
                ไม่พบเมนู
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── FORM ────────────────────────────────────────────────────────── */}
      {(mode === "custom" || selected) && (
        <div className="px-7 mt-6 space-y-4">
          {mode === "preset" && selected && (
            <p className="text-xs" style={{ color: "var(--accent)" }}>
              ✓ {selected.name}
            </p>
          )}

          {/* Name */}
          <div>
            <label className="section-cap mb-1.5 block" style={{ color: "var(--text-3)" }}>ชื่ออาหาร</label>
            <input value={form.name} onChange={e => change("name", e.target.value)}
              placeholder="เช่น ข้าวผัดกุ้ง"
              className={inputCls(errors.name)}
              style={inputStyle(errors.name)} />
          </div>

          {/* Time */}
          <div>
            <label className="section-cap mb-1.5 block" style={{ color: "var(--text-3)" }}>เวลา</label>
            <div className="relative">
              <Clock size={13} className="absolute left-4 top-1/2 -translate-y-1/2"
                     style={{ color: "var(--text-3)" }} />
              <input type="time" value={form.time} onChange={e => change("time", e.target.value)}
                className="w-full rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors"
                style={{ background: "var(--surface-3)", color: "var(--text-1)", border: "1px solid var(--border-dim)" }} />
            </div>
          </div>

          {/* Nutrients grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "calories", l: "แคลอรี่ (kcal)", c: "var(--text-2)" },
              { k: "protein",  l: "โปรตีน (g)",    c: "#f87171" },
              { k: "carbs",    l: "คาร์บ (g)",     c: "#fbbf24" },
              { k: "fats",     l: "ไขมัน (g)",     c: "var(--accent)" },
            ].map(({ k, l, c }) => (
              <div key={k}>
                <label className="section-cap mb-1.5 block" style={{ color: c }}>
                  {l}
                </label>
                <input type="number" min="0" value={form[k]}
                  onChange={e => change(k, e.target.value)} placeholder="0"
                  className="w-full rounded-lg px-4 py-3 text-sm font-mono-num focus:outline-none transition-colors"
                  style={inputStyle(errors[k])} />
              </div>
            ))}
          </div>

          <button onClick={submit}
            className="w-full py-4 rounded-xl text-sm font-semibold tracking-wide transition-all
                       active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            style={{
              background: done ? "var(--surface-2)" : "var(--accent)",
              color: done ? "var(--text-3)" : "white",
            }}>
            {done
              ? "✓ บันทึกแล้ว"
              : <><ArrowRight size={15} /> บันทึก</>
            }
          </button>
        </div>
      )}

      {mode === "preset" && !selected && (
        <p className="text-xs text-center mt-4 px-7" style={{ color: "var(--text-3)" }}>
          เลือกเมนูด้านบนเพื่อบันทึก
        </p>
      )}
    </div>
  );
}
