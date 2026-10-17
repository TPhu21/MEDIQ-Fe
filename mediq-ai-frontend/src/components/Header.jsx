import React from "react";
import { useAuth } from "../auth/AuthContext";
import { LogOut, Bell, Activity, User } from "lucide-react";

export const Header = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return { text: "ADMINISTRATOR", bg: "bg-purple-100 text-purple-700 border-purple-200" };
      case "DOCTOR":
        return { text: "BÁC SĨ CHUYÊN KHOA", bg: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      default:
        return { text: "BỆNH NHÂN", bg: "bg-cyan-100 text-cyan-700 border-cyan-200" };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-600 font-bold text-lg tracking-wider">
          <Activity className="w-6 h-6 animate-pulse text-cyan-600" />
          <span>MEDIQ AI</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 font-mono border border-cyan-200">
          v2.4 Smart Clinic
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-600 hover:text-cyan-600 rounded-lg hover:bg-slate-100 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full ring-2 ring-cyan-500/30 bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 font-bold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${badge.bg}`}>
              {badge.text}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Đăng xuất"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 text-sm font-medium transition ml-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};