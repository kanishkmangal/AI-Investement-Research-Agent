# AI Investment Research Agent

An advanced, full-stack AI agent application that takes a company name, conducts comprehensive real-time web and financial research, performs qualitative business analysis, and delivers a structured investment decision (**Invest** or **Pass**).

Built using **Next.js** (App Router), **LangGraph.js**, **Tailwind CSS**, and the **Google Gemini 2.5** model via official integrations.

---

## Overview

Traditional investment analysis requires digging through search engines, checking stock quotes, aggregating recent news, analyzing market moats, and assessing business risks. 

This application automates this entire process by executing an explicit, multi-node **LangGraph.js state machine pipeline** that:
1. **Scrapes web directories and news sentiment** for the target company.
2. **Queries Yahoo Finance** autocomplete and quotation endpoints for live market stats (Price, P/E ratio, Market Cap).
3. **Conducts qualitative SWAT & fundamental analyses** using Gemini 2.5 Flash.
4. **Formulates an objective investment decision** (Invest / Pass) with structured justifications, confidence rankings, and a risk matrix.

Execution progress and logs stream to the frontend in real time using Server-Sent Events (SSE).

---

## How to Run It

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### 2. Set Up Environment Variables
Create a file named `.env.local` in the root of the project (copying `.env.example` as a template):
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your API keys:
```env
# 1. Google Gemini Key (Required)
# Get a free key at: https://aistudio.google.com/
GOOGLE_API_KEY=AIzaSy...

# 2. Web Search API Keys (At least one is required)
# Tavily API (Preferred): https://tavily.com/
TAVILY_API_KEY=tvly-...

# SerpAPI (Alternative): https://serpapi.com/
SERPAPI_API_KEY=your_serpapi_key_here
```

### 3. Install Dependencies
Install all package dependencies:
```bash
npm install
```

### 4. Run Locally
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to access the application.

---

## How It Works (LangGraph.js Pipeline)

Rather than running a single large prompt call that performs all actions (which is prone to hallucinations and lacks observability), the agent is modeled as an explicit state-directed graph (`StateGraph`) containing three sequential nodes:

```
[Start] ──> (Research Node) ──> (Analysis Node) ──> (Decision Node) ──> [End]
```

### 1. Research Node
- **Input**: `companyName` (e.g., "Apple").
- **Operations**:
  - Automatically queries Yahoo Finance's autocomplete API to resolve the company name to a stock ticker (e.g., `AAPL`).
  - Hips the Yahoo Finance quote endpoint to fetch live stock metrics (PE ratio, Cap size, 52-week statistics).
  - Triggers three parallel search runs targeting general fundamentals, competitive positioning, and news sentiment.
  - Summarizes recent news articles and earnings announcements using Gemini 2.5 to evaluate current sentiment.
- **State Updated**: `researchData` (web search hits, quotes, raw sentiment).

### 2. Analysis Node
- **Input**: Collected `researchData`.
- **Operations**:
  - Instructs Gemini 2.5 in structured JSON mode to perform qualitative analysis.
  - Divides results into:
    - **Business Fundamentals**: Growth signals, profitability, valuation.
    - **Competitive Position**: Economic moat evaluation and competitor strengths.
    - **Risks & Red Flags**: Key structural business threats.
    - **Sentiment Synthesis**: Synthesis of stock performance news.
- **State Updated**: `analysisData`.

### 3. Decision Node
- **Input**: Quantitative quote metrics and qualitative `analysisData`.
- **Operations**:
  - Prompts Gemini 2.5 to act as the Investment Committee Chair and synthesize the report.
  - Finalizes a structured payload containing:
    - `decision`: "Invest" or "Pass"
    - `confidence`: "Low" | "Medium" | "High"
    - `reasoning`: 3 to 5 clear, objective justifications.
    - `keyRisks`: Top 2 to 3 critical risk events.
- **State Updated**: `decision` (final report payload).

---

## Key Decisions & Trade-offs

- **Swappable LLM Wrapper (`src/lib/services/gemini.ts`)**: Encapsulated the LangChain Gemini initialization. You can switch LLM models (e.g. `gemini-2.5-pro`, `gemini-1.5-flash`) by simply setting the `GEMINI_MODEL` environment variable.
- **Tavily vs. SerpAPI Fallback (`src/lib/services/search.ts`)**: Built a modular search helper that prioritizes Tavily API (specifically optimized for LLM search agents) but automatically falls back to SerpAPI if no Tavily credentials are provided.
- **Yahoo Finance Autocomplete and Fallbacks**: Leveraged the public Yahoo Finance autocomplete endpoints to resolve symbols instead of requiring users to know tickers. If these rate-limit or fail, the agent gracefully falls back to web search estimates, ensuring zero-crash behavior.
- **Event Streaming via SSE**: Implemented Next.js route streaming with `ReadableStream` and Server-Sent Events, transmitting logs node-by-node so users don't wait on a blank loading screen for 30+ seconds.

---

## Example Runs

*Note: Below are placeholders that can be updated with real outputs.*

### Example 1: NVIDIA (NVDA)
- **Verdict**: Invest
- **Confidence**: High
- **Reasoning**:
  - Dominant market share (80%+) in high-performance AI data center accelerators.
  - Outstanding operating margins (>55%) and exponential revenue growth.
  - Strong CUDA developer ecosystem acting as an economic moat.
- **Risks**: Heavy reliance on TSMC for semiconductor fabrication; rich valuation multiples.

### Example 2: Intel (INTC)
- **Verdict**: Pass
- **Confidence**: Medium
- **Reasoning**:
  - Market share erosion in data center and PC chips to AMD and ARM processors.
  - Low profit margins and high capital expenditures to build out manufacturing foundries.
  - Delayed deployment of competitive sub-2nm nodes.
- **Risks**: Continued cash burn during structural turnaround; execution delays in foundry scheduling.

---

## What I Would Improve with More Time

1. **Graph Loops (Self-Correction)**: Introduce a critique loop node that checks if the collected search results are sufficient, returning to the research node if the ticker search failed or data is incomplete.
2. **Official Database Integration**: Store previous analysis sessions in MongoDB/PostgreSQL so users can search, share, and compare historical investment reports.
3. **Advanced Charts**: Render real-time price trend charts on the frontend using libraries like Recharts or Lightweight Charts.
4. **SEC Filings Integration**: Integrate a SEC EDGAR scraper to pull official 10-K and 10-Q financial statements for US companies rather than relying solely on Yahoo Finance and web summaries.

---

## Deployment to Vercel

The application is fully compatible with Vercel and can be deployed in a single click:

1. Import the repository into your Vercel Dashboard.
2. Add your environment variables in the project settings:
   - `GOOGLE_API_KEY`
   - `TAVILY_API_KEY` or `SERPAPI_API_KEY`
3. Click **Deploy**. Vercel will automatically handle build settings, bundlers, and package assembly.

*Note: The API handler is configured with `export const maxDuration = 60` and `export const dynamic = "force-dynamic"`. This ensures the endpoint doesn't timeout on Vercel's standard function limits (10s default).*
