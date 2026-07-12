import { ChatGroq } from "@langchain/groq";

export function getLLM(temperature = 0.2, jsonMode = false) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not defined.");
  }

  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  console.log(`[LLM] Initializing ${modelName} with temperature=${temperature}${jsonMode ? " (JSON Mode)" : ""}`);

  const options: any = {
    model: modelName,
    apiKey: apiKey,
    temperature: temperature,
    maxRetries: 2,
  };

  if (jsonMode) {
    options.modelKwargs = {
      response_format: { type: "json_object" },
    };
  }

  return new ChatGroq(options);
}

/**
 * Invokes a Groq LLM with exponential backoff retries (default 2 retries).
 * Logs full error messages and stack traces on failures.
 */
export async function invokeLLMWithRetry(llm: ChatGroq, prompt: string, maxRetries = 2): Promise<any> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await llm.invoke(prompt);
    } catch (error: any) {
      attempt++;
      console.error(
        `[LLM Retry] Groq LLM call failed on attempt ${attempt}/${maxRetries + 1}. Full error trace:`,
        error?.stack || error
      );
      if (attempt > maxRetries) {
        throw error;
      }
      const delayMs = Math.pow(2, attempt - 1) * 1000; // 1000ms, 2000ms
      console.warn(`[LLM Retry] Retrying Groq call in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
