// src/utils/csvExport.js
import { formatDate } from "./storage";

export const exportToCSV = (profile, foodLogs, weightLogs) => {
  const rows = [];

  // Header
  rows.push(["=== NutriTrack Export ===", "", "", "", "", "", ""]);
  rows.push(["ชื่อ", profile.name, "เป้าหมาย", profile.goal, "", "", ""]);
  rows.push([]);

  // Food log section
  rows.push(["--- บันทึกอาหาร ---", "", "", "", "", "", ""]);
  rows.push(["วันที่", "มื้ออาหาร", "แคลอรี่", "โปรตีน (g)", "คาร์บ (g)", "ไขมัน (g)", "เวลา"]);

  const profileFoodLogs = foodLogs[profile.id] || {};
  const sortedDates = Object.keys(profileFoodLogs).sort();

  for (const date of sortedDates) {
    const entries = profileFoodLogs[date];
    for (const entry of entries) {
      rows.push([
        formatDate(date),
        entry.name,
        entry.calories,
        entry.protein,
        entry.carbs,
        entry.fats,
        entry.time || "",
      ]);
    }
  }

  rows.push([]);

  // Weight log section
  rows.push(["--- บันทึกน้ำหนัก ---", "", "", "", "", "", ""]);
  rows.push(["วันที่", "น้ำหนัก (kg)", "", "", "", "", ""]);

  const profileWeightLogs = weightLogs[profile.id] || [];
  for (const entry of profileWeightLogs) {
    rows.push([formatDate(entry.date), entry.weight, "", "", "", "", ""]);
  }

  // Convert to CSV string
  const csvContent = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  // Download
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nutritrack_${profile.name}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
