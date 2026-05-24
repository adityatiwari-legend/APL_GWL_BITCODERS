import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import ffmpegPath from "ffmpeg-static";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Cross-platform & Serverless-compatible temporary uploads folder
const TEMP_DIR = os.tmpdir();

// Get absolute path to static FFmpeg binary in a Turbopack-safe manner
const getFfmpegPath = (): string | null => {
  const customPath = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  
  // Fallback if custom path doesn't exist
  return ffmpegPath;
};

// Helper function to extract video duration using static FFmpeg
const getVideoDuration = (videoPath: string): Promise<number> => {
  return new Promise((resolve) => {
    const activeFfmpeg = getFfmpegPath();
    if (!activeFfmpeg) {
      return resolve(10); // default fallback duration
    }
    exec(`"${activeFfmpeg}" -i "${videoPath}"`, (error, stdout, stderr) => {
      const output = stderr || stdout || "";
      const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseInt(match[3]);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        return resolve(totalSeconds || 10);
      }
      resolve(10); // default fallback
    });
  });
};

// Helper function to extract a single frame at a specific timestamp
const extractFrame = (
  videoPath: string,
  timeSeconds: number,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const activeFfmpeg = getFfmpegPath();
    if (!activeFfmpeg) {
      return reject(new Error("FFmpeg binary path not found."));
    }
    // Extract a high quality frame at ss time
    exec(
      `"${activeFfmpeg}" -y -ss ${timeSeconds} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`,
      (error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      }
    );
  });
};

// Helper to convert local file to Gemini API format
const fileToGenerativePart = (filePath: string, mimeType: string) => {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
};

export async function POST(req: Request) {
  const createdFiles: string[] = [];
  
  try {
    // Ensure temporary uploads directory exists inside workspace CWD
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const style = formData.get("style") as string;
    const language = formData.get("language") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file was uploaded." },
        { status: 400 }
      );
    }

    // Enforce limits: Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds the maximum limit of 25MB." },
        { status: 400 }
      );
    }

    const fileExtension = path.extname(file.name).toLowerCase();
    const isImage = [".png", ".jpg", ".jpeg"].includes(fileExtension);
    const isVideo = [".mp4", ".mov"].includes(fileExtension);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload MP4, MOV, PNG, or JPG." },
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

    const inlineImages: {
      inlineData: {
        data: string;
        mimeType: string;
      };
    }[] = [];
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isImage) {
      // 1. Process Image upload directly without FFmpeg
      const imgPath = path.join(TEMP_DIR, `${uniqueId}${fileExtension}`);
      createdFiles.push(imgPath);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(imgPath, buffer);

      const mimeType = file.type || (fileExtension === ".png" ? "image/png" : "image/jpeg");
      inlineImages.push(fileToGenerativePart(imgPath, mimeType));

    } else {
      // 2. Process Video upload using FFmpeg frame extraction
      const videoPath = path.join(TEMP_DIR, `${uniqueId}${fileExtension}`);
      createdFiles.push(videoPath);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(videoPath, buffer);

      // Analyze duration to extract Frame 1 (10%), Middle Frame (50%), Last Frame (90%)
      const duration = await getVideoDuration(videoPath);
      
      const t1 = Math.max(0.1, duration * 0.1);
      const t2 = duration * 0.5;
      const t3 = Math.min(duration - 0.2, duration * 0.9);

      const framePaths = [
        path.join(TEMP_DIR, `frame1-${uniqueId}.jpg`),
        path.join(TEMP_DIR, `frame2-${uniqueId}.jpg`),
        path.join(TEMP_DIR, `frame3-${uniqueId}.jpg`),
      ];

      // Extract each of the three frames
      await extractFrame(videoPath, t1, framePaths[0]);
      createdFiles.push(framePaths[0]);

      await extractFrame(videoPath, t2, framePaths[1]);
      createdFiles.push(framePaths[1]);

      await extractFrame(videoPath, t3, framePaths[2]);
      createdFiles.push(framePaths[2]);

      // Convert extracted frames to inline parts
      framePaths.forEach((fPath) => {
        if (fs.existsSync(fPath)) {
          inlineImages.push(fileToGenerativePart(fPath, "image/jpeg"));
        }
      });
    }

    if (inlineImages.length === 0) {
      throw new Error("Failed to extract analyze-ready visual frames from upload.");
    }

    const commentaryStylePrompt = `You are an elite cricket commentator broadcasting a match.
Analyze the provided visual frames representing key moments of the action.

Analyze the action, shot play, bowling technique, player movement, field placement, and stadium atmosphere. 
Deliver an analytical and engaging commentary report tailored exactly to these settings:
- Style: ${style} (e.g. "Professional" = tactical and precise; "IPL Excited" = high-energy, screaming, dramatic boundary calls; "Hindi Commentary" = rich Hindi broadcast phrases; "Funny" = humorous jabs; "Radio Style" = descriptive, fast-paced).
- Language: ${language} (If "Hindi", generate the commentary using beautiful, natural Hindi phrases, but in standard readable script. If "English", generate in fluent broadcast English).

Analyze and return the following exact information:
1. Commentary: 2 to 3 lines of highly descriptive broadcast commentary.
2. Highlight: A brief review of the key moment depicted in the frames (1 sentence).
3. Excitement: An excitement score between 0 and 100.
4. Player: Who was the "Player of the Moment" depicted in the visual feed.
5. Caption: A catchy, viral social media caption with hashtags.

Rules:
- Make the commentary sound exactly like a live, professional TV broadcast.
- The overall commentary must be realistic, concise, and under 150 words.
- Do not make up facts unrelated to the visual layout.

Return ONLY a valid JSON object matching the following structure, with NO markdown formatting, NO backticks, and NO surrounding text:
{
  "commentary": "Your realistic live-style broadcast commentary here",
  "highlight": "Description of the key highlights of the visual play",
  "excitement": 85,
  "player": "Name/Role of the key player in this moment",
  "caption": "A viral social caption here #Cricket #CrickVoice"
}`;

    // Query Gemini 2.5 Flash with prompt and images
    const result = await model.generateContent([commentaryStylePrompt, ...inlineImages]);
    const text = result.response.text().trim();

    // Sanitize JSON response
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "")
      .trim();

    const aiResponse = JSON.parse(cleanedText);

    // Validate response payload integrity
    if (
      !aiResponse.commentary ||
      !aiResponse.highlight ||
      typeof aiResponse.excitement !== "number" ||
      !aiResponse.player ||
      !aiResponse.caption
    ) {
      throw new Error("Invalid response format received from Gemini SDK.");
    }

    return NextResponse.json(aiResponse);
  } catch (error: unknown) {
    console.error("Video Commentary Route Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during visual frame analysis.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Garbage collection: Forceful clean up of temporary files in workspace
    createdFiles.forEach((fPath) => {
      try {
        if (fs.existsSync(fPath)) {
          fs.unlinkSync(fPath);
        }
      } catch (cleanupError) {
        console.error(`Temporary cleanup failed for: ${fPath}`, cleanupError);
      }
    });
  }
}
