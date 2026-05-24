"use client";

import React, { useRef, useEffect, useState } from "react";
import { preloadStartingBatch } from "@/lib/preloadFrames";
import { Activity } from "lucide-react";

export const HeroScrollFramePlayer: React.FC = () => {
  const [framePaths, setFramePaths] = useState<string[]>([]);
  const [preloadedImages, setPreloadedImages] = useState<HTMLImageElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);

  // 1. Fetch frames from directory scanner
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch("/api/frames");
        const data = await res.json();
        if (data.frames && data.frames.length > 0) {
          setFramePaths(data.frames);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load frames inside hero player:", err);
        setIsLoading(false);
      }
    };
    fetchFrames();
  }, []);

  // 2. Preload frames
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

        // Preload remaining frames in background
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

  // 3. Smooth LERP scroll mapping inside requestAnimationFrame
  useEffect(() => {
    if (framePaths.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollRange = 450; // Plays sequence over 450px of page scroll
      const progress = Math.min(1, Math.max(0, scrollY / scrollRange));
      targetFrameRef.current = progress * (framePaths.length - 1);
    };

    let animFrame: number;
    const updateLoop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.02) {
        currentFrameRef.current += diff * 0.16; // Easing LERP factor
        setFrameIndex(Math.min(framePaths.length - 1, Math.max(0, Math.round(currentFrameRef.current))));
      } else {
        // Snap to exact target when extremely close
        currentFrameRef.current = targetFrameRef.current;
        setFrameIndex(Math.min(framePaths.length - 1, Math.max(0, Math.round(currentFrameRef.current))));
      }
      animFrame = requestAnimationFrame(updateLoop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    animFrame = requestAnimationFrame(updateLoop);

    // Initial trigger
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animFrame);
    };
  }, [framePaths]);

  // 4. Draw aspect-cover frames on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || preloadedImages.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const activeImage = imagesRef.current[frameIndex] || imagesRef.current[0];
    if (!activeImage) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Fit and draw Retina resolution compatibility
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Math cover calculations
      const imgWidth = activeImage.width;
      const imgHeight = activeImage.height;
      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(activeImage, offsetX, offsetY, drawWidth, drawHeight);
    };

    render();

    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, [frameIndex, preloadedImages]);

  return (
    <div className="w-full h-full relative bg-slate-950/40 flex items-center justify-center select-none overflow-hidden rounded-[24px]">
      
      {/* Canvas Element fitted to cover container */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover scale-100 filter brightness-95"
      />

      {/* Futuristic Holographic HUD Overlay */}
      {!isLoading && (
        <div className="absolute inset-x-0 bottom-4 px-5 flex items-center justify-between z-20 font-mono text-[9px] text-[#94a3b8] tracking-wider pointer-events-none bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-1">
          <span className="flex items-center gap-1.5 text-[#c5f82a] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5f82a] animate-ping" />
            STADIUM FEED // CALIBRATING
          </span>
          <span className="bg-black/50 border border-white/5 px-2 py-0.5 rounded font-black text-white">
            FRAME: {frameIndex + 1}/240
          </span>
        </div>
      )}

      {/* Loading buffer overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#05070f] flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="relative w-12 h-12 flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-slate-900 border-t-[#c5f82a] animate-spin" />
            <Activity className="w-4 h-4 text-[#c5f82a] animate-pulse" />
          </div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-white font-bold mb-1">
            Loading Stadium
          </h4>
          <p className="text-[9px] text-gray-500 font-mono animate-pulse">
            Calibrating Vibe Vectors... {loadPercent}%
          </p>
        </div>
      )}

    </div>
  );
};
