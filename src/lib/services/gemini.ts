import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getLLM(temperature = 0.2, jsonMode = false) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not defined.");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  console.log(`[LLM] Initializing ${modelName} with temperature=${temperature}${jsonMode ? " (JSON Mode)" : ""}`);

  const options: any = {
    modelName: modelName,
    apiKey: apiKey,
    temperature: temperature,
  };

  if (jsonMode) {
    options.responseMimeType = "application/json";
  }

  return new ChatGoogleGenerativeAI(options);
}