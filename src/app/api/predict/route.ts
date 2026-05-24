import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Advanced Local Cricket Intelligence Engine (Fallback & Base logic)
function calculateLocalEmotion(
  score: string,
  requiredRuns: number,
  ballsLeft: number,
  wicketsLeft: number,
  runRate: number,
  requiredRunRate: number,
  strikeRate: number,
  pressure: number
) {
  // 1. Tension Score (0 - 100)
  // Higher required run rate, lower balls left, lower wickets left, and high pressure slider increase tension
  let tension = 30 + pressure * 4;
  
  if (ballsLeft > 0) {
    const rrrDiff = requiredRunRate - runRate;
    if (rrrDiff > 0) {
      tension += rrrDiff * 4.5;
    } else {
      tension += rrrDiff * 1.5; // less impact if chasing easily
    }
  }

  if (ballsLeft < 30 && ballsLeft > 0) {
    tension += (30 - ballsLeft) * 1.2;
  }

  if (wicketsLeft <= 4 && wicketsLeft > 0) {
    tension += (5 - wicketsLeft) * 8;
  } else if (wicketsLeft === 0) {
    tension = 100; // Match is essentially over unless they already won
  }

  tension = Math.max(10, Math.min(100, Math.round(tension)));

  // 2. Excitement Score (0 - 100)
  // High when required runs are close to balls left (tight chase), high strike rate, high pressure
  let excitement = 40 + pressure * 3.5;
  
  if (ballsLeft > 0 && requiredRuns > 0) {
    const runBallRatio = requiredRuns / ballsLeft;
    // Ratio close to 1-1.5 is peak excitement (run-a-ball or big hits needed)
    const ratioCloseness = Math.abs(1.2 - runBallRatio);
    excitement += Math.max(0, (2 - ratioCloseness) * 12);
  }

  if (strikeRate > 140) {
    excitement += (strikeRate - 140) * 0.25;
  }

  if (ballsLeft > 0 && ballsLeft <= 18) {
    excitement += (18 - ballsLeft) * 1.5;
  }

  excitement = Math.max(20, Math.min(100, Math.round(excitement)));

  // 3. Suspense Level (0 - 100)
  // Deep combination of tension and excitement. High when outcome is highly uncertain.
  let suspense = (tension * 0.55) + (excitement * 0.45);
  
  // If match is in the death overs (balls left < 12) and wickets are left, suspense is extreme
  if (ballsLeft > 0 && ballsLeft <= 12 && wicketsLeft > 1) {
    suspense += (12 - ballsLeft) * 2;
  }

  suspense = Math.max(10, Math.min(100, Math.round(suspense)));

  // 4. Win Probability (%)
  let winProbability = 50;
  if (requiredRuns <= 0) {
    winProbability = 100;
  } else if (ballsLeft <= 0 && requiredRuns > 0) {
    winProbability = 0;
  } else if (wicketsLeft <= 0 && requiredRuns > 0) {
    winProbability = 0;
  } else {
    // Standard cricket math representation for win probability
    const wicketsWeight = wicketsLeft * 6.5;
    const rrrPenalty = requiredRunRate * 4.0;
    const strikeRateBonus = (strikeRate - 120) * 0.15;
    const baseChaseStrength = (runRate - requiredRunRate) * 3;

    winProbability = 50 + wicketsWeight - rrrPenalty + strikeRateBonus + baseChaseStrength;
    
    // Smooth out final probability
    winProbability = Math.max(2, Math.min(98, Math.round(winProbability)));
  }

  // 5. Dominance Analysis
  let dominance: "Batting" | "Bowling" | "Balanced" = "Balanced";
  if (requiredRuns > 0 && ballsLeft > 0) {
    if (requiredRunRate > runRate + 4.5 || wicketsLeft <= 3) {
      dominance = "Bowling";
    } else if (requiredRunRate < runRate - 1.5 && wicketsLeft >= 6 && strikeRate >= 140) {
      dominance = "Batting";
    }
  }

  // 6. Stadium Atmosphere
  let atmosphere: "Electric" | "Nervous" | "Chaotic" | "Silent" | "Explosive" = "Electric";
  if (tension >= 85 && excitement >= 85) {
    atmosphere = "Explosive";
  } else if (tension >= 75 && wicketsLeft <= 3 && winProbability < 45) {
    atmosphere = "Nervous";
  } else if (tension >= 80 && winProbability >= 40 && winProbability <= 60) {
    atmosphere = "Chaotic";
  } else if (excitement < 45 && requiredRunRate > 16) {
    atmosphere = "Silent";
  } else {
    atmosphere = "Electric";
  }

  // 7. Dynamic AI-style commentary generation
  let commentary = "";
  
  if (requiredRuns <= 0) {
    commentary = "It's all over! A sensational chase. The batting side has crossed the line, celebrating in absolute style. What a clinical performance!";
  } else if (ballsLeft <= 0 || wicketsLeft <= 0) {
    commentary = "Cruel heartbreak! The bowling side has sealed the victory with clinical precision. The stadium erupts as the final defense holds strong!";
  } else if (ballsLeft <= 12) {
    // Death overs commentary
    if (requiredRunRate > 15) {
      commentary = `This is monumental! ${requiredRuns} needed off just ${ballsLeft} deliveries. The bowler is steaming in, eyes locked on the stumps. The batter must clear the ropes now, or it's game over!`;
    } else if (wicketsLeft <= 2) {
      commentary = `On a knife's edge! Just ${wicketsLeft} wickets remaining. One mistake, one fine edge, and the bowling unit takes it all. The fielders are circling like hawks!`;
    } else {
      commentary = `Spectacular grandstand finish! ${requiredRuns} runs, ${ballsLeft} balls, ${wicketsLeft} wickets. The crowd is deafening. Every single delivery is a massive tactical battle!`;
    }
  } else {
    // Middle/late overs commentary
    if (requiredRunRate > runRate + 3) {
      commentary = `The squeeze is well and truly on! The required rate has crept up to ${requiredRunRate.toFixed(1)}. The batters are feeling the heat, trying to accelerate against a disciplined bowling setup.`;
    } else if (strikeRate >= 180) {
      commentary = `Unbelievable hitting! Operating at a destructive strike rate of ${strikeRate}%, the batting side is turning the screws on the captain. The bowlers look completely out of answers.`;
    } else if (pressure >= 8) {
      commentary = `The pressure is suffocating! Under the blinding lights of this World Cup atmosphere, every dot ball feels like a ticking time bomb. Both sides refusing to yield an inch.`;
    } else {
      commentary = `A highly tactical run chase unfolding. The current rate is ${runRate.toFixed(1)}, but they need ${requiredRunRate.toFixed(1)} to secure the win. It is a game of patience and execution.`;
    }
  }

  // 8. Match Prediction
  let prediction = "A highly competitive finish awaits both sides.";
  if (requiredRuns > 0 && ballsLeft > 0) {
    if (requiredRunRate > 24) {
      prediction = "Bowling side heavily favored. An almost impossible mountain to climb.";
    } else if (requiredRunRate > 15 && ballsLeft <= 18) {
      prediction = "Bowling side retains control, but a couple of big hits could turn this chaotic.";
    } else if (requiredRunRate < 6 && wicketsLeft >= 5) {
      prediction = "Cruise control for the chasing side. Likely to wrap up with overs to spare.";
    } else if (ballsLeft <= 12 && requiredRuns <= 18 && wicketsLeft >= 3) {
      prediction = "Absolute final-over thriller incoming. Tense, nail-biting finish guaranteed!";
    } else if (wicketsLeft <= 2) {
      prediction = "One clean delivery away from a bowling triumph. Maximum pressure on the tailenders.";
    } else if (winProbability > 75) {
      prediction = "Batting team in command; expected to seal the victory shortly.";
    } else if (winProbability < 25) {
      prediction = "Bowlers holding the line brilliantly; victory within their grasp.";
    }
  } else {
    prediction = "Match concluded.";
  }

  return {
    excitement,
    tension,
    dominance,
    suspense,
    winProbability,
    atmosphere,
    commentary,
    prediction,
  };
}

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

    // Validate impossible values
    if (requiredRuns < 0) {
      return NextResponse.json(
        { error: "Required Runs cannot be negative" },
        { status: 400 }
      );
    }
    if (requiredRunRate < 0) {
      return NextResponse.json(
        { error: "Required Run Rate cannot be negative" },
        { status: 400 }
      );
    }
    if (wicketsLeft < 0 || wicketsLeft > 10) {
      return NextResponse.json(
        { error: "Wickets left must be between 0 and 10" },
        { status: 400 }
      );
    }
    if (ballsLeft < 0) {
      return NextResponse.json(
        { error: "Balls left cannot be negative" },
        { status: 400 }
      );
    }

    // 1. Calculate local values as base/fallback
    const localResult = calculateLocalEmotion(
      score,
      Number(requiredRuns),
      Number(ballsLeft),
      Number(wicketsLeft),
      Number(runRate),
      Number(requiredRunRate),
      Number(strikeRate),
      Number(pressure)
    );

    // 2. Try to use Gemini API if available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `You are an elite cricket analyst and television commentator.
Your task is to convert cricket match statistics into emotional match analysis.

Inputs:
- Current Score: ${score}
- Required Runs: ${requiredRuns}
- Balls Left: ${ballsLeft}
- Wickets Left: ${wicketsLeft}
- Current Run Rate: ${runRate}
- Required Run Rate: ${requiredRunRate}
- Batter Strike Rate: ${strikeRate}
- Match Pressure Level: ${pressure}/10 (1 = Friendly Match, 5 = League Match, 10 = World Cup Final)

Analyze this match situation and return your predictions using exact cricket logic:
- Low wickets left (<=3) or high Required Run Rate dramatically increases Tension.
- Close run/ball ratios or a World Cup Final setting spikes Excitement and Suspense.
- High strike rate (>150) or Required Run Rate lower than Current Run Rate gives dominance to "Batting". If Required Run Rate is much higher or wickets left is low, give dominance to "Bowling". Otherwise, return "Balanced".
- Atmosphere must be one of: "Electric", "Nervous", "Chaotic", "Silent", "Explosive".
- Commentary must sound exactly like a live TV broadcast (tense, professional, exciting, 2-3 lines max, e.g. "Steaming in under the floodlights, the bowler delivers a yorker...").
- Final prediction must summarize the projected outcome in one crisp sentence.

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

        // Quick validation of the AI response structure
        if (
          typeof aiResponse.excitement === "number" &&
          typeof aiResponse.tension === "number" &&
          typeof aiResponse.suspense === "number" &&
          typeof aiResponse.winProbability === "number" &&
          aiResponse.dominance &&
          aiResponse.atmosphere &&
          aiResponse.commentary &&
          aiResponse.prediction
        ) {
          return NextResponse.json(aiResponse);
        }
      } catch (aiError) {
        console.error("Gemini API Error, falling back to local intelligence:", aiError);
        // Fail silently to local calculations to ensure zero user disruption
      }
    }

    // Return mathematically derived local analytics if no Gemini key or on error
    return NextResponse.json(localResult);
  } catch (error) {
    console.error("Prediction endpoint crash:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
