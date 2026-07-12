import { NextRequest } from "next/server";
import { graph } from "@/lib/agent/graph";

// Force dynamic execution for Vercel deployment to prevent static page rendering
export const dynamic = "force-dynamic";
// Extend timeout limit to 60 seconds to accommodate web search and multiple LLM calls
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim() === "") {
      return new Response(JSON.stringify({ error: "Company name is required and must be a string." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (e) {
            console.error("[SSE Stream] Failed to enqueue data:", e);
          }
        };

        let accumulatedResearch: any = null;
        let accumulatedAnalysis: any = null;
        let accumulatedDecision: any = null;
        const failedComponents: string[] = [];

        try {
          sendEvent("log", {
            node: "system",
            message: `Initializing Resilient Research Agent for: "${companyName.trim()}"...`,
            timestamp: new Date().toISOString()
          });

          console.log(`[API] Executing LangGraph for company: ${companyName}`);

          const runInput = { companyName: companyName.trim() };
          const runConfig = { recursionLimit: 15 };
          const agentStream = await graph.stream(runInput, runConfig);

          for await (const chunk of agentStream) {
            const typedChunk = chunk as Record<string, any>;
            const nodes = Object.keys(typedChunk);
            for (const nodeName of nodes) {
              const nodeOutput = typedChunk[nodeName];

              if (nodeOutput.logs && Array.isArray(nodeOutput.logs)) {
                for (const log of nodeOutput.logs) {
                  sendEvent("log", log);
                  if (typeof log.message === "string" && (
                    log.message.toLowerCase().includes("failed") ||
                    log.message.toLowerCase().includes("error") ||
                    log.message.toLowerCase().includes("fallback")
                  )) {
                    if (!failedComponents.includes(log.node || nodeName)) {
                      failedComponents.push(log.node || nodeName);
                    }
                  }
                }
              }

              if (nodeName === "research" && nodeOutput.researchData) {
                accumulatedResearch = nodeOutput.researchData;
                sendEvent("state", { node: "research", data: accumulatedResearch });
              }

              if (nodeName === "analysis" && nodeOutput.analysisData) {
                accumulatedAnalysis = nodeOutput.analysisData;
                sendEvent("state", { node: "analysis", data: accumulatedAnalysis });
              }

              if (nodeName === "decisionNode" && nodeOutput.decision) {
                accumulatedDecision = nodeOutput.decision;
                sendEvent("complete", {
                  companyName: companyName.trim(),
                  researchData: accumulatedResearch || { companyName, financials: null, webSearchHits: [], newsSentiment: "Data retrieval incomplete." },
                  analysisData: accumulatedAnalysis || {
                    businessFundamentals: "Analysis incomplete.",
                    competitivePosition: "Analysis incomplete.",
                    risksAndRedFlags: "Analysis incomplete.",
                    sentimentAnalysis: "Analysis incomplete."
                  },
                  decision: accumulatedDecision,
                  partialFailure: failedComponents.length > 0,
                  failedComponents
                });
              }
            }
          }
        } catch (error: any) {
          console.error("[SSE Stream] Partial or unexpected error in LangGraph execution. Full stack trace:", error?.stack || error);
          if (!failedComponents.includes("pipeline")) {
            failedComponents.push("pipeline");
          }

          sendEvent("log", {
            node: "system",
            message: `Pipeline encountered interruption (${error?.message || "Execution error"}). Returning successfully gathered partial data.`,
            timestamp: new Date().toISOString()
          });

          // Return whatever partial data was successfully gathered along with partialFailure indicators
          sendEvent("complete", {
            companyName: companyName.trim(),
            researchData: accumulatedResearch || { companyName, financials: null, webSearchHits: [], newsSentiment: "Data retrieval incomplete." },
            analysisData: accumulatedAnalysis || {
              businessFundamentals: "Analysis incomplete due to interruption.",
              competitivePosition: "Analysis incomplete due to interruption.",
              risksAndRedFlags: "Analysis incomplete due to interruption.",
              sentimentAnalysis: "Analysis incomplete due to interruption."
            },
            decision: accumulatedDecision || {
              decision: "Pass",
              confidence: "Low",
              reasoning: ["Pipeline execution encountered an interruption.", error?.message || "Check server logs."],
              keyRisks: ["Incomplete data processing."]
            },
            partialFailure: true,
            failedComponents
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      }
    });

  } catch (error: any) {
    console.error("[API] Analyze API handler error. Full trace:", error?.stack || error);
    return new Response(JSON.stringify({ error: error.message || "Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
