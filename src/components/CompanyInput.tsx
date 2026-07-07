"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";

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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-60"></div>
        
        {/* Inner container */}
        <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-xl">
          <div className="flex items-center pl-3 pr-2 text-slate-500">
            <Search className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
          </div>
          
          <input
            type="text"
            required
            disabled={isLoading}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name (e.g. Nvidia, Tesla, Microsoft)..."
            className="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none focus:ring-0 text-base md:text-lg py-2.5 px-2"
          />
          
          <button
            type="submit"
            disabled={isLoading || !companyName.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-800 disabled:to-slate-800 text-white font-medium rounded-xl px-6 py-2.5 md:py-3 transition duration-200 disabled:text-slate-500 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
