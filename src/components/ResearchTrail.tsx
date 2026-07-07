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

  // Auto-scroll to bottom of logs on updates
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
          color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
          name: "Research Node",
        };
      case "analysis":
        return {
          icon: Brain,
          color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
          name: "Analysis Node",
        };
      case "decision":
        return {
          icon: Target,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          name: "Decision Node",
        };
      default:
        return {
          icon: Terminal,
          color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
          name: "System",
        };
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-white tracking-wide">Research Trail</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete && !error && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          )}
          <span className="text-xs font-medium text-slate-400">
            {error ? "Execution Halted" : isComplete ? "Finished" : "Processing"}
          </span>
        </div>
      </div>

      <div className="relative max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {/* Timeline vertical connector */}
        <div className="absolute left-[17px] top-3 bottom-3 w-[2px] bg-slate-800"></div>

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
                {/* Node circle wrapper */}
                <div className={`z-10 flex items-center justify-center w-9 h-9 rounded-full border shadow-lg ${styles.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 pt-1.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {styles.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{log.message}</p>
                </div>
              </div>
            );
          })}

          {error && (
            <div className="relative flex gap-4 text-rose-400">
              <div className="z-10 flex items-center justify-center w-9 h-9 rounded-full border border-rose-500/20 bg-rose-500/10">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 pt-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Failure</span>
                <p className="text-sm mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {isComplete && !error && (
            <div className="relative flex gap-4 text-emerald-400">
              <div className="z-10 flex items-center justify-center w-9 h-9 rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 pt-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
                <p className="text-sm mt-1 leading-relaxed font-medium">Agent decision finalized successfully.</p>
              </div>
            </div>
          )}

          {/* Dummy element for scroll anchoring */}
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  );
}
