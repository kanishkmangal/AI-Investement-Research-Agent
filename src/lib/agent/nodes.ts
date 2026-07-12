import { getLLM, invokeLLMWithRetry } from "../services/groq";
import { searchWeb, SearchResult } from "../services/search";
import { getFinancials } from "../services/finance";
import { AgentState } from "./types";

/**
 * Helper to generate structured SSE log events.
 */
function createLog(node: "research" | "analysis" | "decision", message: string) {
  return [{
    node,
    message,
    timestamp: new Date().toISOString(),
  }];
}

/**
 * Node 1: Research Node
 * Scrapes news sentiment, resolves stock ticker, fetches live quote metrics, and gathers web search hits.
 */
export async function researchNode(state: AgentState) {
  const companyName = state.companyName;
  const logs = [...createLog("research", `Starting research pipeline for "${companyName}"...`)];

  // 1. Fetch Live Financials (with non-crashing fallback for unlisted companies like "Jio")
  logs.push(...createLog("research", `Resolving symbol & fetching stock quote for ${companyName}...`));
  let financials = null;
  try {
    financials = await getFinancials(companyName);
    if (financials) {
      logs.push(...createLog("research", `Quote retrieved: ${financials.symbol} ($${financials.price}) | Mkt Cap: ${financials.marketCap}`));
    } else {
      logs.push(...createLog("research", `No live quote found for "${companyName}" (unlisted/private company). Continuing with web search data.`));
    }
  } catch (error: any) {
    console.error("[Research Node] Financial quote retrieval error. Full stack trace:", error?.stack || error);
    logs.push(...createLog("research", `Financial quote check skipped (${error?.message || "unlisted symbol"}). Relying on web search.`));
  }

  // 2. Run Parallel Web Searches
  logs.push(...createLog("research", `Scraping web directories and news sentiment for ${companyName}...`));
  let searchResults: SearchResult[][] = [[], [], []];
  try {
    searchResults = await Promise.all([
      searchWeb(`${companyName} company business model growth news`).catch((err) => {
        console.error("[Research Node] Web search query 1 failed:", err?.stack || err);
        return [];
      }),
      searchWeb(`${companyName} competitors competitive advantage economic moat`).catch((err) => {
        console.error("[Research Node] Web search query 2 failed:", err?.stack || err);
        return [];
      }),
      searchWeb(`${companyName} recent news sentiment earnings scandal risks`).catch((err) => {
        console.error("[Research Node] Web search query 3 failed:", err?.stack || err);
        return [];
      })
    ]);
  } catch (error: any) {
    console.error("[Research Node] Parallel search error. Full stack trace:", error?.stack || error);
  }

  const webSearchHits = searchResults.flat().filter((r, i, self) => 
    i === self.findIndex((t) => t.url === r.url && r.url !== "") || (r.url === "" && i < 10)
  );
  logs.push(...createLog("research", `Retrieved ${webSearchHits.length} relevant web & news hits.`));

  // 3. Summarize news sentiment via LLM with retry
  let newsSentiment = "No recent news found.";
  if (webSearchHits.length > 0) {
    logs.push(...createLog("research", "Analyzing recent news sentiment using Groq..."));
    try {
      const llm = getLLM(0.2);
      const newsHitsStr = webSearchHits
        .slice(0, 8)
        .map((h, i) => `[Hit ${i+1}] ${h.title}: ${h.content}`)
        .join("\n\n");

      const sentimentPrompt = `Analyze the recent public news and market sentiment for "${companyName}" based on the following web search excerpts. Provide a concise, objective 3-4 sentence executive summary of current public/market perception, notable recent developments, and overall sentiment trajectory.\n\nExcerpts:\n${newsHitsStr}`;
      
      const response = await invokeLLMWithRetry(llm, sentimentPrompt, 2);
      newsSentiment = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } catch (error: any) {
      console.error("[Research Node] News sentiment LLM summarization failed. Full stack trace:", error?.stack || error);
      newsSentiment = "Public news sentiment could not be synthesized via LLM. See raw search hits.";
    }
  }

  return {
    researchData: {
      companyName,
      financials,
      webSearchHits,
      newsSentiment,
    },
    logs,
  };
}

/**
 * Node 2: Analysis Node
 * Conducts deep qualitative analysis (SWAT, business fundamentals, competitive moat, risks) via Groq LLM.
 */
export async function analysisNode(state: AgentState) {
  const companyName = state.companyName;
  const research = state.researchData;
  const logs = [...createLog("analysis", `Starting business analysis for ${companyName}...`)];

  if (!research) {
    throw new Error("Analysis Node executed without prior researchData.");
  }

  const financials = research.financials;
  const financialsStr = financials 
    ? `Ticker: ${financials.symbol} | Price: $${financials.price} | Mkt Cap: ${financials.marketCap} | P/E: ${financials.peRatio ?? 'N/A'} | 52W High/Low: $${financials.fiftyTwoWeekHigh}/$${financials.fiftyTwoWeekLow}`
    : "No stock market quote metrics available (unlisted or private company). Conduct analysis using web search data.";

  const searchStr = research.webSearchHits
    .slice(0, 10)
    .map((h, i) => `[Hit ${i+1}] Title: ${h.title}\nSnippet: ${h.content}`)
    .join("\n\n");

  const prompt = `You are a Senior Investment Analyst. Perform a deep business and financial analysis of ${companyName} using the provided data.
  
  Financial Quote Metrics:
  ${financialsStr}
  
  Web Search Insights:
  ${searchStr}
  
  News Sentiment Summary:
  ${research.newsSentiment}
  
  You MUST return a JSON object with the following fields:
  {
    "businessFundamentals": "Analysis of growth, profitability signals, P/E ratio, market cap, and revenue/earnings indicators if available.",
    "competitivePosition": "Analysis of market positioning, competitive advantages (economic moat), and comparisons with key competitors.",
    "risksAndRedFlags": "Critical business risks, regulatory hurdles, valuation concerns, or red flags.",
    "sentimentAnalysis": "Synthesis of public perception, recent news sentiment, and stock market sentiment."
  }
  
  Ensure the output is raw JSON ONLY. Do not include markdown formatting like \`\`\`json or \`\`\`. Start directly with { and end with }. IMPORTANT: All double quotes inside string values must be properly escaped with a backslash (\\"). Do NOT use unescaped double quotes inside JSON strings.`;

  try {
    const llm = getLLM(0.3, true); // JSON mode
    const response = await invokeLLMWithRetry(llm, prompt, 2);
    const textContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    
    // Parse response robustly with retry
    const parsedAnalysis = parseLLMJsonWithRetry(textContent);

    logs.push(...createLog("analysis", "Analysis of business models, financials, and risk vectors completed."));
    return {
      analysisData: {
        businessFundamentals: parsedAnalysis?.businessFundamentals || "Analysis data not provided.",
        competitivePosition: parsedAnalysis?.competitivePosition || "Analysis data not provided.",
        risksAndRedFlags: parsedAnalysis?.risksAndRedFlags || "Analysis data not provided.",
        sentimentAnalysis: parsedAnalysis?.sentimentAnalysis || research.newsSentiment || "No sentiment data provided.",
      },
      logs,
    };
  } catch (error: any) {
    console.error("[Analysis Node] Analysis LLM prompt failed after retries. Full stack trace:", error?.stack || error);
    logs.push(...createLog("analysis", "AI analysis node encountered parsing/LLM error. Returning structured fallback analysis."));
    
    // Structured error fallback instead of crashing
    return {
      analysisData: {
        businessFundamentals: "Analysis failed after retries. Structured data could not be parsed.",
        competitivePosition: "Competitive position evaluation incomplete.",
        risksAndRedFlags: "Risk evaluation incomplete due to LLM error.",
        sentimentAnalysis: research.newsSentiment || "Sentiment summary unavailable.",
      },
      logs,
    };
  }
}

/**
 * Node 3: Decision Node
 * Formulates the final Invest/Pass verdict, confidence rating, reasoning, and key risks.
 */
export async function decisionNode(state: AgentState) {
  const companyName = state.companyName;
  const research = state.researchData;
  const analysis = state.analysisData;
  const logs = [...createLog("decision", `Formulating final investment decision for ${companyName}...`)];

  if (!research || !analysis) {
    throw new Error("Decision Node executed without prior researchData or analysisData.");
  }

  const financials = research.financials;
  const financialsStr = financials 
    ? `Ticker: ${financials.symbol}, Market Cap: ${financials.marketCap}, P/E Ratio: ${financials.peRatio || 'N/A'}, Price: $${financials.price}` 
    : "No stock market stats available (unlisted or private company). Evaluate qualitative business strength.";

  const prompt = `You are the Chairman of the Investment Committee. Formulate a final investment verdict ("Invest" or "Pass") for ${companyName} based on the senior analyst's findings.
  
  Financial Context:
  ${financialsStr}
  
  Detailed Business Analysis:
  - Fundamentals: ${analysis.businessFundamentals}
  - Moat & Competitive Position: ${analysis.competitivePosition}
  - Sentiment: ${analysis.sentimentAnalysis}
  - Risks & Red Flags: ${analysis.risksAndRedFlags}
  
  You MUST return a JSON object with the following fields:
  {
    "decision": "Invest" or "Pass",
    "confidence": "Low" or "Medium" or "High",
    "reasoning": [
      "A list of 3 to 5 clear, objective, and distinct bullet points supporting your decision based on the facts."
    ],
    "keyRisks": [
      "A list of the 2 to 3 most critical risks that could derail this investment."
    ]
  }
  
  Ensure the output is raw JSON ONLY. Do not include markdown formatting like \`\`\`json or \`\`\`. Start directly with { and end with }. IMPORTANT: All double quotes inside string values must be properly escaped with a backslash (\\"). Do NOT use unescaped double quotes inside JSON strings.`;

  try {
    const llm = getLLM(0.1, true); // Low temperature for high consistency
    const response = await invokeLLMWithRetry(llm, prompt, 2);
    const textContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    
    const parsedDecision = parseLLMJsonWithRetry(textContent);

    const decision: "Invest" | "Pass" = parsedDecision?.decision === "Invest" ? "Invest" : "Pass";
    const confidence: "Low" | "Medium" | "High" = ["Low", "Medium", "High"].includes(parsedDecision?.confidence) 
      ? parsedDecision.confidence 
      : "Medium";

    logs.push(...createLog("decision", `Decision finalized: ${decision} (${confidence} Confidence).`));
    
    return {
      decision: {
        decision,
        confidence,
        reasoning: Array.isArray(parsedDecision?.reasoning) ? parsedDecision.reasoning : ["Reasoning generated based on qualitative & quantitative findings."],
        keyRisks: Array.isArray(parsedDecision?.keyRisks) ? parsedDecision.keyRisks : ["General market and operational risks apply."],
      },
      logs,
    };
  } catch (error: any) {
    console.error("[Decision Node] Decision prompt failed after retries. Full stack trace:", error?.stack || error);
    logs.push(...createLog("decision", "Final decision node failed. Returning structured conservative fallback verdict."));
    
    return {
      decision: {
        decision: "Pass" as const,
        confidence: "Low" as const,
        reasoning: ["AI decision node encountered execution error.", "Unable to complete full risk synthesis via LLM."],
        keyRisks: ["System execution interruption."],
      },
      logs,
    };
  }
}

/**
 * Wraps JSON parsing in try/catch with logging of raw output, code fence stripping,
 * quote repairing, and one retry attempt.
 */
function parseLLMJsonWithRetry(rawText: string): any {
  // Attempt 1: Strip code fences and parse
  try {
    return parseSingleAttempt(rawText);
  } catch (firstError: any) {
    console.warn("[LLM JSON Parse] First parse attempt failed. Raw output snippet:", rawText.slice(0, 1000));
    console.warn("[LLM JSON Parse] First error trace:", firstError?.stack || firstError);

    // Attempt 2: Clean unescaped control chars & repair unescaped quotes more aggressively
    try {
      let cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }

      cleaned = cleaned
        .replace(/[\u0000-\u001F]+/g, (m) => m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t"))
        .replace(/,\s*([\]}])/g, "$1");

      const repaired = repairUnescapedQuotes(cleaned);
      return JSON.parse(repaired);
    } catch (retryError: any) {
      console.error("[LLM JSON Parse] Retry attempt failed. Raw output:", rawText);
      console.error("[LLM JSON Parse] Full retry stack trace:", retryError?.stack || retryError);
      throw retryError;
    }
  }
}

function parseSingleAttempt(rawText: string): any {
  let text = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text);
}

function repairUnescapedQuotes(jsonStr: string): string {
  let inString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      if (!inString) {
        inString = true;
        result += char;
      } else {
        let nextChar = '';
        for (let j = i + 1; j < jsonStr.length; j++) {
          if (/\S/.test(jsonStr[j])) {
            nextChar = jsonStr[j];
            break;
          }
        }
        if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
          inString = false;
          result += char;
        } else {
          result += '\\"';
        }
      }
      continue;
    }

    result += char;
  }

  return result;
}
