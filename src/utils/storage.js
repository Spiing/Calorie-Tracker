// src/utils/storage.js
const KEYS = {
  PROFILES: "nt_profiles",
  FOOD_LOGS: "nt_food_logs",
  WEIGHT_LOGS: "nt_weight_logs",
  CURRENT_PROFILE: "nt_current_profile",
};

export const storage = {
  // Profiles
  getProfiles: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.PROFILES)) || null;
    } catch { return null; }
  },
  setProfiles: (profiles) => {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
  },

  // Current profile
  getCurrentProfileId: () => localStorage.getItem(KEYS.CURRENT_PROFILE),
  setCurrentProfileId: (id) => localStorage.setItem(KEYS.CURRENT_PROFILE, id),
  clearCurrentProfile: () => localStorage.removeItem(KEYS.CURRENT_PROFILE),

  // Food logs: { [profileId]: { [date]: [entry] } }
  getFoodLogs: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.FOOD_LOGS)) || {};
    } catch { return {}; }
  },
  setFoodLogs: (logs) => {
    localStorage.setItem(KEYS.FOOD_LOGS, JSON.stringify(logs));
  },
  getFoodLogByDate: (profileId, date) => {
    const all = storage.getFoodLogs();
    return all[profileId]?.[date] || [];
  },
  addFoodEntry: (profileId, date, entry) => {
    const all = storage.getFoodLogs();
    if (!all[profileId]) all[profileId] = {};
    if (!all[profileId][date]) all[profileId][date] = [];
    all[profileId][date].push({ ...entry, id: Date.now().toString() });
    storage.setFoodLogs(all);
    return all[profileId][date];
  },
  updateFoodEntry: (profileId, date, entryId, updated) => {
    const all = storage.getFoodLogs();
    if (!all[profileId]?.[date]) return [];
    all[profileId][date] = all[profileId][date].map((e) =>
      e.id === entryId ? { ...e, ...updated } : e
    );
    storage.setFoodLogs(all);
    return all[profileId][date];
  },
  deleteFoodEntry: (profileId, date, entryId) => {
    const all = storage.getFoodLogs();
    if (!all[profileId]?.[date]) return [];
    all[profileId][date] = all[profileId][date].filter((e) => e.id !== entryId);
    storage.setFoodLogs(all);
    return all[profileId][date];
  },

  // Weight logs: { [profileId]: [{ date, weight }] }
  getWeightLogs: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.WEIGHT_LOGS)) || {};
    } catch { return {}; }
  },
  setWeightLogs: (logs) => {
    localStorage.setItem(KEYS.WEIGHT_LOGS, JSON.stringify(logs));
  },
  getWeightLog: (profileId) => {
    const all = storage.getWeightLogs();
    return all[profileId] || [];
  },
  addOrUpdateWeight: (profileId, date, weight) => {
    const all = storage.getWeightLogs();
    if (!all[profileId]) all[profileId] = [];
    const idx = all[profileId].findIndex((w) => w.date === date);
    if (idx >= 0) {
      all[profileId][idx].weight = weight;
    } else {
      all[profileId].push({ date, weight: parseFloat(weight) });
      all[profileId].sort((a, b) => a.date.localeCompare(b.date));
    }
    storage.setWeightLogs(all);
    return all[profileId];
  },
};

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
