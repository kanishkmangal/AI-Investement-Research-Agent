import { SearchResult } from "../services/search";
import { FinancialMetrics } from "../services/finance";

export interface AgentLogStep {
  node: "research" | "analysis" | "decision" | "system";
  message: string;
  timestamp: string;
}

export interface ResearchData {
  webSearchHits: SearchResult[];
  financials: FinancialMetrics | null;
  newsSentiment: string;
}

export interface AnalysisData {
  businessFundamentals: string;
  competitivePosition: string;
  risksAndRedFlags: string;
  sentimentAnalysis: string;
}

export interface DecisionData {
  decision: "Invest" | "Pass";
  confidence: "Low" | "Medium" | "High";
  reasoning: string[];
  keyRisks: string[];
}

export interface AgentState {
  companyName: string;
  researchData?: ResearchData;
  analysisData?: AnalysisData;
  decision?: DecisionData;
  logs: AgentLogStep[];
}
