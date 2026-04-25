// src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// AUTH STATE + IMPERSONATE STATE DESIGN
// ─────────────────────────────────────────────────────────────────────────────
//
// auth: { status, user, error }
//   status: 'idle' | 'verifying' | 'user' | 'admin'
//
// impersonatedUser: null | UserObject
//   null                           → ไม่ได้สวมรอย
//   { id, name, avatar, ... }      → Admin กำลังดู User คนนี้
//
// ─── Active user matrix ───────────────────────────────────────────────────
//  auth.status │ impersonatedUser │ activeUser          │ View
//  ────────────┼─────────────────┼────────────────────┼──────────────────
//  'admin'     │ null            │ null               │ AdminPanel
//  'admin'     │ UserObject      │ impersonatedUser   │ User view + Banner
//  'user'      │ null            │ auth.user          │ Normal user view
//  'user'      │ (impossible)    │ —                  │ —
//
// ─── Subscription key ────────────────────────────────────────────────────
//   activeUser?.id  →  เปลี่ยน userId ทำให้ useEffect cleanup เก่า + open ใหม่
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from "react";

import LoginScreen      from "./components/LoginScreen";
import AdminPanel       from "./components/AdminPanel";
import Dashboard        from "./components/Dashboard";
import LogForm          from "./components/LogForm";
import FoodLog          from "./components/FoodLog";
import WeightTracker    from "./components/WeightTracker";
import BottomNav        from "./components/BottomNav";
import ImpersonateBanner, { BANNER_H } from "./components/ImpersonateBanner";

import {
  getUserByCode,
  subscribeAllFoodLogs,
  subscribeWeightLog,
  addFoodEntry,
  updateFoodEntry,
  deleteFoodEntry,
  addOrUpdateWeight,
  getTodayDate,
  sumNutrients,
} from "./utils/firestore";

import { exportToCSV } from "./utils/csvExport";

// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_CODE   = "ping";
const INITIAL_AUTH = { status: "idle", user: null, error: null };

export default function App() {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [auth,             setAuth]             = useState(INITIAL_AUTH);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [tab,              setTab]              = useState("dashboard");
  const [foodLogs,         setFoodLogs]         = useState({});
  const [weightLog,        setWeightLog]        = useState([]);

  const unsubFoodRef   = useRef(null);
  const unsubWeightRef = useRef(null);

  // ══════════════════════════════════════════════════════════════════════════
  // DERIVED: activeUser — แหล่งความจริงเดียวสำหรับ "ขณะนี้กำลังดูข้อมูลของใคร"
  // ══════════════════════════════════════════════════════════════════════════

  const activeUser = impersonatedUser ?? (auth.status === "user" ? auth.user : null);

  // ══════════════════════════════════════════════════════════════════════════
  // FIRESTORE SUBSCRIPTIONS — re-run ทุกครั้งที่ activeUser?.id เปลี่ยน
  //
  // เมื่อ Admin กด "จัดการข้อมูล" → impersonatedUser เปลี่ยน → activeUser.id เปลี่ยน
  // → useEffect cleanup subscription เก่า → เปิด subscription ใหม่ของ user นั้น
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const userId = activeUser?.id;
    if (!userId) return;

    // Reset ข้อมูลเก่าก่อนเปิด subscription ใหม่ (ป้องกัน flash ข้อมูลผิดคน)
    setFoodLogs({});
    setWeightLog([]);

    unsubFoodRef.current   = subscribeAllFoodLogs(userId, setFoodLogs);
    unsubWeightRef.current = subscribeWeightLog(userId, setWeightLog);

    return () => {
      unsubFoodRef.current?.();
      unsubWeightRef.current?.();
    };
  }, [activeUser?.id]); // ← key: เปลี่ยน userId = cleanup + reopen

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleLogin = useCallback(async (code) => {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === ADMIN_CODE) {
      setAuth({ status: "admin", user: null, error: null });
      return;
    }

    setAuth({ status: "verifying", user: null, error: null });
    try {
      const user = await getUserByCode(trimmed);
      if (!user) {
        setAuth({ status: "idle", user: null, error: "ไม่พบ Access Code นี้ กรุณาตรวจสอบอีกครั้ง" });
      } else {
        setAuth({ status: "user", user, error: null });
        setTab("dashboard");
      }
    } catch (err) {
      setAuth({ status: "idle", user: null, error: "เชื่อมต่อ Firebase ไม่สำเร็จ: " + err.message });
    }
  }, []);

  const handleLogout = useCallback(() => {
    // cleanup subscriptions ก่อน reset ทุกอย่าง
    unsubFoodRef.current?.();
    unsubWeightRef.current?.();
    setFoodLogs({});
    setWeightLog({});
    setImpersonatedUser(null);
    setAuth(INITIAL_AUTH);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // IMPERSONATE HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * handleImpersonate — Admin กด "จัดการข้อมูล" ที่ user ใดๆ
   * activeUser?.id จะเปลี่ยน → subscription useEffect จะ fire ใหม่โดยอัตโนมัติ
   */
  const handleImpersonate = useCallback((user) => {
    setImpersonatedUser(user);
    setTab("dashboard");
  }, []);

  /**
   * handleExitImpersonate — กด "กลับ Admin" ที่ banner
   * cleanup subscriptions → clear impersonatedUser → กลับ AdminPanel
   */
  const handleExitImpersonate = useCallback(() => {
    unsubFoodRef.current?.();
    unsubWeightRef.current?.();
    setFoodLogs({});
    setWeightLog([]);
    setImpersonatedUser(null);
    // auth.status ยัง 'admin' → render AdminPanel อัตโนมัติ
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // FOOD / WEIGHT MUTATIONS
  // ทุก handler อ่าน activeUser.id → ทำงานถูกต้องทั้งในโหมด normal และ impersonate
  // ══════════════════════════════════════════════════════════════════════════

  const today = getTodayDate();

  const handleAddFood = useCallback(async (entry) => {
    if (!activeUser) return;
    await addFoodEntry(activeUser.id, today, entry);
    setTab("dashboard");
  }, [activeUser, today]);

  const handleEditFood = useCallback(async (date, entryId, updated) => {
    if (!activeUser) return;
    await updateFoodEntry(activeUser.id, date, entryId, updated);
  }, [activeUser]);

  const handleDeleteFood = useCallback(async (date, entryId) => {
    if (!activeUser) return;
    await deleteFoodEntry(activeUser.id, date, entryId);
  }, [activeUser]);

  const handleAddWeight = useCallback(async (date, weight) => {
    if (!activeUser) return;
    await addOrUpdateWeight(activeUser.id, date, weight);
  }, [activeUser]);

  const handleExport = useCallback(() => {
    if (!activeUser) return;
    exportToCSV(
      activeUser,
      { [activeUser.id]: foodLogs },
      { [activeUser.id]: weightLog },
    );
  }, [activeUser, foodLogs, weightLog]);

  // ══════════════════════════════════════════════════════════════════════════
  // DERIVED (ใช้ activeUser ไม่ใช่ auth.user)
  // ══════════════════════════════════════════════════════════════════════════

  const todayEntries = foodLogs[today] ?? [];
  const consumed     = sumNutrients(todayEntries);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Not authenticated ──────────────────────────────────────────────
  if (auth.status === "idle" || auth.status === "verifying") {
    return (
      <div className="min-h-screen max-w-md mx-auto">
        <LoginScreen
          onLogin={handleLogin}
          isLoading={auth.status === "verifying"}
          error={auth.error}
        />
      </div>
    );
  }

  // ── 2. Admin — not impersonating ─────────────────────────────────────
  if (auth.status === "admin" && !impersonatedUser) {
    return (
      <div className="min-h-screen max-w-md mx-auto">
        <AdminPanel
          onLogout={handleLogout}
          onImpersonate={handleImpersonate}   // ← ส่ง handler ลงไป
        />
      </div>
    );
  }

  // ── 3. User view (normal login OR admin impersonating) ────────────────
  //    ถ้าไม่มี activeUser ตรงนี้ให้ fallback logout (defensive)
  if (!activeUser) {
    handleLogout();
    return null;
  }

  const isImpersonating = !!impersonatedUser;

  return (
    <div className="min-h-screen max-w-md mx-auto">

      {/* ── Impersonate banner (fixed top, only when impersonating) ────── */}
      {isImpersonating && (
        <ImpersonateBanner
          user={impersonatedUser}
          onExit={handleExitImpersonate}
        />
      )}

      {/* ── Main scroll area — push content below banner when impersonating */}
      <div
        className="overflow-y-auto pb-24"
        style={{ paddingTop: isImpersonating ? BANNER_H : 0 }}
      >
        {tab === "dashboard" && (
          <Dashboard
            profile={activeUser}
            consumed={consumed}
            todayEntries={todayEntries}
            onLogout={handleLogout}
            onExport={handleExport}
          />
        )}

        {tab === "log" && (
          <LogForm onAdd={handleAddFood} />
        )}

        {tab === "history" && (
          <FoodLog
            entries={foodLogs}
            onEdit={handleEditFood}
            onDelete={handleDeleteFood}
          />
        )}

        {tab === "weight" && (
          <WeightTracker
            profile={activeUser}
            weightLog={weightLog}
            onAddWeight={handleAddWeight}
          />
        )}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
