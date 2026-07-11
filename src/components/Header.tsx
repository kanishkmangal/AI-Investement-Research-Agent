import React from "react";
import { TrendingUp, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              INVESTMENT AGENT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-slate-800 bg-slate-900/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>LangGraph Pipeline Verified</span>
        </div>
      </div>
    </header>
  );
}
