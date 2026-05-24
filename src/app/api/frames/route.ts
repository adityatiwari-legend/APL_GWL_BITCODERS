import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const framesDirectory = path.join(process.cwd(), "public", "Assets", "frames");
    
    if (!fs.existsSync(framesDirectory)) {
      return NextResponse.json({ error: "Frames directory not found" }, { status: 404 });
    }

    const files = fs.readdirSync(framesDirectory);
    
    // Support png, jpg, jpeg, and webp extensions
    const imageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const frameFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Numerical sort extraction function (extract numbers from filename, e.g. ezgif-frame-001.jpg -> 1)
    const extractNumber = (filename: string): number => {
      const match = filename.match(/(\d+)/);
      return match ? parseInt(match[0], 10) : 0;
    };

    // Sort numerically so sequence frames are properly aligned
    frameFiles.sort((a, b) => {
      const numA = extractNumber(a);
      const numB = extractNumber(b);
      return numA - numB;
    });

    // Map into absolute web URLs
    const framePaths = frameFiles.map((file) => `/Assets/frames/${file}`);

    return NextResponse.json({ frames: framePaths });
  } catch (error: unknown) {
    console.error("Frames detection error:", error);
    return NextResponse.json({ error: "Failed to load frames list" }, { status: 500 });
  }
}
