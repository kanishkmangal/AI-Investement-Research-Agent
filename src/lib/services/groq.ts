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
  };

  if (jsonMode) {
    options.modelKwargs = {
      response_format: { type: "json_object" },
    };
  }

  return new ChatGroq(options);
}
