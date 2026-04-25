// src/components/ProfileSelector.jsx
import React from "react";
import { User, ChevronRight, Target, Calendar } from "lucide-react";

const GOAL_COLORS = {
  lose: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", dot: "bg-red-400" },
  gain: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-400" },
  maintain: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-100", dot: "bg-sky-400" },
};

export default function ProfileSelector({ profiles, onSelect }) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-emerald-900 text-white px-6 pt-14 pb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-emerald-900 font-bold text-xs">N</span>
          </div>
          <span className="text-emerald-400 font-semibold tracking-widest text-xs uppercase">NutriTrack</span>
        </div>
        <h1 className="text-2xl font-bold mt-4 leading-tight">
          สวัสดี! 👋<br />
          <span className="text-emerald-300">เลือกโปรไฟล์ของคุณ</span>
        </h1>
        <p className="text-emerald-200/70 text-sm mt-2">ติดตามโภชนาการและสุขภาพรายวัน</p>
      </div>

      {/* Wave divider */}
      <div className="bg-emerald-900 h-6 rounded-b-3xl mb-2" />

      {/* Profile cards */}
      <div className="flex-1 px-4 pt-2 pb-8 space-y-3">
        {profiles.map((profile, i) => {
          const colors = GOAL_COLORS[profile.goalType] || GOAL_COLORS.maintain;
          return (
            <button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className="w-full text-left bg-white rounded-2xl border border-stone-100 p-4 shadow-sm
                         flex items-center gap-4 active:scale-[0.98] transition-transform"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-3xl w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100
                              flex items-center justify-center shrink-0 shadow-inner">
                {profile.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 text-base truncate">{profile.name}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    {profile.goal}
                  </span>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Calendar size={11} />
                    อายุ {profile.age} ปี
                  </span>
                </div>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs text-stone-500">
                    🔥 {profile.targets.calories} kcal
                  </span>
                  <span className="text-xs text-stone-500">
                    💪 {profile.targets.protein}g protein
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-300 shrink-0" />
            </button>
          );
        })}

        {/* Info card */}
        <div className="mt-4 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-700 text-center leading-relaxed">
            📊 ข้อมูลถูกบันทึกในเครื่องของคุณ<br />
            ปลอดภัยและเป็นส่วนตัว 100%
          </p>
        </div>
      </div>
    </div>
  );
}
