"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { CompanyInput } from "@/components/CompanyInput";
import { ResearchTrail } from "@/components/ResearchTrail";
import { DecisionCard } from "@/components/DecisionCard";
import { Footer } from "@/components/Footer";
import { AgentLogStep, ResearchData, AnalysisData, DecisionData } from "@/lib/agent/types";
import { Sparkles, HelpCircle, Network, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<AgentLogStep[]>([]);
  const [researchData, setResearchData] = useState<ResearchData | undefined>(undefined);
  const [analysisData, setAnalysisData] = useState<AnalysisData | undefined>(undefined);
  const [decision, setDecision] = useState<DecisionData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  
  // Collapsible toggle for the logs trail on results page
  const [showTrailOnResult, setShowTrailOnResult] = useState(false);

  const handleAnalyze = async (company: string) => {
    // Reset states
    setIsLoading(true);
    setIsComplete(false);
    setLogs([]);
    setResearchData(undefined);
    setAnalysisData(undefined);
    setDecision(undefined);
    setError(null);
    setCompanyName(company);
    setShowTrailOnResult(false);

    try {
      console.log(`[Frontend] Launching analysis for: ${company}`);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyName: company }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("API did not return a stream readable stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode value and append to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split by SSE message separator
        const parts = buffer.split("\n\n");
        // Keep the last part in buffer as it might be incomplete
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;

          // Parse SSE fields
          const lines = part.split("\n");
          let eventType = "";
          let eventData: any = null;

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                eventData = JSON.parse(line.slice(6).trim());
              } catch (e) {
                console.error("Failed to parse SSE JSON field:", line, e);
              }
            }
          }

          // Handle event types
          if (eventType === "log" && eventData) {
            setLogs((prev) => [...prev, eventData]);
          } else if (eventType === "state" && eventData) {
            if (eventData.node === "research") {
              setResearchData(eventData.data);
            } else if (eventData.node === "analysis") {
              setAnalysisData(eventData.data);
            }
          } else if (eventType === "complete" && eventData) {
            setResearchData(eventData.researchData);
            setAnalysisData(eventData.analysisData);
            setDecision(eventData.decision);
            setIsComplete(true);
            setIsLoading(false);
          } else if (eventType === "error" && eventData) {
            setError(eventData.message || "An unexpected error occurred during execution.");
            setIsLoading(false);
          }
        }
      }
    } catch (err: any) {
      console.error("[Frontend] Execution streaming failed:", err);
      setError(err.message || "A networking or server failure occurred.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCompanyName("");
    setIsLoading(false);
    setIsComplete(false);
    setLogs([]);
    setResearchData(undefined);
    setAnalysisData(undefined);
    setDecision(undefined);
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
        
        {/* State 1: Welcome/Landing Dashboard */}
        {!isLoading && !isComplete && (
          <div className="space-y-12 max-w-4xl mx-auto text-center animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Agent Analytics</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
                AI Investment <br className="hidden sm:inline" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
                  Research Agent
                </span>
              </h1>
              <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Enter any company's name. Our automated agent executes a multi-node LangGraph pipeline to scrape search engines, fetch financial metrics, assess risks, and issue an objective Invest or Pass decision.
              </p>
            </div>

            {/* Input card */}
            <CompanyInput onAnalyze={handleAnalyze} isLoading={isLoading} />

            {/* Pipeline explanation cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-6 text-left">
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold font-mono text-sm">
                  1
                </div>
                <h4 className="font-semibold text-white text-sm uppercase tracking-wide">Research Node</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Triggers concurrent Tavily/Serp searches. Queries Yahoo Finance quotes. Compiles stock trends and news headlines.
                </p>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold font-mono text-sm">
                  2
                </div>
                <h4 className="font-semibold text-white text-sm uppercase tracking-wide">Analysis Node</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Processes gathered stats through Groq (Llama 3.3). Evaluates business growth model, pricing power, competitive moat, and risks.
                </p>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
                  3
                </div>
                <h4 className="font-semibold text-white text-sm uppercase tracking-wide">Decision Node</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Synthesizes detailed reports. Issues a structured final recommendation (Invest/Pass), confidence rating, and risk breakdown.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Running/Loading Pipeline */}
        {isLoading && !isComplete && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto w-full">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-white tracking-wide">
                Researching: <span className="text-indigo-400">"{companyName}"</span>
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Executing LangGraph state machine. Observe intermediate node outcomes below.
              </p>
            </div>
            
            <CompanyInput onAnalyze={handleAnalyze} isLoading={isLoading} />
            <ResearchTrail logs={logs} isComplete={isComplete} error={error} />
          </div>
        )}

        {/* State 3: Completed Report Dashboard */}
        {isComplete && !error && (
          <div className="space-y-8 animate-fade-in">
            {/* The Main Decision Dashboard Card */}
            <DecisionCard
              companyName={companyName}
              researchData={researchData}
              analysisData={analysisData}
              decision={decision}
              onReset={handleReset}
            />

            {/* Collapsible Section for Logs/Trail */}
            <div className="w-full max-w-5xl mx-auto border border-slate-800 bg-slate-900/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowTrailOnResult(!showTrailOnResult)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-900/40 transition text-sm font-semibold text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-400" />
                  <span>View LangGraph Pipeline Execution Log</span>
                </div>
                {showTrailOnResult ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTrailOnResult && (
                <div className="p-6 border-t border-slate-850 bg-slate-950/40">
                  <ResearchTrail logs={logs} isComplete={isComplete} error={error} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* State 4: Error Handling View */}
        {error && !isLoading && (
          <div className="w-full max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl max-w-md mx-auto space-y-3">
              <h3 className="font-bold text-lg">Analysis Interrupted</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
            </div>

            <button
              onClick={handleReset}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl px-6 py-3 transition duration-200"
            >
              Try Again
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
