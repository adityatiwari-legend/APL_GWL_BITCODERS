import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

// Initialize the Google Generative AI SDK if API Key is available
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Returns the Gemini 2.5 Flash model instance, or null if SDK is not initialized.
 */
export function getGeminiModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}
