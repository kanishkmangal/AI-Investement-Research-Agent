import { Annotation } from "@langchain/langgraph";
import { AgentLogStep, ResearchData, AnalysisData, DecisionData } from "./types";

export const AgentStateAnnotation = Annotation.Root({
  companyName: Annotation<string>(),
  researchData: Annotation<ResearchData>(),
  analysisData: Annotation<AnalysisData>(),
  decision: Annotation<DecisionData>(),
  logs: Annotation<AgentLogStep[]>({
    reducer: (stateLogs, newLogs) => [...stateLogs, ...newLogs],
    default: () => [],
  }),
});
