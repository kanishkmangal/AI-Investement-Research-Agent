"use client";

import React, { useEffect, useRef } from "react";
import { Search, Brain, Target, Terminal, CheckCircle2, AlertCircle } from "lucide-react";
import { AgentLogStep } from "@/lib/agent/types";

interface ResearchTrailProps {
  logs: AgentLogStep[];
  isComplete: boolean;
  error: string | null;
}

export function ResearchTrail({ logs, isComplete, error }: ResearchTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [logs]);

  const getNodeStyles = (node: string) => {
    switch (node) {
      case "research":
        return {
          icon: Search,
          color: "text-sky-600 bg-sky-50 border-sky-200",
          name: "Research Node",
        };
      case "analysis":
        return {
          icon: Brain,
          color: "text-[#3A22D8] bg-indigo-50 border-indigo-200",
          name: "Analysis Node",
        };
      case "decision":
        return {
          icon: Target,
          color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          name: "Decision Node",
        };
      default:
        return {
          icon: Terminal,
          color: "text-slate-600 bg-slate-100 border-slate-200",
          name: "System",
        };
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#3A22D8]" />
          <h3 className="font-semibold text-slate-900 tracking-wide">Execution Trail</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete && !error && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3A22D8]"></span>
            </span>
          )}
          <span className="text-xs font-medium text-slate-500">
            {error ? "Execution Halted" : isComplete ? "Finished" : "Processing"}
          </span>
        </div>
      </div>

      <div className="relative max-h-[350px] overflow-y-auto pr-2">
        <div className="absolute left-[17px] top-3 bottom-3 w-[2px] bg-slate-200"></div>

        <div className="space-y-6">
          {logs.map((log, idx) => {
            const styles = getNodeStyles(log.node);
            const Icon = styles.icon;
            const isLast = idx === logs.length - 1;

            return (
              <div 
                key={idx} 
                className={`relative flex gap-4 transition-all duration-300 ${
                  isLast && !isComplete ? "animate-pulse" : ""
                }`}
              >
                <div className={`z-10 flex items-center justify-center w-9 h-9 rounded-full border shadow-sm ${styles.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 pt-1.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {styles.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{log.message}</p>
                </div>
              </div>
            );
          })}

          {error && (
            <div className="relative flex gap-4 text-rose-600">
              <div className="z-10 flex items-center justify-center w-9 h-9 rounded-full border border-rose-200 bg-rose-50">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 pt-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Failure</span>
                <p className="text-sm mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {isComplete && !error && (
            <div className="relative flex gap-4 text-emerald-600">
              <div className="z-10 flex items-center justify-center w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 pt-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
                <p className="text-sm mt-1 leading-relaxed font-medium">Analysis finalized successfully.</p>
              </div>
            </div>
          )}

          <div ref={containerRef} />
        </div>
      </div>
    </div>
  );
}
