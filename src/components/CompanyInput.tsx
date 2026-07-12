"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";

interface CompanyInputProps {
  onAnalyze: (companyName: string) => void;
  isLoading: boolean;
}

export function CompanyInput({ onAnalyze, isLoading }: CompanyInputProps) {
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim() && !isLoading) {
      onAnalyze(companyName.trim());
    }
  };

  const handlePillClick = (promptValue: string) => {
    if (!isLoading) {
      setCompanyName(promptValue);
      onAnalyze(promptValue);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-2.5 transition-all focus-within:ring-2 focus-within:ring-[#3A22D8]/20 focus-within:border-[#3A22D8]">
          <div className="flex items-center pl-3 text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            required
            disabled={isLoading}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter dataset URL or prompt..."
            className="flex-1 bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-sm sm:text-base font-normal px-2"
          />

          <button
            type="submit"
            disabled={isLoading || !companyName.trim()}
            className="flex items-center gap-1.5 bg-[#3A22D8] hover:bg-[#2C18B4] disabled:bg-slate-300 text-white font-semibold rounded-xl px-5 sm:px-6 py-2.5 transition duration-150 disabled:cursor-not-allowed text-sm sm:text-base shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analysing...</span>
              </>
            ) : (
              <>
                <span>Analyse</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Pills matching the screenshot exactly */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        {[
          { label: "Market Trends", value: "Microsoft" },
          { label: "Sentimental Analysis", value: "Reliance" },
          { label: "Revenue Forecast", value: "NVIDIA" },
        ].map((pill, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handlePillClick(pill.value)}
            className="bg-[#F1F5F9] hover:bg-slate-200/80 text-slate-600 text-xs font-medium px-4 py-1.5 rounded-full border border-slate-200/80 transition duration-150 disabled:opacity-50"
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}
