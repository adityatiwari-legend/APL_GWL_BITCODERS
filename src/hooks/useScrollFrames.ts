import { useState, useEffect, useRef } from "react";

interface UseScrollFramesProps {
  totalFrames: number;
}

export const useScrollFrames = ({ totalFrames }: UseScrollFramesProps) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  // Check sessionStorage for previous completion on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const skip = sessionStorage.getItem("crickvibe_intro_finished");
      if (skip === "true") {
        setIsIntroFinished(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isIntroFinished || totalFrames === 0) return;

    // Disables scrolling on main body during intro
    document.body.style.overflow = "hidden";

    // Track vertical virtual scroll position using custom delta handlers
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Modulate sensitivity for precision trackpads and mousewheels
      const sensitivity = 0.0006;
      targetProgress.current = Math.min(
        1,
        Math.max(0, targetProgress.current + e.deltaY * sensitivity)
      );
    };

    // Track touchswipe for mobile responsiveness
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;

      const sensitivity = 0.002;
      targetProgress.current = Math.min(
        1,
        Math.max(0, targetProgress.current + deltaY * sensitivity)
      );
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    // Butter-smooth Apple LERP animation loop at 60fps
    const animate = () => {
      const lerpFactor = 0.08; // smooth easing factor
      
      currentProgress.current += (targetProgress.current - currentProgress.current) * lerpFactor;

      // Clean snapping at extreme boundaries
      if (Math.abs(targetProgress.current - currentProgress.current) < 0.0001) {
        currentProgress.current = targetProgress.current;
      }

      // Calculate matching frame index
      const rawIndex = Math.floor(currentProgress.current * (totalFrames - 1));
      const activeIndex = Math.min(totalFrames - 1, Math.max(0, rawIndex));
      
      setFrameIndex(activeIndex);
      setProgressPercent(Math.round(currentProgress.current * 100));

      // Trigger cinematic transition near the final frames (e.g. 98% progress)
      if (targetProgress.current >= 0.98 && currentProgress.current >= 0.96) {
        setIsTransitioning(true);
        if (currentProgress.current >= 0.99) {
          triggerComplete();
          return;
        }
      } else {
        setIsTransitioning(false);
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      document.body.style.overflow = "unset";
    };
  }, [totalFrames, isIntroFinished]);

  const triggerComplete = () => {
    setIsTransitioning(true);
    // Smooth transition buffer of 1.2 seconds
    setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("crickvibe_intro_finished", "true");
      }
      setIsIntroFinished(true);
      setIsTransitioning(false);
      document.body.style.overflow = "unset";
    }, 1200);
  };

  const skipIntro = () => {
    triggerComplete();
  };

  return {
    frameIndex,
    progressPercent,
    isIntroFinished,
    isTransitioning,
    skipIntro,
  };
};
