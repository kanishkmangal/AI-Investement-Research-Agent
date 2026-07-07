import { getLLM } from "../services/gemini";
import { searchWeb, SearchResult } from "../services/search";
import { getFinancials } from "../services/finance";
import { AgentState } from "./types";

// Helper to create timestamped logs
function createLog(node: "research" | "analysis" | "decision" | "system", message: string) {
  return [{
    node,
    message,
    timestamp: new Date().toISOString(),
  }];
}

/**
 * Node 1: Research Node
 * Gathers financials, web search results, and recent news sentiment.
 */
export async function researchNode(state: AgentState) {
  const companyName = state.companyName;
  console.log(`[Node: Research] Starting research for ${companyName}`);
  
  const logs = createLog("research", `Starting research for "${companyName}"...`);

  // 1. Resolve and fetch financial data
  let financials = null;
  try {
    logs.push(...createLog("research", "Querying Yahoo Finance for ticker and real-time quotes..."));
    financials = await getFinancials(companyName);
    if (financials) {
      logs.push(...createLog("research", `Successfully retrieved financial metrics for ticker ${financials.symbol}.`));
    } else {
      logs.push(...createLog("research", "No direct financial quote found. Falling back to search."));
    }
  } catch (error) {
    console.error("[Research Node] Financial fetch failed:", error);
    logs.push(...createLog("research", "Financial quote fetch encountered an error. Falling back to search."));
  }

  // 2. Perform web search queries concurrently
  logs.push(...createLog("research", "Initiating parallel web searches for fundamentals, competitive moat, and news..."));
  const searchQueries = [
    `"${companyName}" business model valuation market share`,
    `"${companyName}" competitors SWOT analysis positioning`,
    `"${companyName}" latest news sentiment stock performance`
  ];

  let webSearchHits: SearchResult[] = [];
  try {
    const searchPromises = searchQueries.map(q => searchWeb(q));
    const searchResults = await Promise.all(searchPromises);
    webSearchHits = searchResults.flat();
    
    logs.push(...createLog("research", `Retrieved ${webSearchHits.length} web search result articles/snippets.`));
  } catch (error) {
    console.error("[Research Node] Web search failed:", error);
    logs.push(...createLog("research", "Web search failed. Proceeding with available metrics."));
  }

  // 3. Summarize news sentiment via LLM
  let newsSentiment = "No recent news found.";
  if (webSearchHits.length > 0) {
    logs.push(...createLog("research", "Analyzing recent news sentiment using Gemini 2.5..."));
    try {
      const llm = getLLM(0.2); // low temperature for summarization
      const newsHitsStr = webSearchHits
        .slice(0, 8)
        .map((h, i) => `[Source ${i+1}]: ${h.title}\nContent: ${h.content}`)
        .join("\n\n");

      const prompt = `You are a financial news analyst. Based on the following news snippets about ${companyName}, summarize the overall recent sentiment (e.g., positive, neutral, negative) and highlight 3-4 key news events, earnings results, or product launches that are driving this sentiment. Keep it concise.
      
      News snippets:
      ${newsHitsStr}
      
      Summary of News Sentiment:`;

      const response = await llm.invoke(prompt);
      newsSentiment = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      logs.push(...createLog("research", "Completed recent news sentiment extraction."));
    } catch (error) {
      console.error("[Research Node] Sentiment summarization failed:", error);
      logs.push(...createLog("research", "News sentiment analysis failed. Using raw search fallback."));
      newsSentiment = "Unable to summarize sentiment due to API limits. Proceeding to analysis node.";
    }
  }

  return {
    researchData: {
      webSearchHits,
      financials,
      newsSentiment,
    },
    logs,
  };
}

/**
 * Node 2: Analysis Node
 * Processes research data to evaluate fundamentals, competitive position, and risks.
 */
export async function analysisNode(state: AgentState) {
  const companyName = state.companyName;
  const research = state.researchData;
  console.log(`[Node: Analysis] Starting business analysis for ${companyName}`);

  const logs = createLog("analysis", `Starting deep investment analysis for "${companyName}"...`);

  if (!research) {
    logs.push(...createLog("analysis", "Error: No research data available. Skipping detailed analysis."));
    return {
      analysisData: {
        businessFundamentals: "N/A",
        competitivePosition: "N/A",
        risksAndRedFlags: "N/A",
        sentimentAnalysis: "N/A",
      },
      logs,
    };
  }

  logs.push(...createLog("analysis", "Synthesizing business fundamentals, growth drivers, and market moat..."));

  // Build the analysis prompt
  const financialsStr = research.financials 
    ? JSON.stringify(research.financials, null, 2) 
    : "No quantitative financials available.";
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
  
  Ensure the output is raw JSON ONLY. Do not include markdown formatting like \`\`\`json or \`\`\`. Start directly with { and end with }.`;

  try {
    const llm = getLLM(0.3, true); // JSON mode
    const response = await llm.invoke(prompt);
    const textContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    
    // Parse response
    const cleanText = textContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedAnalysis = JSON.parse(cleanText);

    logs.push(...createLog("analysis", "Analysis of business models, financials, and risk vectors completed."));
    return {
      analysisData: {
        businessFundamentals: parsedAnalysis.businessFundamentals || "No data provided.",
        competitivePosition: parsedAnalysis.competitivePosition || "No data provided.",
        risksAndRedFlags: parsedAnalysis.risksAndRedFlags || "No data provided.",
        sentimentAnalysis: parsedAnalysis.sentimentAnalysis || "No data provided.",
      },
      logs,
    };
  } catch (error) {
    console.error("[Analysis Node] Analysis prompt failed:", error);
    logs.push(...createLog("analysis", "AI analysis node failed. Falling back to heuristic summary."));
    
    // Heuristic fallback
    return {
      analysisData: {
        businessFundamentals: "Analysis failed. Please check Gemini API configuration.",
        competitivePosition: "Analysis failed. Please check Gemini API configuration.",
        risksAndRedFlags: "Analysis failed. Please check Gemini API configuration.",
        sentimentAnalysis: research.newsSentiment,
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
  const analysis = state.analysisData;
  const financials = state.researchData?.financials;
  console.log(`[Node: Decision] Formulating final investment decision for ${companyName}`);

  const logs = createLog("decision", "Formulating final investment verdict...");

  if (!analysis) {
    logs.push(...createLog("decision", "Error: No analysis data available. Defaulting to Pass."));
    return {
      decision: {
        decision: "Pass" as const,
        confidence: "Low" as const,
        reasoning: ["No analysis data available."],
        keyRisks: ["Lack of data."],
      },
      logs,
    };
  }

  const financialsStr = financials 
    ? `Ticker: ${financials.symbol}, Market Cap: ${financials.marketCap}, P/E Ratio: ${financials.peRatio || 'N/A'}, Price: ${financials.price}` 
    : "No stock market stats available.";

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
  
  Ensure the output is raw JSON ONLY. Do not include markdown formatting like \`\`\`json or \`\`\`. Start directly with { and end with }.`;

  try {
    const llm = getLLM(0.1, true); // Low temperature for high consistency
    const response = await llm.invoke(prompt);
    const textContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    
    const cleanText = textContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedDecision = JSON.parse(cleanText);

    // Normalize values
    const decision: "Invest" | "Pass" = parsedDecision.decision === "Invest" ? "Invest" : "Pass";
    const confidence: "Low" | "Medium" | "High" = ["Low", "Medium", "High"].includes(parsedDecision.confidence) 
      ? parsedDecision.confidence 
      : "Medium";

    logs.push(...createLog("decision", `Decision finalized: ${decision} (${confidence} Confidence).`));
    
    return {
      decision: {
        decision,
        confidence,
        reasoning: Array.isArray(parsedDecision.reasoning) ? parsedDecision.reasoning : ["No details provided."],
        keyRisks: Array.isArray(parsedDecision.keyRisks) ? parsedDecision.keyRisks : ["No details provided."],
      },
      logs,
    };
  } catch (error) {
    console.error("[Decision Node] Final decision formulation failed:", error);
    logs.push(...createLog("decision", "Failed to formulate structured decision due to LLM error. Defaulting to Pass."));
    
    return {
      decision: {
        decision: "Pass" as const,
        confidence: "Low" as const,
        reasoning: ["Final decision failed to parse. Please check LLM credentials."],
        keyRisks: ["System execution error."],
      },
      logs,
    };
  }
}
