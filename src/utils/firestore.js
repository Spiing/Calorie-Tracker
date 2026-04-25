// src/utils/firestore.js
// แทนที่ storage.js — API เดิมยังใช้ได้ แค่เปลี่ยน backend เป็น Firestore
// ─────────────────────────────────────────────────────────────────────────────
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

// ─── Helpers ────────────────────────────────────────────────────────────────

export const getTodayDate = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-"); };

export const formatDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
};

export const sumNutrients = (entries) =>
  entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fats: acc.fats + (e.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

const nanoid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ─── Users ──────────────────────────────────────────────────────────────────

/** ดึง user ทั้งหมด (สำหรับ Admin) */
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** ค้นหา user จาก accessCode → return user object หรือ null */
export const getUserByCode = async (accessCode) => {
  const q = query(
    collection(db, "users"),
    where("accessCode", "==", accessCode.trim())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

/** สร้าง user ใหม่ */
export const createUser = async (userData) => {
  const id = nanoid();
  await setDoc(doc(db, "users", id), {
    ...userData,
    createdAt: serverTimestamp(),
  });
  return { id, ...userData };
};

/** ลบ user + log ทั้งหมด */
export const deleteUserAndLogs = async (userId) => {
  const batch = writeBatch(db);

  // ลบ user document
  batch.delete(doc(db, "users", userId));

  // ลบ foodLogs subcollection
  const foodSnap = await getDocs(collection(db, "foodLogs", userId, "daily"));
  foodSnap.docs.forEach((d) => batch.delete(d.ref));

  // ลบ weightLogs subcollection
  const weightSnap = await getDocs(collection(db, "weightLogs", userId, "entries"));
  weightSnap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
};

// ─── Food Logs ───────────────────────────────────────────────────────────────

const foodDocRef = (userId, date) =>
  doc(db, "foodLogs", userId, "daily", date);

/** ดึง entries สำหรับวันที่ระบุ (one-time) */
export const getFoodLog = async (userId, date) => {
  const snap = await getDoc(foodDocRef(userId, date));
  return snap.exists() ? snap.data().entries || [] : [];
};

/** Subscribe real-time ต่อ food log ของ user วันที่ระบุ */
export const subscribeFoodLog = (userId, date, callback) => {
  return onSnapshot(foodDocRef(userId, date), (snap) => {
    callback(snap.exists() ? snap.data().entries || [] : []);
  });
};

/** Subscribe real-time ต่อ food log ทั้งหมดของ user (สำหรับหน้า History) */
export const subscribeAllFoodLogs = (userId, callback) => {
  const colRef = collection(db, "foodLogs", userId, "daily");
  return onSnapshot(colRef, (snap) => {
    const result = {};
    snap.docs.forEach((d) => {
      result[d.id] = d.data().entries || [];
    });
    callback(result);
  });
};

/** เพิ่ม food entry ลงวันที่ระบุ */
export const addFoodEntry = async (userId, date, entry) => {
  const ref = foodDocRef(userId, date);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data().entries || [] : [];
  const newEntry = { ...entry, id: nanoid() };
  const updated = [...existing, newEntry];
  await setDoc(ref, { entries: updated, updatedAt: serverTimestamp() });
  return updated;
};

/** แก้ไข food entry */
export const updateFoodEntry = async (userId, date, entryId, updated) => {
  const ref = foodDocRef(userId, date);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const entries = snap.data().entries || [];
  const newEntries = entries.map((e) =>
    e.id === entryId ? { ...e, ...updated } : e
  );
  await setDoc(ref, { entries: newEntries, updatedAt: serverTimestamp() });
  return newEntries;
};

/** ลบ food entry */
export const deleteFoodEntry = async (userId, date, entryId) => {
  const ref = foodDocRef(userId, date);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const entries = (snap.data().entries || []).filter((e) => e.id !== entryId);
  await setDoc(ref, { entries, updatedAt: serverTimestamp() });
  return entries;
};

// ─── Weight Logs ─────────────────────────────────────────────────────────────

const weightDocRef = (userId, date) =>
  doc(db, "weightLogs", userId, "entries", date);

const weightColRef = (userId) =>
  collection(db, "weightLogs", userId, "entries");

/** Subscribe real-time ต่อ weight log ทั้งหมด */
export const subscribeWeightLog = (userId, callback) => {
  return onSnapshot(weightColRef(userId), (snap) => {
    const entries = snap.docs
      .map((d) => ({ date: d.id, weight: d.data().weight }))
      .sort((a, b) => a.date.localeCompare(b.date));
    callback(entries);
  });
};

/** บันทึก/อัปเดตน้ำหนักรายวัน */
export const addOrUpdateWeight = async (userId, date, weight) => {
  await setDoc(weightDocRef(userId, date), {
    weight: parseFloat(weight),
    recordedAt: serverTimestamp(),
  });
};
