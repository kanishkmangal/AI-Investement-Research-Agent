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
    
    // Create a ReadableStream to enable Server-Sent Events (SSE)
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (e) {
            console.error("[SSE Stream] Failed to enqueue data:", e);
          }
        };

        try {
          // 1. Send initial system startup log
          sendEvent("log", {
            node: "system",
            message: `Initializing Research Agent for: "${companyName.trim()}"...`,
            timestamp: new Date().toISOString()
          });

          // 2. Execute LangGraph stream
          console.log(`[API] Executing LangGraph for company: ${companyName}`);
          
          const runInput = { companyName: companyName.trim() };
          const runConfig = { recursionLimit: 15 };
          const agentStream = await graph.stream(runInput, runConfig);

          let accumulatedResearch: any = null;
          let accumulatedAnalysis: any = null;

          for await (const chunk of agentStream) {
            const typedChunk = chunk as Record<string, any>;
            const nodes = Object.keys(typedChunk);
            for (const nodeName of nodes) {
              const nodeOutput = typedChunk[nodeName];

              // Stream logs if present
              if (nodeOutput.logs && Array.isArray(nodeOutput.logs)) {
                for (const log of nodeOutput.logs) {
                  sendEvent("log", log);
                }
              }

              // Keep track of outputs as they complete
              if (nodeName === "research" && nodeOutput.researchData) {
                accumulatedResearch = nodeOutput.researchData;
                sendEvent("state", { node: "research", data: accumulatedResearch });
              }

              if (nodeName === "analysis" && nodeOutput.analysisData) {
                accumulatedAnalysis = nodeOutput.analysisData;
                sendEvent("state", { node: "analysis", data: accumulatedAnalysis });
              }

              if (nodeName === "decisionNode" && nodeOutput.decision) {
                // Once decision node completes, send the final compiled payload
                sendEvent("complete", {
                  companyName: companyName.trim(),
                  researchData: accumulatedResearch,
                  analysisData: accumulatedAnalysis,
                  decision: nodeOutput.decision
                });
              }
            }
          }
        } catch (error: any) {
          console.error("[SSE Stream] Error in LangGraph execution:", error);
          sendEvent("error", {
            message: error.message || "An unexpected error occurred during research pipeline execution."
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
    console.error("[API] Analyze API handler error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
