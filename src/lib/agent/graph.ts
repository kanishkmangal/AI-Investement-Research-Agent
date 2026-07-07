import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state";
import { researchNode, analysisNode, decisionNode } from "./nodes";

// Build the LangGraph.js workflow graph
const workflow = new StateGraph(AgentStateAnnotation)
  // 1. Register the nodes
  .addNode("research", researchNode)
  .addNode("analysis", analysisNode)
  .addNode("decisionNode", decisionNode)
  
  // 2. Set up the execution pipeline
  .addEdge(START, "research")
  .addEdge("research", "analysis")
  .addEdge("analysis", "decisionNode")
  .addEdge("decisionNode", END);

// Compile the graph
export const graph = workflow.compile();
export type InvestmentAgentGraphType = typeof graph;
export { AgentStateAnnotation };
