"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  Zap, 
  Trophy, 
  Shield, 
  Swords, 
  Users, 
  Mic, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw, 
  Volume2, 
  Info,
  Calendar,
  Layers,
  Upload,
  Video,
  FileText,
  Copy,
  Check,
  VolumeX,
  Languages,
  Activity,
  Menu,
  TrendingUp,
  Radio,
  Share2
} from "lucide-react";

// Types for API Responses
interface MatchAnalysisResult {
  excitement: number;
  tension: number;
  dominance: "Batting" | "Bowling" | "Balanced";
  suspense: number;
  winProbability: number;
  atmosphere: "Electric" | "Nervous" | "Chaotic" | "Silent" | "Explosive";
  commentary: string;
  prediction: string;
}

interface VideoCommentaryResult {
  commentary: string;
  highlight: string;
  excitement: number;
  player: string;
  caption: string;
}

// Preset Scenario Templates for Mode 2 Simulator
const MATCH_TEMPLATES = [
  {
    name: "2024 WC Final Climax",
    description: "India vs South Africa final over drama",
    score: "168/6",
    requiredRuns: 16,
    ballsLeft: 6,
    wicketsLeft: 4,
    runRate: 8.0,
    requiredRunRate: 16.0,
    strikeRate: 165,
    pressure: 10,
  },
  {
    name: "Historic Gabba Chase",
    description: "Rishabh Pant's historic fortress breach",
    score: "324/7",
    requiredRuns: 32,
    ballsLeft: 24,
    wicketsLeft: 3,
    runRate: 4.3,
    requiredRunRate: 8.0,
    strikeRate: 145,
    pressure: 9,
  },
  {
    name: "Super Over Stand-off",
    description: "Ultimate six-ball winner-take-all",
    score: "0/0",
    requiredRuns: 12,
    ballsLeft: 6,
    wicketsLeft: 2,
    runRate: 7.5,
    requiredRunRate: 12.0,
    strikeRate: 180,
    pressure: 10,
  },
  {
    name: "Friendly Club Chase",
    description: "Lazy Sunday casual run chase",
    score: "120/3",
    requiredRuns: 15,
    ballsLeft: 30,
    wicketsLeft: 7,
    runRate: 5.8,
    requiredRunRate: 3.0,
    strikeRate: 110,
    pressure: 2,
  }
];

// Typewriter text effect component
const TypingCommentary: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText("");
    indexRef.current = 0;
    
    if (!text) return;

    const words = text.split(" ");
    let currentText = "";
    
    const interval = setInterval(() => {
      if (indexRef.current < words.length) {
        currentText += (indexRef.current === 0 ? "" : " ") + words[indexRef.current];
        setDisplayedText(currentText);
        indexRef.current += 1;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 95); // Professional commentary typing speed

    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="text-white font-poppins font-normal leading-relaxed text-sm md:text-base selection:bg-accent-green/30">
      &ldquo;{displayedText}&rdquo;
      {indexRef.current < text.split(" ").length && (
        <span className="inline-block w-2.5 h-4 ml-1.5 bg-accent-green animate-pulse" />
      )}
    </p>
  );
};

// CountUp number component
const CountUp: React.FC<{ value: number; duration?: number }> = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 12);
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

export default function CrickVoiceAI() {
  // Mode Selection: "video" or "match"
  const [activeMode, setActiveMode] = useState<"video" | "match">("video");
  
  // Loading & Global States
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Reference hooks
  const dashboardRef = useRef<HTMLDivElement>(null);
  const controllerSectionRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);

  // --- MODE 1: VIDEO COMMENTARY STATE VARIABLES ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [commentaryStyle, setCommentaryStyle] = useState<string>("Professional");
  const [commentaryLanguage, setCommentaryLanguage] = useState<string>("English");
  const [videoCommentaryResult, setVideoCommentaryResult] = useState<VideoCommentaryResult | null>(null);

  // --- MODE 2: MATCH SIMULATOR STATE VARIABLES ---
  const [score, setScore] = useState("145/6");
  const [requiredRuns, setRequiredRuns] = useState<number | "">(22);
  const [ballsLeft, setBallsLeft] = useState<number | "">(12);
  const [wicketsLeft, setWicketsLeft] = useState<number | "">(4);
  const [runRate, setRunRate] = useState<number | "">(8.2);
  const [requiredRunRate, setRequiredRunRate] = useState<number | "">(11.0);
  const [strikeRate, setStrikeRate] = useState<number | "">(165);
  const [pressure, setPressure] = useState<number>(9);
  const [matchAnalysisResult, setMatchAnalysisResult] = useState<MatchAnalysisResult | null>(null);

  // Loading Ticker logs
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const videoLoadingPhrases = [
    "Uploading visual assets to dashboard memory...",
    "Caching key frames using FFmpeg static streams...",
    "Extracting video frames (Opening, Middle, Death)...",
    "Sending extracted keyframes to Gemini 2.5 Vision API...",
    "Analyzing batting action, shot play, and crowd emotion...",
    "Synthesizing broadcast audio and television commentary..."
  ];

  const matchLoadingPhrases = [
    "Reading scoreboard metrics and batsman strike rate...",
    "Analyzing critical run/ball ratios...",
    "Synthesizing World Cup match pressure...",
    "Executing server-side Gemini 2.5 Flash analysis...",
    "Predicting tension indexes and win probabilities..."
  ];

  // Auto-calculate Required Run Rate (RRR)
  useEffect(() => {
    if (typeof requiredRuns === "number" && typeof ballsLeft === "number" && ballsLeft > 0) {
      const calculatedRRR = (requiredRuns / ballsLeft) * 6;
      setRequiredRunRate(parseFloat(calculatedRRR.toFixed(2)));
    } else if (ballsLeft === 0) {
      setRequiredRunRate(0);
    }
  }, [requiredRuns, ballsLeft]);

  // Loading ticker rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % (activeMode === "video" ? videoLoadingPhrases.length : matchLoadingPhrases.length));
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, activeMode]);

  // Stop vocal commentary if mode is changed or reset
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeMode]);

  // --- NATIVE TEXT TO SPEECH NARRATOR ---
  const handleToggleVoiceSynthesis = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Standard broadcast commentary vocal synth config
    const utterance = new SpeechSynthesisUtterance(text);
    const isHindi = commentaryLanguage === "Hindi";
    utterance.lang = isHindi ? "hi-IN" : "en-US";
    
    // Select a pleasant voice
    const voices = window.speechSynthesis.getVoices();
    const desiredVoice = voices.find((v) => 
      isHindi ? v.lang.startsWith("hi") : v.lang.includes("Google") || v.lang.includes("Natural")
    );
    if (desiredVoice) utterance.voice = desiredVoice;

    // Tactical pitch and tempo adjustments for commentator effect
    utterance.pitch = 0.95;
    utterance.rate = isHindi ? 0.98 : 1.05;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // --- MODE 1: FILE SELECTION HANDLERS ---
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Enforce limits: Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      setValidationError("File is too large. Maximum size allowed is 25MB.");
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const validExtensions = [".mp4", ".mov", ".png", ".jpg", ".jpeg"];
    if (!validExtensions.includes(ext)) {
      setValidationError("Invalid file type. Please upload MP4, MOV, PNG, or JPG.");
      return;
    }

    setValidationError("");
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // --- MODE 2: MATCH TEMPLATE INJECTOR ---
  const handleApplyMatchTemplate = (tpl: typeof MATCH_TEMPLATES[0]) => {
    setScore(tpl.score);
    setRequiredRuns(tpl.requiredRuns);
    setBallsLeft(tpl.ballsLeft);
    setWicketsLeft(tpl.wicketsLeft);
    setRunRate(tpl.runRate);
    setRequiredRunRate(tpl.requiredRunRate);
    setStrikeRate(tpl.strikeRate);
    setPressure(tpl.pressure);
    setValidationError("");
  };

  // --- MODE 1: TRIGGER AI VIDEO ANALYZER ---
  const handleGenerateVideoCommentary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please select or drag a cricket video/image first.");
      return;
    }

    setIsLoading(true);
    setVideoCommentaryResult(null);
    setValidationError("");

    const startTime = Date.now();
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("style", commentaryStyle);
    formData.append("language", commentaryLanguage);

    try {
      const response = await fetch("/api/video-commentary", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process visual content.");
      }

      // Fast, realistic cinematic transition buffer
      const elapsed = Date.now() - startTime;
      const delay = Math.max(1800 - elapsed, 0);

      setTimeout(() => {
        setIsLoading(false);
        setVideoCommentaryResult(data);
        setTimeout(() => {
          dashboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }, delay);

    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during visual frame rendering.";
      setValidationError(msg);
      setIsLoading(false);
    }
  };

  // --- MODE 2: TRIGGER MATCH EMOTION SIMULATOR ---
  const validateMatchInputs = (): boolean => {
    const scoreRegex = /^\d+\/(10|[0-9])$/;
    if (!scoreRegex.test(score)) {
      setValidationError("Score format must be in 'Runs/Wickets' structure (e.g. 145/6). Wickets left must be logically valid.");
      return false;
    }

    const wicketsFromScore = parseInt(score.split("/")[1]);
    if (requiredRuns === "" || Number(requiredRuns) < 0) {
      setValidationError("Required runs cannot be negative.");
      return false;
    }
    if (ballsLeft === "" || Number(ballsLeft) < 0) {
      setValidationError("Balls left cannot be negative.");
      return false;
    }
    if (wicketsLeft === "" || Number(wicketsLeft) < 0 || Number(wicketsLeft) > 10) {
      setValidationError("Wickets remaining must be between 0 and 10.");
      return false;
    }
    if (10 - wicketsFromScore < Number(wicketsLeft)) {
      setValidationError(`Logical conflict: Current score shows ${wicketsFromScore} wickets fallen. Only ${10 - wicketsFromScore} batsmen remain, but you entered ${wicketsLeft} wickets left.`);
      return false;
    }
    if (runRate === "" || Number(runRate) < 0) {
      setValidationError("Current run rate cannot be negative.");
      return false;
    }
    if (requiredRunRate === "" || Number(requiredRunRate) < 0) {
      setValidationError("Required run rate cannot be negative.");
      return false;
    }
    if (strikeRate === "" || Number(strikeRate) < 0) {
      setValidationError("Strike rate cannot be negative.");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleGenerateMatchAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMatchInputs()) return;

    setIsLoading(true);
    setMatchAnalysisResult(null);
    setValidationError("");

    const startTime = Date.now();

    try {
      const response = await fetch("/api/match-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          requiredRuns,
          ballsLeft,
          wicketsLeft,
          runRate,
          requiredRunRate,
          strikeRate,
          pressure,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze match stats.");
      }

      // Fast, realistic cinematic transition buffer
      const elapsed = Date.now() - startTime;
      const delay = Math.max(1200 - elapsed, 0);

      setTimeout(() => {
        setIsLoading(false);
        setMatchAnalysisResult(data);
        setTimeout(() => {
          dashboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }, delay);

    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during match situation calibration.";
      setValidationError(msg);
      setIsLoading(false);
    }
  };

  // Copy social caption to clipboard
  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const getAtmosphereGlow = (atm: string) => {
    switch (atm) {
      case "Explosive":
        return "shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/20 bg-gradient-to-br from-[#1A1C1A] to-amber-950/20";
      case "Nervous":
        return "shadow-[0_0_40px_rgba(239,68,68,0.2)] border-red-500/20 bg-gradient-to-br from-[#1A1C1A] to-red-950/20";
      case "Chaotic":
        return "shadow-[0_0_40px_rgba(168,85,247,0.2)] border-purple-500/20 bg-gradient-to-br from-[#1A1C1A] to-purple-950/20";
      case "Silent":
        return "shadow-[0_0_40px_rgba(75,85,99,0.1)] border-gray-600/20 bg-gradient-to-br from-[#1A1C1A] to-slate-900";
      default: // Electric
        return "shadow-[0_0_40px_rgba(163,200,83,0.2)] border-accent-green/20 bg-gradient-to-br from-[#1A1C1A] to-emerald-950/20";
    }
  };

  const handleResetMode = () => {
    setSelectedFile(null);
    setFilePreviewUrl("");
    setVideoCommentaryResult(null);
    setMatchAnalysisResult(null);
    setValidationError("");
    controllerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Pre-configured particles for stadium floating dust effect
  const particles = [
    { left: "10%", top: "25%", delay: "0s", duration: "10s" },
    { left: "30%", top: "45%", delay: "2s", duration: "12s" },
    { left: "55%", top: "15%", delay: "1s", duration: "8s" },
    { left: "75%", top: "35%", delay: "4s", duration: "14s" },
    { left: "90%", top: "60%", delay: "3s", duration: "11s" },
    { left: "20%", top: "75%", delay: "5s", duration: "9s" },
    { left: "45%", top: "80%", delay: "0.5s", duration: "13s" },
    { left: "65%", top: "65%", delay: "1.5s", duration: "7s" }
  ];

  return (
    <div className="relative min-h-screen bg-[#0E0F0F] text-white flex flex-col font-poppins overflow-x-hidden selection:bg-accent-green/30">
      
      {/* Background spotlights & grids */}
      <div className="stadium-lights" />
      <div className="stadium-grid" />
      <div className="spotlight-left" />
      <div className="spotlight-right" />
      <div className="noise-overlay" />

      {/* Floating particles mapping */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {particles.map((p, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              animation: `float-particle ${p.duration} infinite ease-in-out`,
              animationDelay: p.delay
            }}
          />
        ))}
      </div>

      {/* Sticky Minimal Navbar */}
      <header className="sticky top-0 w-full z-50 bg-[#0E0F0F]/65 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#1A1C1A] border border-accent-green/20 shadow-[0_0_15px_rgba(163,200,83,0.1)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-green/30 to-lime-500/20 opacity-60 pulse-glow-green" />
              <Volume2 className="w-5.5 h-5.5 text-accent-green relative z-10 animate-bounce" style={{ animationDuration: '3.5s' }} />
            </div>
            <div>
              <h1 className="font-bebas font-normal text-2xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-accent-green">
                CRICKVOICE <span className="text-accent-green">AI</span>
              </h1>
              <p className="text-[9px] font-poppins tracking-widest text-muted-text uppercase font-semibold">Broadcaster Engine v2.5</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-muted-text">
            <a href="#hero" className="hover:text-white transition-colors">Home</a>
            <a href="#simulator" className="hover:text-white transition-colors">Analyzer Room</a>
            <a href="#momentum" className="hover:text-white transition-colors">Momentum Widgets</a>
          </nav>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-accent-green/20 text-accent-green">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-ping" />
              AI System Active
            </span>
            <button 
              onClick={() => controllerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="px-5 py-2.5 rounded-xl bg-[#1A1C1A] hover:bg-[#2B2D2B] border border-white/5 hover:border-white/10 text-white font-bold tracking-wider uppercase transition-all shadow-lg btn-premium-glow cursor-pointer"
            >
              Analyze Arena
            </button>
            <button className="md:hidden p-2 text-white hover:text-accent-green transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 relative z-20 pb-24">
        
        {/* HERO SECTION */}
        <section id="hero" ref={heroSectionRef} className="py-20 md:py-28 flex flex-col items-center text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl flex flex-col items-center"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1C1A] border border-accent-green/20 text-accent-green text-xs font-semibold tracking-wider uppercase mb-8 shadow-[0_0_20px_rgba(163,200,83,0.08)]">
              <Sparkles className="w-4 h-4 text-accent-green animate-pulse" />
              Next-Gen Broadcast & Prediction Core
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bebas font-normal tracking-wide leading-none text-white mb-6 uppercase">
              Predict The <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-green via-[#D4F484] to-white">Emotion</span> Of Cricket
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-xl text-muted-text font-normal max-w-2xl mb-12 leading-relaxed font-poppins">
              AI-powered commentary, tension analysis, and match intelligence. Streamline video footages to render stadium voices, or calibrate dynamic scoreboard indices to forecast endgame climax sequences.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <button 
                onClick={() => {
                  setActiveMode("match");
                  setTimeout(() => {
                    controllerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="px-8 py-4 rounded-xl bg-accent-green hover:bg-[#b5db5e] text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-[0_4px_25px_rgba(163,200,83,0.3)] hover:scale-105 active:scale-95 cursor-pointer btn-premium-glow"
              >
                Analyze Match Score
              </button>
              <button 
                onClick={() => {
                  setActiveMode("video");
                  setTimeout(() => {
                    controllerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="px-8 py-4 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-white font-extrabold text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Upload Video Clip
              </button>
            </div>

            {/* Mode Switcher */}
            <div ref={controllerSectionRef} className="w-full max-w-xl mx-auto p-1.5 rounded-[22px] bg-[#1A1C1A] border border-white/5 flex items-center justify-between relative shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
              <button
                onClick={() => {
                  setActiveMode("video");
                  setValidationError("");
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2.5 py-4 rounded-[18px] text-xs font-extrabold tracking-widest uppercase cursor-pointer transition-all z-10 ${
                  activeMode === "video" 
                    ? "bg-accent-green text-black shadow-[0_0_20px_rgba(163,200,83,0.25)]" 
                    : "text-muted-text hover:text-white"
                }`}
              >
                <Video className="w-4.5 h-4.5" />
                Video Commentary
              </button>
              
              <button
                onClick={() => {
                  setActiveMode("match");
                  setValidationError("");
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2.5 py-4 rounded-[18px] text-xs font-extrabold tracking-widest uppercase cursor-pointer transition-all z-10 ${
                  activeMode === "match" 
                    ? "bg-accent-green text-black shadow-[0_0_20px_rgba(163,200,83,0.25)]" 
                    : "text-muted-text hover:text-white"
                }`}
              >
                <Activity className="w-4.5 h-4.5" />
                Score Simulator
              </button>
            </div>
          </motion.div>
        </section>

        {/* --- DYNAMIC WORKSPACE WRAPPER (MODE 1 OR MODE 2) --- */}
        <section id="simulator" className="py-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Form Title Banner */}
            <div className="flex items-end justify-between mb-5 px-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bebas font-normal uppercase text-white tracking-wide flex items-center gap-2">
                  {activeMode === "video" ? (
                    <>
                      <Mic className="w-6 h-6 text-accent-green" />
                      Visual Commentary Studio
                    </>
                  ) : (
                    <>
                      <Layers className="w-6 h-6 text-accent-green" />
                      Match Situation Room
                    </>
                  )}
                </h2>
                <p className="text-xs text-muted-text mt-0.5">
                  {activeMode === "video" 
                    ? "Upload match footage to generate professional live broadcasts."
                    : "Configure scorecard ratios to run statistical drama models."}
                </p>
              </div>
              <span className="text-[10px] font-semibold font-poppins text-muted-text/60 bg-[#1A1C1A] border border-white/5 px-2.5 py-1 rounded-md uppercase">
                {activeMode === "video" ? "visual commentary" : "scoreboard simulator"}
              </span>
            </div>

            {/* Glassmorphic Panel Container - 28px rounded */}
            <div className="glass-panel p-6 md:p-10 relative overflow-hidden">
              <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-gradient-to-r from-accent-green/30 via-lime-400 to-accent-green/30" />
              
              {/* --- MODE 1 CONTENT: VIDEO COMMENTARY UPLOADER --- */}
              {activeMode === "video" && (
                <form onSubmit={handleGenerateVideoCommentary} className="space-y-8">
                  
                  {/* File Upload Zone - Dash Rounded */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative w-full min-h-[250px] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all ${
                      isDragOver 
                        ? "border-accent-green bg-accent-green/5 shadow-[0_0_30px_rgba(163,200,83,0.15)]" 
                        : selectedFile 
                        ? "border-accent-green/50 bg-[#1A1C1A]/50" 
                        : "border-white/10 hover:border-white/20 bg-[#1A1C1A]/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                    }`}
                  >
                    {selectedFile ? (
                      <div className="w-full flex flex-col items-center space-y-5">
                        {/* Dynamic Preview with stadium glow reflection */}
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-tr from-accent-green to-lime-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition" />
                          {selectedFile.type.startsWith("video/") ? (
                            <video
                              src={filePreviewUrl}
                              controls
                              className="relative max-h-[170px] rounded-lg border border-white/10 shadow-2xl z-10"
                            />
                          ) : (
                            <img
                              src={filePreviewUrl}
                              alt="Cricket action layout"
                              className="relative max-h-[170px] rounded-lg border border-white/10 shadow-2xl object-contain z-10"
                            />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-sm max-w-sm truncate font-poppins">{selectedFile.name}</p>
                          <p className="text-xs text-muted-text mt-1.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setFilePreviewUrl("");
                            }}
                            className="mt-4 px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/25 hover:bg-red-900/60 text-red-300 text-xs font-bold transition-all cursor-pointer"
                          >
                            Remove file
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-5">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative group-hover:scale-110 transition-transform">
                          <Upload className="w-7 h-7 text-accent-green animate-bounce" />
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-white">Drag and drop your cricket media here</p>
                          <p className="text-xs text-muted-text mt-1.5">Supports MP4, MOV, PNG, or JPG (Max 25MB)</p>
                        </div>
                        <label className="px-6 py-3 rounded-xl bg-[#1A1C1A] hover:bg-[#2B2D2B] border border-white/5 text-xs font-bold tracking-wider uppercase cursor-pointer transition-all hover:scale-105 shadow-md">
                          Browse Files
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,image/png,image/jpeg"
                            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Settings row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Commentary Style */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                        Commentary Style
                      </label>
                      <div className="relative">
                        <select
                          value={commentaryStyle}
                          onChange={(e) => setCommentaryStyle(e.target.value)}
                          className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-sm text-white appearance-none transition-all cursor-pointer font-semibold"
                        >
                          <option value="Professional">Tactical & Precise (Professional)</option>
                          <option value="IPL Excited">High-Energy Boundary Calls (IPL Excited)</option>
                          <option value="Hindi Commentary">Rich Broadcast Phrases (Hindi)</option>
                          <option value="Funny">Humorous Jabs & Banter (Funny)</option>
                          <option value="Radio Style">Descriptive & Fast-paced (Radio)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-text text-xs">▼</div>
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                        <Languages className="w-4 h-4 text-accent-green" />
                        Language Output
                      </label>
                      <div className="flex gap-4">
                        {["English", "Hindi"].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setCommentaryLanguage(lang)}
                            className={`flex-1 py-3.5 text-sm font-extrabold rounded-xl border transition-all cursor-pointer ${
                              commentaryLanguage === lang 
                                ? "bg-accent-green text-black border-accent-green shadow-[0_0_15px_rgba(163,200,83,0.15)]" 
                                : "bg-[#1A1C1A] border-white/10 hover:border-white/20 text-muted-text hover:text-white"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Validation errors */}
                  <AnimatePresence>
                    {validationError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2.5 px-4 py-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs">
                          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                          <p className="font-semibold">{validationError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submissions Action bar */}
                  <div className="flex justify-end pt-4 border-t border-white/5 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreviewUrl("");
                        setValidationError("");
                        setVideoCommentaryResult(null);
                      }}
                      className="px-6 py-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs font-bold tracking-wider uppercase text-muted-text cursor-pointer"
                    >
                      Clear
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !selectedFile}
                      className="px-8 py-4 rounded-xl bg-accent-green hover:bg-[#b5db5e] text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(163,200,83,0.2)] hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed btn-premium-glow"
                    >
                      Generate Commentary
                    </button>
                  </div>

                </form>
              )}

              {/* --- MODE 2 CONTENT: SCORE SITUATION SIMULATOR --- */}
              {activeMode === "match" && (
                <div className="space-y-8">
                  
                  {/* UX Preset Scoreboards (Styled as sports tickets) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-green">
                      <Calendar className="w-4 h-4" />
                      Situation Sandbox
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {MATCH_TEMPLATES.map((tpl, i) => (
                        <div
                          key={i}
                          onClick={() => handleApplyMatchTemplate(tpl)}
                          className="glass-panel p-4 rounded-2xl cursor-pointer border border-white/5 hover:border-accent-green/30 text-left bg-[#1A1C1A]/40 hover:bg-[#1A1C1A]/80 transition-all group relative overflow-hidden"
                        >
                          <div className="absolute right-0 top-0 w-8 h-8 bg-accent-green/5 rounded-bl-full pointer-events-none group-hover:bg-accent-green/10 transition-colors" />
                          <h4 className="font-bebas font-normal text-base text-white group-hover:text-accent-green transition-colors tracking-wider line-clamp-1">
                            {tpl.name}
                          </h4>
                          <div className="flex justify-between items-center mt-3 text-[10px] font-semibold text-muted-text border-t border-white/5 pt-2">
                            <span>Runs: <strong className="text-accent-green font-bold">{tpl.requiredRuns}</strong></span>
                            <span>Balls: <strong className="text-white font-bold">{tpl.ballsLeft}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input Form Grid */}
                  <form onSubmit={handleGenerateMatchAnalysis} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Fields Column */}
                      <div className="space-y-4">
                        {/* Score */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center justify-between">
                            <span>Current Score <strong className="text-red-500">*</strong></span>
                            <span className="text-[10px] lowercase font-normal italic">(runs/wickets format)</span>
                          </label>
                          <input
                            type="text"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder="145/6"
                            className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-bold transition-all"
                            required
                          />
                        </div>

                        {/* Required Runs */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                            Required Runs <strong className="text-red-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={requiredRuns}
                            onChange={(e) => setRequiredRuns(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="22"
                            className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-bold transition-all"
                            required
                            min="0"
                          />
                        </div>

                        {/* Balls Left */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                            Balls Left <strong className="text-red-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={ballsLeft}
                            onChange={(e) => setBallsLeft(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="12"
                            className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-bold transition-all"
                            required
                            min="0"
                          />
                        </div>

                        {/* Wickets Left */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                            Wickets Remaining <strong className="text-red-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={wicketsLeft}
                            onChange={(e) => setWicketsLeft(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="4"
                            className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-bold transition-all"
                            required
                            min="0; 0"
                            max="10"
                          />
                        </div>
                      </div>

                      {/* Right Fields Column */}
                      <div className="space-y-4">
                        {/* Current Run Rate */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                            Current Run Rate (CRR) <strong className="text-red-500">*</strong>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={runRate}
                            onChange={(e) => setRunRate(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="8.2"
                            className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-bold transition-all"
                            required
                          />
                        </div>

                        {/* Required Run Rate */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center justify-between">
                            <span>Required Run Rate (RRR) <strong className="text-red-500">*</strong></span>
                            <span className="text-[10px] text-accent-green font-semibold flex items-center gap-1 bg-[#1A1C1A] px-2 py-0.5 rounded border border-white/5">
                              <Info className="w-3.5 h-3.5" /> Auto-calculated
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={requiredRunRate}
                            onChange={(e) => setRequiredRunRate(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="11.0"
                            className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-bold transition-all"
                            required
                          />
                        </div>

                        {/* Strike Rate */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                            Strike Rate of Striker <strong className="text-red-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={strikeRate}
                            onChange={(e) => setStrikeRate(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="165"
                            className="w-full bg-[#1A1C1A] border border-white/10 focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/30 rounded-xl px-4 py-3.5 text-white placeholder-white/20 font-bold transition-all"
                            required
                          />
                        </div>

                        {/* Match Pressure Slider */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">Match Pressure Slider</label>
                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#1A1C1A] border border-accent-green/30 text-accent-green font-bold">
                              {pressure}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={pressure}
                            onChange={(e) => setPressure(Number(e.target.value))}
                            className="w-full h-2 bg-[#0E0F0F] rounded-lg appearance-none cursor-pointer accent-accent-green focus:outline-none"
                          />
                          <div className="flex justify-between text-[10px] text-muted-text/80 px-1 font-semibold">
                            <span className={pressure <= 3 ? "text-accent-green font-bold" : ""}>1 (Casual)</span>
                            <span className={pressure > 3 && pressure <= 7 ? "text-accent-green font-bold" : ""}>5 (League)</span>
                            <span className={pressure > 7 ? "text-accent-green font-bold animate-pulse" : ""}>10 (WC Final)</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Validation Errors */}
                    <AnimatePresence>
                      {validationError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs">
                            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                            <p className="font-semibold">{validationError}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions panel */}
                    <div className="flex justify-end pt-6 border-t border-white/5 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setScore("145/6");
                          setRequiredRuns(22);
                          setBallsLeft(12);
                          setWicketsLeft(4);
                          setRunRate(8.2);
                          setRequiredRunRate(11.0);
                          setStrikeRate(165);
                          setPressure(9);
                          setValidationError("");
                          setMatchAnalysisResult(null);
                        }}
                        className="px-6 py-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs font-bold tracking-wider uppercase text-muted-text cursor-pointer"
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-4 rounded-xl bg-accent-green hover:bg-[#b5db5e] text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(163,200,83,0.2)] hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 btn-premium-glow"
                      >
                        Generate Match Emotion
                      </button>
                    </div>
                  </form>

                </div>
              )}

              {/* --- DUAL CINEMATIC SCANNING LOADING INTERFACE --- */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0E0F0F]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-30"
                  >
                    {/* Glowing scanner sweep lines */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div 
                        className="w-full h-[3px] bg-gradient-to-r from-transparent via-accent-green to-transparent opacity-80 shadow-[0_0_30px_#A3C853]"
                        style={{
                          animation: 'float 2s infinite ease-in-out',
                        }}
                      />
                    </div>

                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full border-2 border-[#1A1C1A] border-t-accent-green border-r-accent-green/60 animate-spin" style={{ animationDuration: '1.2s' }} />
                      <div className="absolute inset-2.5 rounded-full border border-dashed border-[#2B2D2B] border-b-accent-green/40 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                      {activeMode === "video" ? (
                        <Video className="w-12 h-12 text-accent-green animate-pulse" />
                      ) : (
                        <Activity className="w-12 h-12 text-accent-green animate-pulse" />
                      )}
                    </div>

                    <h3 className="font-bebas font-normal text-2xl uppercase tracking-widest text-white mb-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-ping" />
                      {activeMode === "video" ? "Extracting & Translating Footage" : "Compiling Scoreboard Matrix"}
                    </h3>

                    <div className="h-6 overflow-hidden">
                      <p className="text-xs text-muted-text font-semibold italic animate-pulse">
                        {activeMode === "video" 
                          ? videoLoadingPhrases[loadingPhraseIndex]
                          : matchLoadingPhrases[loadingPhraseIndex]}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        </section>

        {/* --- RESULTS DASHBOARD AREA --- */}
        <div ref={dashboardRef} className="scroll-mt-24">
          
          {/* --- RESULTS 1: VIDEO COMMENTARY RESULTS PANEL --- */}
          <AnimatePresence>
            {videoCommentaryResult && (
              <motion.section
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="py-10"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {/* Title */}
                  <div className="flex items-center justify-between mb-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-7 bg-accent-green rounded-full shadow-[0_0_10px_#A3C853]" />
                      <h2 className="text-3xl md:text-4xl font-bebas font-normal uppercase text-white tracking-wider flex items-center gap-2">
                        Synthesized Broadcast Report
                      </h2>
                    </div>
                    <span className="text-[10px] font-semibold text-accent-green bg-[#1A1C1A] px-3 py-1 rounded-md border border-white/5 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-ping" /> Live Video Review
                    </span>
                  </div>

                  {/* BENTO GRID (2 columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* BENTO 1: Video Preview Card */}
                    <div className="glass-panel p-6 flex flex-col justify-between overflow-hidden relative min-h-[300px]">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text mb-4 flex items-center gap-2">
                        <Video className="w-4.5 h-4.5 text-accent-green" />
                        Uploaded Footplay Media
                      </h4>
                      <div className="flex-1 flex items-center justify-center bg-[#0E0F0F] rounded-2xl overflow-hidden p-2 border border-white/5 relative group">
                        <div className="absolute inset-0 bg-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        {selectedFile?.type.startsWith("video/") ? (
                          <video
                            src={filePreviewUrl}
                            controls
                            className="w-full max-h-[220px] rounded-xl object-contain shadow-2xl"
                          />
                        ) : (
                          <img
                            src={filePreviewUrl}
                            alt="Visual context key"
                            className="w-full max-h-[220px] rounded-xl object-contain shadow-2xl"
                          />
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-text">
                        <span>Format: <strong className="text-white font-bold">{selectedFile?.name.substring(selectedFile.name.lastIndexOf(".") + 1).toUpperCase() || ""}</strong></span>
                        <span>Size: <strong className="text-white font-bold">{((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB</strong></span>
                      </div>
                    </div>

                    {/* BENTO 2: Excitement, Highlight, Player */}
                    <div className="grid grid-cols-1 gap-5">
                      {/* Excitement Rating */}
                      <div className="glass-panel p-6 flex items-center gap-6 relative group bg-[#1A1C1A]/40">
                        <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="44" cy="44" r="34" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                            <circle 
                              cx="44" 
                              cy="44" 
                              r="34" 
                              stroke="#A3C853" 
                              strokeWidth="6" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 34}
                              strokeDashoffset={2 * Math.PI * 34 * (1 - videoCommentaryResult.excitement / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute text-2xl font-bebas font-normal text-white tracking-wider">
                            <CountUp value={videoCommentaryResult.excitement} />%
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                            <Flame className="w-4.5 h-4.5 text-accent-green" />
                            Moment Excitement
                          </h4>
                          <p className="text-sm font-bold text-white mt-1.5">Simulated stadium noise.</p>
                          <p className="text-xs text-muted-text mt-0.5 leading-relaxed">Crowd decibel fluctuations peak at this moment.</p>
                        </div>
                      </div>

                      {/* Highlight overview */}
                      <div className="glass-panel p-6 flex flex-col justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text mb-3 flex items-center gap-2">
                          <FileText className="w-4.5 h-4.5 text-accent-green" />
                          Moments Highlights
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-semibold italic bg-[#0E0F0F]/60 p-4 rounded-xl border border-white/5">
                          &ldquo;{videoCommentaryResult.highlight}&rdquo;
                        </p>
                      </div>

                      {/* Player of the Moment */}
                      <div className="glass-panel p-5 flex items-center justify-between bg-[#1A1C1A]/40">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-gold" />
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-text block uppercase font-bold">Player of Moment</span>
                            <span className="text-sm font-bold text-white uppercase tracking-wider">{videoCommentaryResult.player}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-gold bg-yellow-950/40 px-3 py-1 rounded-md border border-yellow-900/25 uppercase">
                          Standout Performer
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* ROW 2: LIVE BROADCAST COMMENTARY BOX */}
                  <div className="glass-panel p-6 md:p-8 border border-accent-green/20 shadow-[0_0_30px_rgba(163,200,83,0.06)] relative overflow-hidden">
                    <div className="absolute -left-12 -top-12 w-32 h-32 bg-accent-green/10 rounded-full blur-[50px] pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5">
                      <div className="flex items-center gap-3.5">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/20">
                          <Mic className="w-5 h-5 text-accent-green animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                            🎙 AI Broadcast Commentary Booth
                          </h4>
                          <p className="text-[10px] text-muted-text mt-0.5 lowercase font-semibold">style: {commentaryStyle} | language: {commentaryLanguage}</p>
                        </div>
                      </div>

                      {/* Wave audio speaker buttons */}
                      <div className="flex items-center gap-4">
                        
                        {/* Audio Wave */}
                        <div className="flex items-end h-[24px] px-2.5">
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                        </div>

                        {/* Vocal Synthesis trigger */}
                        <button
                          type="button"
                          onClick={() => handleToggleVoiceSynthesis(videoCommentaryResult.commentary)}
                          className={`px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
                            isSpeaking 
                              ? "bg-red-950/60 border-red-500/25 text-red-300" 
                              : "bg-accent-green text-black border-accent-green hover:bg-[#b5db5e]"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-4 h-4" />
                              Mute
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4" />
                              Listen Live
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0E0F0F]/90 border border-white/5 rounded-2xl p-5 md:p-6 relative min-h-[100px] flex items-center">
                      <TypingCommentary text={videoCommentaryResult.commentary} />
                    </div>
                  </div>

                  {/* ROW 3: SOCIAL CAPTION COMPONENT */}
                  <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-[#1A1C1A]/40">
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] text-muted-text uppercase font-bold tracking-wider">Viral Social Caption</span>
                      <p className="text-xs text-white italic font-semibold selection:bg-accent-green/30">
                        {videoCommentaryResult.caption}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCaption(videoCommentaryResult.caption)}
                        className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-[#1A1C1A] hover:bg-[#2B2D2B] border border-white/5 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {copiedCaption ? (
                          <>
                            <Check className="w-4 h-4 text-accent-green" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-muted-text" />
                            Copy Copy
                          </>
                        )}
                      </button>
                      <button 
                        type="button"
                        className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors cursor-pointer"
                        title="Share on Social Media"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reset action bottom */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleResetMode}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#1A1C1A] hover:bg-[#2B2D2B] border border-white/5 hover:border-white/10 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Analyze Another Clip
                    </button>
                  </div>

                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* --- RESULTS 2: MATCH SIMULATOR RESULTS PANEL --- */}
          <AnimatePresence>
            {matchAnalysisResult && (
              <motion.section
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="py-10"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {/* Header title */}
                  <div className="flex items-center justify-between mb-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-7 bg-accent-green rounded-full shadow-[0_0_10px_#A3C853]" />
                      <h2 className="text-3xl md:text-4xl font-bebas font-normal uppercase text-white tracking-wider flex items-center gap-2">
                        Simulated Emotional Metrics
                      </h2>
                    </div>
                    <span className="text-[10px] font-semibold text-accent-green bg-[#1A1C1A] px-3 py-1 rounded-md border border-white/5 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-ping" /> Live Prediction
                    </span>
                  </div>

                  {/* BENTO GRID (3 Columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* BENTO 1: Excitement Meter */}
                    <div className="glass-panel p-6 flex flex-col justify-between overflow-hidden relative group bg-[#1A1C1A]/40 min-h-[220px]">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-accent-green/10 to-transparent rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                            <Flame className="w-4.5 h-4.5 text-accent-green" />
                            Excitement Score
                          </h4>
                          <span className="text-[10px] font-bold text-accent-green bg-emerald-950/40 px-2 py-0.5 rounded border border-accent-green/20 uppercase">
                            {matchAnalysisResult.excitement >= 85 ? "Extreme" : matchAnalysisResult.excitement >= 60 ? "Thrilling" : "Moderate"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-5 my-2">
                          <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="44" cy="44" r="34" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                              <circle 
                                cx="44" 
                                cy="44" 
                                r="34" 
                                stroke="#A3C853" 
                                strokeWidth="6" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 34}
                                strokeDashoffset={2 * Math.PI * 34 * (1 - matchAnalysisResult.excitement / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute text-2xl font-bebas font-normal text-white tracking-wider">
                              <CountUp value={matchAnalysisResult.excitement} />%
                            </div>
                          </div>
                          <div className="text-xs text-muted-text space-y-0.5">
                            <p className="font-bold text-white">Crowd Volume</p>
                            <p className="leading-relaxed text-[11px]">Crowd decibel fluctuations peak at this moment.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 2: Tension Meter */}
                    <div className={`glass-panel p-6 flex flex-col justify-between overflow-hidden relative group bg-[#1A1C1A]/40 min-h-[220px] ${matchAnalysisResult.tension >= 80 ? 'shake-tension border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''}`}>
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                            <Zap className="w-4.5 h-4.5 text-red-400" />
                            Tension Index
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            matchAnalysisResult.tension >= 85 ? 'text-red-400 bg-red-950/40 border-red-900/30' : 'text-orange-400 bg-orange-950/40 border-orange-900/30'
                          }`}>
                            {matchAnalysisResult.tension >= 85 ? "Critical" : matchAnalysisResult.tension >= 65 ? "High" : "Controlled"}
                          </span>
                        </div>

                        <div className="my-2 space-y-2.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[11px] text-muted-text font-semibold">Heart-rate Level</span>
                            <span className={`text-2xl font-bebas font-normal tracking-wider ${matchAnalysisResult.tension >= 80 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                              <CountUp value={matchAnalysisResult.tension} />/100
                            </span>
                          </div>
                          <div className="w-full h-3 bg-[#0E0F0F] rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                matchAnalysisResult.tension >= 85 ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-orange-500'
                              }`}
                              style={{ width: `${matchAnalysisResult.tension}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-text leading-normal">
                            {matchAnalysisResult.tension >= 80 ? "Cardiac stress peaking. Nail-biting finish expected." : "Controlled tension. Sturdy defensive setups."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 3: Dominance Indicator */}
                    <div className="glass-panel p-6 flex flex-col justify-between overflow-hidden relative group bg-[#1A1C1A]/40 min-h-[220px]">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                            <Trophy className="w-4.5 h-4.5 text-gold" />
                            Tactical Dominance
                          </h4>
                          <span className="text-[10px] font-bold text-gold bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-900/25 uppercase">
                            Supremacy
                          </span>
                        </div>

                        <div className="my-2 text-center space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold font-poppins">
                            <span className={`flex items-center gap-1 ${matchAnalysisResult.dominance === "Batting" ? "text-accent-green" : "text-muted-text/50"}`}>
                              <Swords className="w-4 h-4" /> Batting
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-muted-text ${matchAnalysisResult.dominance === "Balanced" ? "border border-accent-green/30 text-accent-green" : ""}`}>
                              Balanced
                            </span>
                            <span className={`flex items-center gap-1 ${matchAnalysisResult.dominance === "Bowling" ? "text-red-400" : "text-muted-text/50"}`}>
                              Bowling <Shield className="w-4 h-4" />
                            </span>
                          </div>

                          <div className="w-full h-3 bg-[#0E0F0F] rounded-full p-[1px] relative overflow-hidden border border-white/5">
                            <div 
                              className={`absolute top-0 bottom-0 transition-all duration-1000 ease-out rounded-full ${
                                matchAnalysisResult.dominance === "Batting" 
                                  ? "left-0 w-3/4 bg-accent-green shadow-[0_0_10px_rgba(163,200,83,0.4)]" 
                                  : matchAnalysisResult.dominance === "Bowling" 
                                  ? "right-0 w-3/4 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                                  : "left-1/4 right-1/4 bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                              }`}
                            />
                          </div>
                          
                          <div className="text-xs text-left">
                            <p className="text-[10px] text-muted-text leading-normal">
                              {matchAnalysisResult.dominance === "Batting" 
                                ? "The batters are operating in control, putting bowlers on warning."
                                : matchAnalysisResult.dominance === "Bowling"
                                ? "Bowling attack has choked run flow. Fall of wickets impending."
                                : "Both units locked in a tactical equilibrium. Dot balls are key."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 4: Suspense Level */}
                    <div className="glass-panel p-6 flex flex-col justify-between overflow-hidden relative group bg-[#1A1C1A]/40 min-h-[220px]">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                            <Layers className="w-4.5 h-4.5 text-indigo-400" />
                            Suspense Index
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/25 uppercase">
                            {matchAnalysisResult.suspense >= 85 ? "Max Drama" : matchAnalysisResult.suspense >= 55 ? "High" : "Standard"}
                          </span>
                        </div>

                        <div className="my-2 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-text font-semibold">Outcome Volatility</span>
                            <span className="font-bebas text-xl text-indigo-300 tracking-wider">
                              <CountUp value={matchAnalysisResult.suspense} />%
                            </span>
                          </div>

                          <div className="w-full h-10 flex items-end justify-between px-1 bg-[#0E0F0F] rounded-xl py-1.5 border border-white/5">
                            {Array.from({ length: 15 }).map((_, idx) => {
                              const multiplier = matchAnalysisResult.suspense / 100;
                              const heightPercentage = Math.round(
                                Math.max(10, Math.sin((idx + 1) * 0.8) * 40 * multiplier + 50 * multiplier)
                              );
                              return (
                                <div
                                  key={idx}
                                  className="w-1.5 rounded-t bg-indigo-500/80 transition-all duration-1000 ease-out"
                                  style={{ height: `${heightPercentage}%` }}
                                />
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-muted-text leading-normal">
                            High suspense values signal that any boundary or dot ball completely swings prediction algorithms.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 5: Win Probability */}
                    <div className="glass-panel p-6 flex flex-col justify-between overflow-hidden relative group bg-[#1A1C1A]/40 min-h-[220px]">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                            <ChevronRight className="w-4.5 h-4.5 text-teal-400" />
                            Probability Matrix
                          </h4>
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/25 uppercase">
                            Analysis
                          </span>
                        </div>

                        <div className="my-2 space-y-3">
                          <div className="flex justify-between text-xs font-bold font-poppins">
                            <span className="text-accent-green">Batting: {matchAnalysisResult.winProbability}%</span>
                            <span className="text-red-400">Bowling: {100 - matchAnalysisResult.winProbability}%</span>
                          </div>

                          <div className="w-full h-4 bg-[#0E0F0F] rounded-full flex overflow-hidden p-[1px] border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-accent-green to-lime-400 rounded-l transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(163,200,83,0.3)]"
                              style={{ width: `${matchAnalysisResult.winProbability}%` }}
                            />
                            <div 
                              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-r transition-all duration-1000 ease-out"
                              style={{ width: `${100 - matchAnalysisResult.winProbability}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[9px] text-muted-text/80 font-bold uppercase tracking-wider">
                            <span>Runs Needed</span>
                            <span>Line Defended</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 6: Stadium Atmosphere */}
                    <div className={`glass-panel p-6 transition-all duration-700 ${getAtmosphereGlow(matchAnalysisResult.atmosphere)} flex flex-col justify-between overflow-hidden relative group min-h-[220px]`}>
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                            <Users className="w-4.5 h-4.5 text-blue-400" />
                            Stadium Acoustics
                          </h4>
                          <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 uppercase">
                            Ambience
                          </span>
                        </div>

                        <div className="my-2 float-slow">
                          <div className="text-3xl font-bebas font-normal tracking-wider text-white uppercase flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            {matchAnalysisResult.atmosphere}
                          </div>
                          
                          <p className="text-[10px] text-gray-200 mt-3 leading-relaxed">
                            {matchAnalysisResult.atmosphere === "Explosive" && "Deafening horn blasts! Stadium spotlights pulsing in sequence. Crowd noise registers peak dB."}
                            {matchAnalysisResult.atmosphere === "Nervous" && "Paralyzed crowd. Gasping spectators are frozen, watching every run and dot with dread."}
                            {matchAnalysisResult.atmosphere === "Chaotic" && "Bedlam in stands! Massive flag-waving, spectators arguing, volatile tension spikes."}
                            {matchAnalysisResult.atmosphere === "Silent" && "Home supporters are quietly slipping away, resigning themselves to a silent defeat."}
                            {matchAnalysisResult.atmosphere === "Electric" && "Pure celebratory carnival! Constant singing and waving. High crowd vibrations."}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ROW 2: LIVE BROADCAST COMMENTARY BOX */}
                  <div className="glass-panel p-6 md:p-8 border border-accent-green/20 shadow-[0_0_30px_rgba(163,200,83,0.06)] relative overflow-hidden">
                    <div className="absolute -left-12 -top-12 w-32 h-32 bg-accent-green/10 rounded-full blur-[50px] pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5">
                      <div className="flex items-center gap-3.5">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/20">
                          <Mic className="w-5 h-5 text-accent-green animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                            🎙 AI Broadcast Commentary
                          </h4>
                          <p className="text-[10px] text-muted-text mt-0.5 lowercase font-semibold">broadcasting live predictions</p>
                        </div>
                      </div>

                      {/* Wave audio speaker buttons */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-end h-[24px] px-2.5">
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleVoiceSynthesis(matchAnalysisResult.commentary)}
                          className={`px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
                            isSpeaking 
                              ? "bg-red-950/60 border-red-500/25 text-red-300" 
                              : "bg-accent-green text-black border-accent-green hover:bg-[#b5db5e]"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-4 h-4" />
                              Mute
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4" />
                              Listen Live
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0E0F0F]/90 border border-white/5 rounded-2xl p-5 md:p-6 relative min-h-[100px] flex items-center">
                      <TypingCommentary text={matchAnalysisResult.commentary} />
                    </div>
                  </div>

                  {/* ROW 3: FINAL PREDICTION ORACLE */}
                  <div className="glass-panel p-6 md:p-8 border border-yellow-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-36 h-36 bg-gradient-to-tr from-gold/10 to-transparent rounded-tl-full pointer-events-none" />

                    <div className="flex items-center gap-3.5 mb-5">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Sparkles className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gold">
                          🔮 Match Prediction Oracle
                        </h4>
                        <p className="text-[10px] text-muted-text mt-0.5 lowercase font-semibold">projected endgame sequence</p>
                      </div>
                    </div>

                    <div className="border border-amber-500/10 bg-amber-950/15 rounded-2xl p-5 md:p-6">
                      <p className="text-sm md:text-base font-extrabold text-white tracking-wide leading-relaxed font-mono">
                        {matchAnalysisResult.prediction}
                      </p>
                    </div>
                  </div>

                  {/* Reset action bottom */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleResetMode}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#1A1C1A] hover:bg-[#2B2D2B] border border-white/5 hover:border-white/10 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Simulate Another Scoreboard
                    </button>
                  </div>

                </div>
              </motion.section>
            )}
          </AnimatePresence>

        </div>

        {/* --- FLOATING / SIDEBAR ANALYTICS SECTION --- */}
        <section id="momentum" className="py-12 border-t border-white/5 mt-16 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-3xl font-bebas font-normal tracking-wider text-white uppercase flex items-center justify-center gap-2">
              <TrendingUp className="w-7 h-7 text-accent-green" />
              Live Arena Momentum Dashboard
            </h3>
            <p className="text-xs text-muted-text mt-1.5">
              Supplementary diagnostics demonstrating volumetric pressure spikes and final over boundary projections under stadium conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Widget 1: Match Momentum */}
            <div className="glass-panel p-5 bg-[#1A1C1A]/40 flex flex-col justify-between min-h-[160px] relative group hover:border-accent-green/20 transition-all">
              <div className="absolute right-4 top-4 text-[10px] text-accent-green font-bold tracking-wider bg-emerald-950/40 px-2 py-0.5 rounded border border-accent-green/25">92 dB</div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Match Momentum</span>
                <h5 className="font-bebas font-normal text-2xl text-white tracking-wide uppercase">Batting Surge</h5>
              </div>
              <div className="flex gap-1 h-10 items-end pt-3">
                {[20, 35, 45, 30, 25, 40, 60, 75, 90, 85].map((val, i) => (
                  <div 
                    key={i} 
                    className="flex-1 rounded-t bg-gradient-to-t from-accent-green/60 to-accent-green hover:to-white transition-all cursor-pointer"
                    style={{ height: `${val}%` }}
                    title={`Over ${i+1}: ${val}% intensity`}
                  />
                ))}
              </div>
            </div>

            {/* Widget 2: Crowd Pressure */}
            <div className="glass-panel p-5 bg-[#1A1C1A]/40 flex flex-col justify-between min-h-[160px] relative group hover:border-accent-green/20 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Crowd Decibels</span>
                <h5 className="font-bebas font-normal text-2xl text-white tracking-wide uppercase">Electric</h5>
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-[10px] font-bold text-muted-text">
                  <span>Audible Decibels</span>
                  <span className="text-accent-green">88% peak</span>
                </div>
                <div className="w-full h-2 bg-[#0E0F0F] rounded-full overflow-hidden p-[1px] border border-white/5">
                  <div className="h-full bg-accent-green rounded-full shadow-[0_0_8px_rgba(163,200,83,0.6)]" style={{ width: '88%' }} />
                </div>
              </div>
            </div>

            {/* Widget 3: Boundary Probability */}
            <div className="glass-panel p-5 bg-[#1A1C1A]/40 flex flex-col justify-between min-h-[160px] relative group hover:border-accent-green/20 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Boundary Probability</span>
                <h5 className="font-bebas font-normal text-2xl text-white tracking-wide uppercase">42.5% Next ball</h5>
              </div>
              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded bg-[#0E0F0F] border border-white/5 text-[9px] font-bold flex items-center justify-center text-accent-green">4s</span>
                  <span className="w-5 h-5 rounded bg-[#0E0F0F] border border-white/5 text-[9px] font-bold flex items-center justify-center text-accent-green">6s</span>
                </div>
                <span className="text-[10px] text-muted-text font-semibold">Tension impact: High</span>
              </div>
            </div>

            {/* Widget 4: Final Over Prediction */}
            <div className="glass-panel p-5 bg-[#1A1C1A]/40 flex flex-col justify-between min-h-[160px] relative group hover:border-accent-green/20 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Final Over Prediction</span>
                <h5 className="font-bebas font-normal text-2xl text-white tracking-wide uppercase">68% Chasing win</h5>
              </div>
              <div className="pt-4 flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent-green animate-ping" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-accent-green">Simulating sequence...</span>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-10 mt-auto z-20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold font-poppins text-muted-text">
        <div>
          <p>© 2026 CrickVoice AI. All rights reserved.</p>
          <p className="text-[10px] text-muted-text/50 mt-1">Cinematic audio-atmosphere commentator & cricket emotion simulator.</p>
        </div>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-white/10">|</span>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <span className="text-white/10">|</span>
          <span className="text-accent-green font-bold uppercase tracking-widest text-[10px]">Powered by Gemini 2.5</span>
        </div>
      </footer>

    </div>
  );
}
