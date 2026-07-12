"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { CompanyInput } from "@/components/CompanyInput";
import { ResearchTrail } from "@/components/ResearchTrail";
import { DecisionCard } from "@/components/DecisionCard";
import { Footer } from "@/components/Footer";
import { AgentLogStep, ResearchData, AnalysisData, DecisionData } from "@/lib/agent/types";
import { Sparkles, HelpCircle, Network, ShieldCheck, ChevronDown, ChevronUp, TrendingUp, Activity, Zap, Brain, Target } from "lucide-react";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<AgentLogStep[]>([]);
  const [researchData, setResearchData] = useState<ResearchData | undefined>(undefined);
  const [analysisData, setAnalysisData] = useState<AnalysisData | undefined>(undefined);
  const [decision, setDecision] = useState<DecisionData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  
  const [showTrailOnResult, setShowTrailOnResult] = useState(false);

  const handleAnalyze = async (company: string) => {
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

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;

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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
        
        {/* State 1: Welcome/Landing UI matching screenshot layout + original text */}
        {!isLoading && !isComplete && (
          <div className="max-w-5xl mx-auto w-full text-center animate-fade-in">
            {/* Hero Section */}
            <div className="mb-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Agent Analytics</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                AI Investment Research Agent
              </h1>

              <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Enter any company&apos;s name. Our automated agent executes a multi-node LangGraph pipeline to scrape search engines, fetch financial metrics, assess risks, and issue an objective Invest or Pass decision.
              </p>
            </div>

            {/* Input Card */}
            <CompanyInput onAnalyze={handleAnalyze} isLoading={isLoading} />

            {/* Feature Cards Grid matching screenshot layout with your original text */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 max-w-5xl mx-auto mt-12 text-left">
              {/* Left Large Card (md:col-span-7) */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sky-600 font-mono text-xs font-bold uppercase mb-1">
                    <span>Node 01</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Research Node</h3>
                  <p className="text-sm text-slate-600 mt-1.5 mb-6 leading-relaxed">
                    Triggers concurrent Tavily/Serp searches. Queries Yahoo Finance quotes. Compiles stock trends and news headlines.
                  </p>
                </div>

                {/* Visual Graphic matching screenshot banner */}
                <div className="bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EEF2FF] rounded-xl p-5 border border-slate-200/60 relative overflow-hidden h-[195px] flex flex-col justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <div className="w-full flex items-center justify-between px-3">
                      <div className="bg-white/95 border border-slate-200/80 rounded-lg p-2.5 shadow-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#3A22D8]" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Live Financials</p>
                          <p className="text-xs font-bold text-slate-800">Yahoo Finance Quotes</p>
                        </div>
                      </div>

                      <div className="bg-white/95 border border-slate-200/80 rounded-lg p-2.5 shadow-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Live Search</p>
                          <p className="text-xs font-bold text-slate-800">Tavily Engine</p>
                        </div>
                      </div>
                    </div>

                    {/* Waveform / bar chart visual */}
                    <div className="w-full h-18 bg-white/80 border border-slate-200/80 rounded-lg p-3 shadow-sm flex items-end justify-between gap-1.5">
                      {[30, 48, 35, 65, 52, 78, 60, 88, 70, 95, 82, 90, 72, 85].map((h, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${h}%` }}
                          className="flex-1 bg-gradient-to-t from-[#3A22D8] to-indigo-400 rounded-sm opacity-85"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (md:col-span-5) */}
              <div className="md:col-span-5 flex flex-col gap-5">
                {/* Analysis Node Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#3A22D8] flex items-center justify-center font-bold">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#3A22D8] uppercase">Node 02</span>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">Analysis Node</h4>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    Processes gathered stats through Groq (Llama 3.3). Evaluates business growth model, pricing power, competitive moat, and risks.
                  </p>
                </div>

                {/* Decision Node Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#059669] uppercase">Node 03</span>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">Decision Node</h4>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    Synthesizes detailed reports. Issues a structured final recommendation (Invest/Pass), confidence rating, and risk breakdown.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Running/Loading Pipeline */}
        {isLoading && !isComplete && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto w-full">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Researching: <span className="text-[#3A22D8]">&quot;{companyName}&quot;</span>
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Executing LangGraph state machine. Observe intermediate node outcomes below.
              </p>
            </div>
            
            <CompanyInput onAnalyze={handleAnalyze} isLoading={isLoading} />
            <ResearchTrail logs={logs} isComplete={isComplete} error={error} />
          </div>
        )}

        {/* State 3: Completed Report Dashboard */}
        {isComplete && !error && (
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto w-full">
            <DecisionCard
              companyName={companyName}
              researchData={researchData}
              analysisData={analysisData}
              decision={decision}
              onReset={handleReset}
            />

            {/* Collapsible Section for Logs/Trail */}
            <div className="w-full border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowTrailOnResult(!showTrailOnResult)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition text-sm font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#3A22D8]" />
                  <span>View LangGraph Pipeline Execution Log</span>
                </div>
                {showTrailOnResult ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTrailOnResult && (
                <div className="p-6 border-t border-slate-200 bg-slate-50/50">
                  <ResearchTrail logs={logs} isComplete={isComplete} error={error} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* State 4: Error Handling View */}
        {error && !isLoading && (
          <div className="w-full max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl max-w-md mx-auto space-y-3">
              <h3 className="font-bold text-lg">Analysis Interrupted</h3>
              <p className="text-sm text-rose-600 leading-relaxed">{error}</p>
            </div>

            <button
              onClick={handleReset}
              className="bg-[#3A22D8] hover:bg-[#2C18B4] text-white font-medium rounded-xl px-6 py-3 transition duration-200 shadow-sm"
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
