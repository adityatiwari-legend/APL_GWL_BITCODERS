"use client";

import React, { useRef, useEffect, useState } from "react";
import { preloadStartingBatch } from "@/lib/preloadFrames";
import { useScrollFrames } from "@/hooks/useScrollFrames";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";

interface FramePlayerProps {
  onIntroFinished: () => void;
}

export const FramePlayer: React.FC<FramePlayerProps> = ({ onIntroFinished }) => {
  const [framePaths, setFramePaths] = useState<string[]>([]);
  const [preloadedImages, setPreloadedImages] = useState<HTMLImageElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // 1. Fetch dynamic frames from server-side directory scanner with client-side fallback
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch("/api/frames");
        const data = await res.json();
        if (data.frames && data.frames.length > 0) {
          setFramePaths(data.frames);
        } else {
          // Fallback to static sequence array if API returns empty
          console.warn("API returned empty frames list, generating static client fallback...");
          const generatedList = Array.from({ length: 240 }, (_, i) => {
            const num = String(i + 1).padStart(3, "0");
            return `/Assets/frames/ezgif-frame-${num}.jpg`;
          });
          setFramePaths(generatedList);
        }
      } catch (err) {
        console.error("Failed to load dynamic frames path list, using client fallback:", err);
        const generatedList = Array.from({ length: 240 }, (_, i) => {
          const num = String(i + 1).padStart(3, "0");
          return `/Assets/frames/ezgif-frame-${num}.jpg`;
        });
        setFramePaths(generatedList);
      }
    };
    fetchFrames();
  }, [onIntroFinished]);

  // 2. Preload starting batch for immediate display, lazily preload remainder
  useEffect(() => {
    if (framePaths.length === 0) return;

    const startPreload = async () => {
      try {
        // Preload first 30 frames for instant display
        const { startingImages, allImagesPromise } = await preloadStartingBatch(
          framePaths,
          30,
          (progress) => {
            setLoadPercent(progress);
          }
        );

        imagesRef.current = startingImages;
        setPreloadedImages([...startingImages]);
        setIsLoading(false);

        // Preload rest in the background
        const allImages = await allImagesPromise;
        imagesRef.current = allImages;
        setPreloadedImages([...allImages]);
      } catch (err) {
        console.error("Preload error:", err);
        setIsLoading(false);
      }
    };

    startPreload();
  }, [framePaths]);

  // 3. Bind linear-interpolated LERP hook
  const { frameIndex, progressPercent, isIntroFinished, isTransitioning, skipIntro } = useScrollFrames({
    totalFrames: framePaths.length,
  });

  // Notify parent on completion
  useEffect(() => {
    if (isIntroFinished) {
      onIntroFinished();
    }
  }, [isIntroFinished, onIntroFinished]);

  // 4. Render frames to Canvas with Retina DPR scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || preloadedImages.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const activeImage = imagesRef.current[frameIndex] || imagesRef.current[0];
    if (!activeImage) return;

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Retina scale canvas resolution
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Object fit: cover calculations
      const imgWidth = activeImage.width;
      const imgHeight = activeImage.height;
      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        // Canvas is wider than image
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      } else {
        // Canvas is taller than image
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(activeImage, offsetX, offsetY, drawWidth, drawHeight);
    };

    render();

    // Add responsive window resize listener
    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, [frameIndex, preloadedImages]);

  // Renders the thin visual progress indicator
  const getProgressIndicator = () => {
    const blockCount = 10;
    const filledBlocks = Math.floor((progressPercent / 100) * blockCount);
    const emptyBlocks = blockCount - filledBlocks;
    const indicatorStr = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
    return `${indicatorStr} ${progressPercent}%`;
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 bg-black select-none overflow-hidden">
      
      {/* 1. Viewport-covering Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-all duration-1000 ${
          isTransitioning ? "scale-105 blur-md opacity-35" : "scale-100 blur-0 opacity-100"
        }`}
      />

      {/* 2. Top thin progress indicator */}
      {progressPercent < 95 && !isLoading && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1.5 font-mono text-[9px] tracking-widest text-emerald-500/70 uppercase z-55 bg-black/60 px-5 py-2.5 rounded-full border border-emerald-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <span>Vibe Calibration Progress</span>
          <span className="text-neon-volt font-black animate-pulse">{getProgressIndicator()}</span>
        </div>
      )}

      {/* 3. Top-Right Skip Intro Button */}
      {!isLoading && (
        <button
          onClick={skipIntro}
          className="absolute top-6 right-6 px-4 py-2.5 text-[10px] font-mono font-bold tracking-widest uppercase border border-white/20 hover:border-neon-green bg-black/50 hover:bg-black text-gray-400 hover:text-white rounded-lg transition-all hover:scale-105 active:scale-100 cursor-pointer z-55 backdrop-blur-md"
        >
          Skip Intro
        </button>
      )}

      {/* 4. First Frame Center Overlay */}
      <AnimatePresence>
        {progressPercent < 15 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-40 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none"
          >
            {/* Cinematic Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl sm:text-8xl font-black tracking-widest leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 uppercase mb-4"
            >
              CRICKVIBE
            </motion.h1>

            {/* Easing hint */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono tracking-widest text-emerald-400 uppercase"
            >
              <Sparkles className="w-4 h-4 text-neon-volt animate-pulse" />
              Scroll To Calibrate Vibe
            </motion.div>

            {/* Scroll anchor */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: [0, 8, 0], opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.8, repeat: Infinity }}
              className="absolute bottom-16 flex flex-col items-center gap-2 text-gray-500 font-mono text-[9px] uppercase tracking-widest"
            >
              <ArrowDown className="w-4 h-4 text-emerald-500 animate-bounce" />
              <span>Scroll Down</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Preloading Overlay Spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#030712] flex flex-col items-center justify-center p-8 z-50 text-center select-none"
          >
            <div className="relative w-20 h-20 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-950 border-t-neon-green animate-spin" style={{ animationDuration: '1s' }} />
              <div className="absolute inset-3 rounded-full border border-dashed border-emerald-900 border-b-neon-volt animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              <Sparkles className="w-6 h-6 text-neon-volt animate-pulse" />
            </div>

            <h2 className="font-mono text-xs uppercase tracking-widest text-white mb-2 font-black">
              Preloading Cinematic Experience
            </h2>
            <p className="text-[10px] text-gray-500 font-mono animate-pulse">
              Buffering opening frame vectors... {loadPercent}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
