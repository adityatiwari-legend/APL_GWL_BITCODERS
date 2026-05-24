import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      score,
      requiredRuns,
      ballsLeft,
      wicketsLeft,
      runRate,
      requiredRunRate,
      strikeRate,
      pressure,
    } = body;

    // Standard input validation
    if (
      score === undefined ||
      requiredRuns === undefined ||
      ballsLeft === undefined ||
      wicketsLeft === undefined ||
      runRate === undefined ||
      requiredRunRate === undefined ||
      strikeRate === undefined ||
      pressure === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Input validation: Prevent impossible values
    if (Number(requiredRuns) < 0) {
      return NextResponse.json(
        { error: "Required Runs cannot be negative" },
        { status: 400 }
      );
    }
    if (Number(requiredRunRate) < 0) {
      return NextResponse.json(
        { error: "Required Run Rate cannot be negative" },
        { status: 400 }
      );
    }
    if (Number(wicketsLeft) < 0 || Number(wicketsLeft) > 10) {
      return NextResponse.json(
        { error: "Wickets left must be between 0 and 10" },
        { status: 400 }
      );
    }
    if (Number(ballsLeft) < 0) {
      return NextResponse.json(
        { error: "Balls left cannot be negative" },
        { status: 400 }
      );
    }

    // Validate score format (e.g. 145/6)
    const scoreRegex = /^\d+\/(10|[0-9])$/;
    if (!scoreRegex.test(score)) {
      return NextResponse.json(
        { error: "Current Score must be in 'Runs/Wickets' format (e.g. 145/6). Wickets cannot exceed 10." },
        { status: 400 }
      );
    }

    const model = getGeminiModel();
    if (!model) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured. Please add GEMINI_API_KEY in your .env file." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an elite cricket analyst.
Analyze this match situation and return your predictions using exact cricket logic:
- Low wickets left (<=3) or high Required Run Rate dramatically increases Tension.
- Close run/ball ratios or a World Cup Final setting spikes Excitement and Suspense.
- High strike rate (>150) or Required Run Rate lower than Current Run Rate gives dominance to "Batting". If Required Run Rate is much higher or wickets left is low, give dominance to "Bowling". Otherwise, return "Balanced".
- Atmosphere must be one of: "Electric", "Nervous", "Chaotic", "Silent", "Explosive".
- Commentary must sound exactly like a live TV broadcast (tense, professional, exciting, 2-3 lines max).
- Final prediction must summarize the projected outcome in one crisp sentence.

Inputs:
- Current Score: ${score}
- Required Runs: ${requiredRuns}
- Balls Left: ${ballsLeft}
- Wickets Left: ${wicketsLeft}
- Current Run Rate: ${runRate}
- Required Run Rate: ${requiredRunRate}
- Batter Strike Rate: ${strikeRate}
- Match Pressure Level: ${pressure}/10 (1 = Friendly Match, 5 = League Match, 10 = World Cup Final)

Return ONLY a valid JSON object matching the following structure, with NO markdown formatting, NO backticks, and NO surrounding text:
{
  "excitement": 95,
  "tension": 89,
  "dominance": "Batting" | "Bowling" | "Balanced",
  "suspense": 97,
  "winProbability": 61,
  "atmosphere": "Explosive" | "Electric" | "Nervous" | "Chaotic" | "Silent",
  "commentary": "The pressure is immense. Every delivery could shift the momentum completely.",
  "prediction": "Likely to finish in final over."
}`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().trim();
    
    // Sanitize JSON output (strip potential markdown fences if returned)
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "")
      .trim();

    const aiResponse = JSON.parse(cleanedText);

    // Validate structure of response
    if (
      typeof aiResponse.excitement !== "number" ||
      typeof aiResponse.tension !== "number" ||
      typeof aiResponse.suspense !== "number" ||
      typeof aiResponse.winProbability !== "number" ||
      !aiResponse.dominance ||
      !aiResponse.atmosphere ||
      !aiResponse.commentary ||
      !aiResponse.prediction
    ) {
      throw new Error("Invalid response format received from Gemini");
    }

    return NextResponse.json(aiResponse);
  } catch (error: unknown) {
    console.error("Match Analysis API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during match emotional analysis.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
