import React from "react";
import { BarChart3 } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-slate-200/80 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand logo + text matching image exactly */}
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-[#3A22D8] text-2xl tracking-tight">
            Investment Agent
          </span>
        </a>
      </div>
    </header>
  );
}
