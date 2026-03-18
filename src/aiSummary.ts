import * as dotenv from "dotenv";
import * as path from "path";
import { SymbolKind } from "vscode";
import { fallbackSummary } from "./app/fallback";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

export async function getAiSummary(commitDiff: string): Promise<string> {
  const API_KEY = process.env.API_KEY?.trim();
  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

  if (!API_KEY) {
    return "Error: No API Key found in .env file.";
  }

  try {
    const MAX_DIFF_LENGTH = 5000; // Set a limit
    let trimmedDiff = commitDiff;

    if (commitDiff.length > MAX_DIFF_LENGTH) {
      trimmedDiff =
        commitDiff.slice(0, MAX_DIFF_LENGTH) + "\n... (diff truncated)";
    }

    const prompt = `You are a savage coding buddy. Look at this code diff and summarize what the developer just built or changed in 1-2 fun sentences. Be funny, encouraging with savage duolingo-like humour: \n\n"${trimmedDiff}"`;

    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1024, // Bump tokens
        },
      }),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Gemini API Error:", response.status, JSON.stringify(data));
      return fallbackSummary(); // Added fallback
    }

    // Checks for data->candidates->first item of arr->content->first part->text
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const fullSummary = data.candidates[0].content.parts[0].text;
      const finishReason = data.candidates[0].finishReason;
      console.log("Full Gemini Summary:", fullSummary);
      console.log("Finish Reason:", finishReason);
      return fullSummary;
    }

    return "Error: Unexpected response format from Gemini.";
  } catch (error: any) {
    console.error("Fetch error:", error);
    return `Error: ${error.message || "Unknown fetch error"}`;
  }
}
