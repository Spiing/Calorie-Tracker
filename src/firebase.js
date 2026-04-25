// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// 1. ไปที่ https://console.firebase.google.com → สร้าง Project ใหม่
// 2. Add Web App → คัดลอก firebaseConfig มาวางด้านล่าง
// 3. ไปที่ Firestore Database → Create database (เลือก production mode)
// 4. ตั้ง Security Rules ตามด้านล่าง
// ─────────────────────────────────────────────────────────────────────────────
//
// FIRESTORE SECURITY RULES (วางใน Firebase Console → Firestore → Rules):
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Users collection: อ่าน-เขียนได้ทุกคน (เราใช้ accessCode แทน auth)
//     match /users/{userId} {
//       allow read, write: if true;
//     }
//     // FoodLogs: เข้าถึงได้ทุก path ใต้ userId
//     match /foodLogs/{userId}/{document=**} {
//       allow read, write: if true;
//     }
//     // WeightLogs: เช่นเดียวกัน
//     match /weightLogs/{userId}/{document=**} {
//       allow read, write: if true;
//     }
//   }
// }
//
// ⚠️ Rules ข้างต้นเป็น open rules สำหรับ prototype เท่านั้น
//    ใน production ควรเพิ่ม Firebase Auth ด้วย
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: แทนที่ด้วย config จริงของคุณจาก Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE COLLECTION STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
//
// users/{userId}                        ← Profile ของ user แต่ละคน
//   accessCode: "abc123"                ← รหัสที่ใช้ login (unique)
//   name: "อาทิตย์ สุขใจ"
//   avatar: "🧑‍💼"
//   age: 28
//   goal: "ลดน้ำหนัก"
//   goalType: "lose" | "gain" | "maintain"
//   startDate: "2025-01-01"
//   weight: 78
//   targetWeight: 70
//   targets: { calories: 1800, protein: 140, carbs: 180, fats: 55 }
//   createdAt: Timestamp
//
// foodLogs/{userId}/daily/{YYYY-MM-DD}  ← Log อาหารรายวัน (subcollection)
//   entries: [
//     { id: "...", name: "ข้าวต้ม", calories: 320,
//       protein: 18, carbs: 45, fats: 8, time: "08:30" }
//   ]
//   updatedAt: Timestamp
//
// weightLogs/{userId}/entries/{YYYY-MM-DD}  ← น้ำหนักรายวัน
//   weight: 75.5
//   recordedAt: Timestamp
// ─────────────────────────────────────────────────────────────────────────────
