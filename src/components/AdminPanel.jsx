// src/components/AdminPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Supervisory Dashboard
//
// ARCHITECTURE: per-user real-time subscriptions
//
// แทนที่จะ subscribe ทุก user ใน parent (N subscriptions เปิดพร้อมกัน),
// เราสร้าง <UserRow> component แยก ซึ่งจัดการ subscription ของตัวเองด้วย
// useEffect + cleanup → เปิด/ปิดอัตโนมัติตาม mount/unmount ของแต่ละ row
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Trash2, Check, X, Shield, LogOut,
  Loader2, RefreshCw, Eye, EyeOff, ChevronRight,
} from "lucide-react";
import {
  getAllUsers, createUser, deleteUserAndLogs,
  subscribeFoodLog, getTodayDate, sumNutrients,
} from "../utils/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_TYPES = [
  { value: "lose",     label: "ลดน้ำหนัก" },
  { value: "gain",     label: "เพิ่มกล้าม" },
  { value: "maintain", label: "รักษา" },
];
const AVATARS = ["🧑‍💼", "👩‍🎨", "🧑‍⚕️", "👩‍💻", "🧑‍🍳", "👩‍🏋️", "🧑‍🎓", "👩‍🏫"];

const defaultForm = {
  accessCode: "", name: "", avatar: "🧑‍💼", age: "",
  goal: "ลดน้ำหนัก", goalType: "lose",
  startDate: new Date().toISOString().split("T")[0],
  weight: "", targetWeight: "",
  targets: { calories: 1800, protein: 140, carbs: 180, fats: 55 },
};

const iCls = "w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors";
const iSty = {
  background: "var(--surface-3)",
  border: "1px solid var(--border-dim)",
  color: "var(--text-1)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Fl({ label, children }) {
  return (
    <div>
      <label className="section-cap mb-1.5 block" style={{ color: "var(--text-3)" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Mini Macro Bars ──────────────────────────────────────────────────────────
// 4 thin hairlines showing real-time % for today's macros
// Design: minimal dots under each label, matching the app's hairline aesthetic

function MacroMini({ consumed, targets }) {
  const macros = [
    { key: "calories", label: "Cal", color: "var(--text-2)",  val: consumed.calories, max: targets.calories },
    { key: "protein",  label: "P",   color: "#f87171",        val: consumed.protein,  max: targets.protein },
    { key: "carbs",    label: "C",   color: "#fbbf24",        val: consumed.carbs,    max: targets.carbs },
    { key: "fats",     label: "F",   color: "var(--accent)",  val: consumed.fats,     max: targets.fats },
  ];

  return (
    <div className="flex gap-3 mt-2.5">
      {macros.map(({ key, label, color, val, max }) => {
        const pct  = Math.min((val / (max || 1)) * 100, 100);
        const over = val > max;
        return (
          <div key={key} className="flex-1">
            {/* Track */}
            <div className="h-px w-full mb-1" style={{ background: "var(--surface-3)" }}>
              <div
                className="h-px transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: over ? "var(--red)" : color,
                }}
              />
            </div>
            {/* Label + value */}
            <div className="flex items-center justify-between">
              <span className="section-cap" style={{ color: over ? "var(--red)" : "var(--text-3)" }}>
                {label}
              </span>
              <span className="font-mono-num" style={{ fontSize: "0.55rem", color: "var(--text-3)" }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── UserRow — manages its own Firestore subscription ────────────────────────
// Mounts → opens onSnapshot for today's foodLog of this user
// Unmounts → cleanup function closes the listener automatically

function UserRow({ user, showCodes, onImpersonate, onDeleteRequest, isDeleting, deleteConfirm, onDeleteConfirm, onDeleteCancel }) {
  const today = getTodayDate();
  const [entries,  setEntries]  = useState([]);
  const [rtLoaded, setRtLoaded] = useState(false);

  // Each row opens exactly ONE Firestore listener (today's log for this user)
  useEffect(() => {
    const unsub = subscribeFoodLog(user.id, today, (data) => {
      setEntries(data);
      setRtLoaded(true);
    });
    return unsub; // cleanup on unmount
  }, [user.id, today]);

  const consumed = sumNutrients(entries);
  const targets  = user.targets ?? { calories: 2000, protein: 150, carbs: 200, fats: 65 };

  const isConfirming = deleteConfirm === user.id;

  return (
    <div
      className="py-5 transition-opacity"
      style={{
        borderBottom: "1px solid var(--border-dim)",
        opacity: isConfirming ? 0.35 : 1,
      }}
    >
      {/* ── Row top: avatar · info · actions ─────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0 leading-none">{user.avatar}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-1)" }}>
            {user.name}
          </p>
          <p
            className="font-mono-num text-xs mt-0.5"
            style={{ color: showCodes ? "var(--accent)" : "var(--text-3)" }}
          >
            {showCodes ? user.accessCode : "••••••"}
          </p>
        </div>

        {/* Today's calorie count (real-time) */}
        <div className="text-right shrink-0 mr-1">
          {rtLoaded ? (
            <>
              <p className="font-mono-num text-sm font-medium" style={{ color: "var(--text-1)" }}>
                {consumed.calories.toFixed(0)}
              </p>
              <p className="section-cap" style={{ color: "var(--text-3)" }}>
                / {targets.calories}
              </p>
            </>
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              <Loader2 size={10} className="animate-spin" style={{ color: "var(--text-3)" }} />
            </div>
          )}
        </div>

        {/* View button */}
        <button
          onClick={() => onImpersonate(user)}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                     transition-all active:scale-90 active:opacity-70"
          style={{
            background: "var(--accent-bg)",
            border: "1px solid rgba(74,144,255,0.2)",
          }}
          title="จัดการข้อมูล"
        >
          <ChevronRight size={14} style={{ color: "var(--accent)" }} />
        </button>

        {/* Delete */}
        {isConfirming ? (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onDeleteConfirm(user.id)}
              disabled={isDeleting}
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "rgba(248,113,113,0.12)" }}
            >
              {isDeleting
                ? <Loader2 size={10} className="animate-spin" style={{ color: "var(--red)" }} />
                : <Check size={10} style={{ color: "var(--red)" }} />
              }
            </button>
            <button
              onClick={onDeleteCancel}
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "var(--surface-2)" }}
            >
              <X size={10} style={{ color: "var(--text-3)" }} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onDeleteRequest(user.id)}
            className="w-7 h-7 rounded-md flex items-center justify-center active:opacity-50 shrink-0"
            style={{ background: "var(--surface-2)" }}
          >
            <Trash2 size={10} style={{ color: "var(--text-3)" }} />
          </button>
        )}
      </div>

      {/* ── Row bottom: real-time macro mini bars ─────────────────────── */}
      {rtLoaded && (
        <MacroMini consumed={consumed} targets={targets} />
      )}
    </div>
  );
}

// ─── Main AdminPanel ─────────────────────────────────────────────────────────

export default function AdminPanel({ onLogout, onImpersonate }) {
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(defaultForm);
  const [saving,        setSaving]        = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [showCodes,     setShowCodes]     = useState(false);
  const [toast,         setToast]         = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await getAllUsers()); }
    catch (e) { notify("โหลดไม่สำเร็จ: " + e.message, false); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const setF  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setTg = (k, v) => setForm(f => ({
    ...f, targets: { ...f.targets, [k]: parseFloat(v) || 0 },
  }));

  // ── Add user ──────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!form.accessCode.trim() || !form.name.trim())
      return notify("กรุณากรอก Access Code และชื่อ", false);
    if (users.some(u => u.accessCode === form.accessCode.trim()))
      return notify("Access Code นี้มีอยู่แล้ว", false);

    setSaving(true);
    try {
      const u = await createUser({
        accessCode:   form.accessCode.trim().toLowerCase(),
        name:         form.name.trim(),
        avatar:       form.avatar,
        age:          parseInt(form.age) || 25,
        goal:         form.goal,
        goalType:     form.goalType,
        startDate:    form.startDate,
        weight:       parseFloat(form.weight) || 60,
        targetWeight: parseFloat(form.targetWeight) || 60,
        targets:      form.targets,
      });
      setUsers(p => [...p, u]);
      setForm(defaultForm);
      setShowForm(false);
      notify(`เพิ่ม "${u.name}" สำเร็จ`);
    } catch (e) { notify("เกิดข้อผิดพลาด: " + e.message, false); }
    finally { setSaving(false); }
  };

  // ── Delete user ───────────────────────────────────────────────────────────

  const handleDeleteConfirm = async (userId) => {
    setDeleting(true);
    try {
      await deleteUserAndLogs(userId);
      setUsers(p => p.filter(u => u.id !== userId));
      setDeleteConfirm(null);
      notify("ลบ User สำเร็จ");
    } catch (e) { notify("ลบไม่สำเร็จ: " + e.message, false); }
    finally { setDeleting(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-16 fade-up" style={{ background: "var(--surface-0)" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-7 pt-14 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={11} style={{ color: "var(--text-3)" }} />
              <span className="section-cap" style={{ color: "var(--text-3)" }}>Admin Panel</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              Users
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
              {loading ? "กำลังโหลด…" : `${users.length} คนในระบบ · real-time`}
            </p>
          </div>

          <div className="flex gap-1.5 mt-1">
            <button
              onClick={() => setShowCodes(v => !v)}
              className="w-9 h-9 rounded-lg flex items-center justify-center active:opacity-50"
              style={{ background: "var(--surface-2)" }}
              title="แสดง/ซ่อน Access Code"
            >
              {showCodes
                ? <EyeOff size={14} style={{ color: "var(--text-3)" }} />
                : <Eye    size={14} style={{ color: "var(--text-3)" }} />}
            </button>
            <button
              onClick={loadUsers}
              className="w-9 h-9 rounded-lg flex items-center justify-center active:opacity-50"
              style={{ background: "var(--surface-2)" }}
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
                style={{ color: "var(--text-3)" }}
              />
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-lg flex items-center justify-center active:opacity-50"
              style={{ background: "var(--surface-2)" }}
            >
              <LogOut size={14} style={{ color: "var(--text-3)" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="mx-7 mb-5 px-4 py-3 rounded-lg text-sm fade-up"
          style={{
            background: "var(--surface-2)",
            color: toast.ok ? "var(--accent)" : "var(--red)",
            border: "1px solid var(--border-dim)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Add button ─────────────────────────────────────────────────── */}
      <div className="px-7 mb-2">
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                     transition-all active:scale-95"
          style={{ background: "var(--accent)", color: "white" }}
        >
          <Plus size={14} />
          เพิ่ม User
        </button>
      </div>

      {/* ── Add User Form ───────────────────────────────────────────────── */}
      {showForm && (
        <div
          className="mx-7 mt-6 mb-6 space-y-5 fade-up"
          style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "1.5rem" }}
        >
          <p className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
            New User
          </p>

          {/* Avatar */}
          <Fl label="Avatar">
            <div className="flex gap-2 flex-wrap mt-1">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setF("avatar", a)}
                  className="text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: form.avatar === a ? "var(--surface-3)" : "var(--surface-2)",
                    border: `1px solid ${form.avatar === a ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </Fl>

          <div className="grid grid-cols-2 gap-4">
            <Fl label="Access Code *">
              <input className={iCls + " font-mono-num tracking-widest"} style={iSty}
                value={form.accessCode}
                onChange={e => setF("accessCode", e.target.value)}
                placeholder="john01" autoCapitalize="none" />
            </Fl>
            <Fl label="ชื่อ *">
              <input className={iCls} style={iSty}
                value={form.name}
                onChange={e => setF("name", e.target.value)}
                placeholder="สมชาย ดี" />
            </Fl>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Fl label="อายุ">
              <input type="number" className={iCls} style={iSty}
                value={form.age} onChange={e => setF("age", e.target.value)} placeholder="25" />
            </Fl>
            <Fl label="วันเริ่ม">
              <input type="date" className={iCls} style={iSty}
                value={form.startDate} onChange={e => setF("startDate", e.target.value)} />
            </Fl>
          </div>

          <Fl label="เป้าหมาย">
            <div className="flex gap-2 mt-1">
              {GOAL_TYPES.map(({ value, label }) => (
                <button key={value}
                  onClick={() => setF("goalType", value)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: form.goalType === value ? "var(--accent)" : "var(--surface-2)",
                    color: form.goalType === value ? "white" : "var(--text-3)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Fl>

          <div className="grid grid-cols-2 gap-4">
            <Fl label="น้ำหนักปัจจุบัน (kg)">
              <input type="number" step="0.1" className={iCls} style={iSty}
                value={form.weight} onChange={e => setF("weight", e.target.value)} placeholder="70" />
            </Fl>
            <Fl label="เป้าหมาย (kg)">
              <input type="number" step="0.1" className={iCls} style={iSty}
                value={form.targetWeight} onChange={e => setF("targetWeight", e.target.value)} placeholder="65" />
            </Fl>
          </div>

          <Fl label="เป้าโภชนาการ / วัน">
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { k: "calories", l: "kcal",      c: "var(--text-2)" },
                { k: "protein",  l: "Protein g",  c: "#f87171" },
                { k: "carbs",    l: "Carbs g",    c: "#fbbf24" },
                { k: "fats",     l: "Fat g",      c: "var(--accent)" },
              ].map(({ k, l, c }) => (
                <div key={k}>
                  <label className="section-cap mb-1.5 block" style={{ color: c }}>{l}</label>
                  <input type="number" className={iCls} style={iSty}
                    value={form.targets[k]} onChange={e => setTg(k, e.target.value)} />
                </div>
              ))}
            </div>
          </Fl>

          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowForm(false); setForm(defaultForm); }}
              className="flex-1 py-3.5 rounded-xl text-sm"
              style={{ border: "1px solid var(--border-soft)", color: "var(--text-3)" }}>
              ยกเลิก
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 py-3.5 rounded-xl text-sm font-medium text-white
                         flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: "var(--accent)" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "กำลังบันทึก…" : "เพิ่ม"}
            </button>
          </div>
        </div>
      )}

      {/* ── User list ───────────────────────────────────────────────────── */}
      <div className="px-7 mt-4">

        {/* Column header */}
        {!loading && users.length > 0 && (
          <div
            className="flex items-center justify-between pb-3"
            style={{ borderBottom: "1px solid var(--border-dim)" }}
          >
            <span className="section-cap" style={{ color: "var(--text-3)" }}>
              user · today's intake
            </span>
            <span className="section-cap" style={{ color: "var(--text-3)" }}>
              cal · view · del
            </span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--text-3)" }} />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              ยังไม่มี User — กด "เพิ่ม User" ด้านบน
            </p>
          </div>
        ) : (
          users.map(user => (
            <UserRow
              key={user.id}
              user={user}
              showCodes={showCodes}
              onImpersonate={onImpersonate}
              onDeleteRequest={(id) => setDeleteConfirm(id)}
              isDeleting={deleting}
              deleteConfirm={deleteConfirm}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={() => setDeleteConfirm(null)}
            />
          ))
        )}
      </div>
    </div>
  );
}
