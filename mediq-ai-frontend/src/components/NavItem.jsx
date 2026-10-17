import React from "react";
import { NavLink } from "react-router-dom";

export const NavItem = ({ to, icon: Icon, label, badge }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20 font-semibold"
            : "text-slate-600 hover:text-cyan-600 hover:bg-cyan-50"
        }`
      }
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-bold border border-cyan-200">
          {badge}
        </span>
      )}
    </NavLink>
  );
};