import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
        <p className="text-xs text-slate-500">
          Disclaimer: This AI Investment Research Agent provides analyses and evaluations based on scraped web search results and heuristic calculations. This is for research and entertainment purposes only and does NOT constitute professional financial advice. Always perform your own due diligence.
        </p>
        <p className="text-[11px] text-slate-600 font-mono">
          &copy; {new Date().getFullYear()} AI Investment Research Agent. Powered by LangGraph.js and Groq.
        </p>
      </div>
    </footer>
  );
}
