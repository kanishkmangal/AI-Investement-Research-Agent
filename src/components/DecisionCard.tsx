"use client";

import React, { useState } from "react";
import { 
  TrendingUp, TrendingDown, ShieldAlert, BarChart3, 
  Layers, MessageSquareDiff, ExternalLink, RefreshCw,
  Coins, Scale, Award
} from "lucide-react";
import { ResearchData, AnalysisData, DecisionData } from "@/lib/agent/types";

interface DecisionCardProps {
  companyName: string;
  researchData?: ResearchData;
  analysisData?: AnalysisData;
  decision?: DecisionData;
  onReset: () => void;
}

export function DecisionCard({ 
  companyName, 
  researchData, 
  analysisData, 
  decision, 
  onReset 
}: DecisionCardProps) {
  const [activeTab, setActiveTab] = useState<"fundamentals" | "competitive" | "sentiment" | "sources">("fundamentals");

  if (!decision) return null;

  const isInvest = decision.decision === "Invest";
  const confidenceColor = 
    decision.confidence === "High" ? "text-emerald-700 bg-emerald-100/80 border-emerald-300" :
    decision.confidence === "Medium" ? "text-amber-700 bg-amber-100/80 border-amber-300" :
    "text-rose-700 bg-rose-100/80 border-rose-300";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: researchData?.financials?.currency || "USD" }).format(val);
  };

  const formatMarketCap = (val: number) => {
    if (val >= 1.0e12) return `${(val / 1.0e12).toFixed(2)}T`;
    if (val >= 1.0e9) return `${(val / 1.0e9).toFixed(2)}B`;
    if (val >= 1.0e6) return `${(val / 1.0e6).toFixed(2)}M`;
    return val.toString();
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-8 animate-fade-in">
      
      {/* 1. Main Decision Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className={`flex items-center justify-center w-20 h-20 rounded-2xl border ${
            isInvest 
              ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
              : "bg-rose-50 border-rose-200 text-rose-600"
          }`}>
            {isInvest ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
          </div>
          
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{researchData?.financials?.companyName || companyName}</h2>
              {researchData?.financials?.symbol && (
                <span className="font-mono text-sm font-semibold bg-slate-100 text-slate-700 rounded-md px-2.5 py-1 uppercase border border-slate-200">
                  {researchData.financials.symbol}
                </span>
              )}
            </div>
            
            <p className="text-slate-600 mt-1">
              Final AI agent investment synthesis and validation report.
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
              <div className={`flex items-center gap-1.5 border rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider ${
                isInvest 
                  ? "bg-emerald-100/80 border-emerald-300 text-emerald-800" 
                  : "bg-rose-100/80 border-rose-300 text-rose-800"
              }`}>
                Verdict: {decision.decision}
              </div>
              <div className={`flex items-center gap-1 border rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider ${confidenceColor}`}>
                Confidence: {decision.confidence}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl px-5 py-3 transition duration-200 text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Analyze Another Company</span>
        </button>
      </div>

      {/* 2. Structured Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Reasons Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <Award className="w-5 h-5 text-[#3A22D8]" />
              <h3 className="font-bold text-slate-900">Investment Thesis</h3>
            </div>
            
            <ul className="space-y-4">
              {decision.reasoning.map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-[#3A22D8] font-mono text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-slate-700 text-sm md:text-base leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900">Critical Risk Assessment</h3>
            </div>
            
            <ul className="space-y-4">
              {decision.keyRisks.map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-mono text-xs font-bold mt-0.5">
                    !
                  </span>
                  <p className="text-slate-700 text-sm leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Financial Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
              <Coins className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900">Financial Summary</h3>
            </div>

            {researchData?.financials ? (
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Market Price</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {formatCurrency(researchData.financials.price)}
                    </span>
                    <span className={`text-sm font-bold ${
                      researchData.financials.change >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {researchData.financials.change >= 0 ? "+" : ""}
                      {researchData.financials.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase">Market Capitalization</span>
                    <p className="font-bold text-slate-900 mt-0.5">{formatMarketCap(researchData.financials.marketCap)}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase">P/E Ratio (Trailing)</span>
                    <p className="font-bold text-slate-900 mt-0.5">{researchData.financials.peRatio ? researchData.financials.peRatio.toFixed(2) : "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase">Forward P/E</span>
                    <p className="font-bold text-slate-900 mt-0.5">{researchData.financials.forwardPE ? researchData.financials.forwardPE.toFixed(2) : "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase">Earnings Per Share</span>
                    <p className="font-bold text-slate-900 mt-0.5">{researchData.financials.eps ? researchData.financials.eps.toFixed(2) : "N/A"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <BarChart3 className="w-12 h-12 stroke-[1] mb-2 text-slate-400" />
                <p className="text-sm">Real-time stock price metrics unavailable. Utilizing web search estimations.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Deep Analysis Reports Panel (Tabs) */}
      {analysisData && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs md:text-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab("fundamentals")}
              className={`flex items-center gap-2 px-5 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "fundamentals"
                  ? "border-[#3A22D8] text-[#3A22D8] bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Fundamentals</span>
            </button>
            <button
              onClick={() => setActiveTab("competitive")}
              className={`flex items-center gap-2 px-5 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "competitive"
                  ? "border-[#3A22D8] text-[#3A22D8] bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Moat & Competitive</span>
            </button>
            <button
              onClick={() => setActiveTab("sentiment")}
              className={`flex items-center gap-2 px-5 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "sentiment"
                  ? "border-[#3A22D8] text-[#3A22D8] bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquareDiff className="w-4 h-4" />
              <span>Sentiment Summary</span>
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`flex items-center gap-2 px-5 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "sources"
                  ? "border-[#3A22D8] text-[#3A22D8] bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Citations ({researchData?.webSearchHits.length || 0})</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === "fundamentals" && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Business Growth & Profitability Signals</h4>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {analysisData.businessFundamentals}
                </p>
              </div>
            )}

            {activeTab === "competitive" && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Competitive Moat & Market Position</h4>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {analysisData.competitivePosition}
                </p>
              </div>
            )}

            {activeTab === "sentiment" && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sentiment Synthesis & News Highlights</h4>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {analysisData.sentimentAnalysis}
                </p>
              </div>
            )}

            {activeTab === "sources" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Web Citations & Reference Materials</h4>
                {researchData?.webSearchHits && researchData.webSearchHits.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {researchData.webSearchHits.slice(0, 10).map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col justify-between p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition duration-200 group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#3A22D8] transition-colors line-clamp-2">
                              {item.title}
                            </h5>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-0.5" />
                          </div>
                          <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>
                        </div>
                        {item.url && (
                          <span className="text-[10px] text-[#3A22D8] font-mono mt-3 truncate block">
                            {new URL(item.url).hostname}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No external citations were recorded during this run.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
