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
  Activity
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
    }, 90); // Typing speed per word

    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="text-gray-100 font-mono italic leading-relaxed text-sm md:text-base selection:bg-neon-green/30">
      &ldquo;{displayedText}&rdquo;
      {indexRef.current < text.split(" ").length && (
        <span className="inline-block w-2 h-4 ml-1 bg-neon-green animate-pulse">|</span>
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
        }, 100);
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
        }, 100);
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
        return "shadow-[0_0_30px_rgba(245,158,11,0.25)] border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20";
      case "Nervous":
        return "shadow-[0_0_30px_rgba(239,68,68,0.25)] border-red-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/20";
      case "Chaotic":
        return "shadow-[0_0_30px_rgba(168,85,247,0.25)] border-purple-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20";
      case "Silent":
        return "shadow-[0_0_30px_rgba(75,85,99,0.15)] border-gray-600/30 bg-gradient-to-br from-slate-950 to-slate-900";
      default: // Electric
        return "shadow-[0_0_30px_rgba(34,197,94,0.25)] border-green-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-green-950/20";
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

  return (
    <div className="relative min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans overflow-x-hidden selection:bg-neon-green/30">
      
      {/* Background spotlights & grids */}
      <div className="stadium-lights" />
      <div className="stadium-grid" />
      <div className="spotlight-left" />
      <div className="spotlight-right" />

      {/* Lens flares */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-10 pointer-events-none opacity-40 z-10">
        <div className="w-[10px] h-[10px] bg-white rounded-full blur-[10px] shadow-[0_0_40px_20px_white]" />
        <div className="w-[15px] h-[15px] bg-neon-green rounded-full blur-[12px] shadow-[0_0_55px_25px_#22c55e]" />
        <div className="w-[10px] h-[10px] bg-white rounded-full blur-[10px] shadow-[0_0_40px_20px_white]" />
      </div>

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-20 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-950/80 border border-neon-green/30 shadow-[0_0_15px_rgba(34,197,94,0.2)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-neon-volt opacity-50 pulse-glow-green" />
            <Volume2 className="w-5 h-5 text-neon-volt relative z-10 animate-bounce" style={{ animationDuration: '3.5s' }} />
          </div>
          <div>
            <h1 className="font-mono font-black text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-neon-volt">
              CRICKVOICE <span className="text-neon-green">AI</span>
            </h1>
            <p className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">Dual-Engine Commentary</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-neon-volt">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping" />
            Gemini 2.5 Flash SDK Active
          </span>
          <button 
            onClick={() => controllerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer font-bold"
          >
            Launch Room
          </button>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 relative z-20 pb-24">
        
        {/* HERO SECTION */}
        <section className="py-16 md:py-24 flex flex-col items-center text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl flex flex-col items-center"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-neon-green/30 text-neon-volt text-xs font-semibold tracking-wider uppercase mb-8 shadow-[0_0_15px_rgba(34,197,94,0.1)] animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Multimodal Commentary Predictor & Analyzer
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none text-white mb-6 uppercase">
              CrickVoice <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-green via-neon-volt to-gold relative">AI</span> Commentary
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-400 font-normal max-w-2xl mb-10 leading-relaxed">
              Experience the stadium immediately. Upload actual match video footage to synthesize commentary, or enter dynamic scoreboard rates to map tension indexes and prediction algorithms.
            </p>

            {/* CTA Modes selector */}
            <div ref={controllerSectionRef} className="w-full max-w-xl mx-auto mt-4 p-1.5 rounded-2xl bg-[#090d1a]/80 border border-white/10 flex items-center justify-between relative shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
              <button
                onClick={() => {
                  setActiveMode("video");
                  setValidationError("");
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wider uppercase cursor-pointer transition-all z-10 ${
                  activeMode === "video" 
                    ? "bg-neon-green text-black font-extrabold shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Video className="w-4 h-4" />
                Video Commentary
              </button>
              
              <button
                onClick={() => {
                  setActiveMode("match");
                  setValidationError("");
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wider uppercase cursor-pointer transition-all z-10 ${
                  activeMode === "match" 
                    ? "bg-neon-green text-black font-extrabold shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Activity className="w-4 h-4" />
                Score Simulator
              </button>
            </div>
          </motion.div>
        </section>

        {/* --- DYNAMIC WORKSPACE WRAPPER (MODE 1 OR MODE 2) --- */}
        <section className="py-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Form Title Banner */}
            <div className="flex items-end justify-between mb-4 px-2">
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-wide flex items-center gap-2">
                  {activeMode === "video" ? (
                    <>
                      <Mic className="w-5 h-5 text-neon-green" />
                      Visual Commentary Studio
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5 text-neon-green" />
                      Match Situation Room
                    </>
                  )}
                </h2>
                <p className="text-xs text-gray-400">
                  {activeMode === "video" 
                    ? "Upload match media and let Gemini synthesize stadium voice reports."
                    : "Simulate pressure sliders and runs-to-balls indexes dynamically."}
                </p>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase">
                {activeMode === "video" ? "Mode 1 Dashboard" : "Mode 2 Simulator"}
              </span>
            </div>

            {/* Glassmorphic Panel Container */}
            <div className="glass-panel rounded-2xl border border-white/10 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-gradient-to-r from-neon-green/30 via-neon-volt to-gold/30" />
              
              {/* --- MODE 1 CONTENT: VIDEO COMMENTARY UPLOADER --- */}
              {activeMode === "video" && (
                <form onSubmit={handleGenerateVideoCommentary} className="space-y-6">
                  
                  {/* File Upload Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative w-full min-h-[220px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all ${
                      isDragOver 
                        ? "border-neon-green bg-neon-green/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
                        : selectedFile 
                        ? "border-emerald-600/50 bg-[#060814]" 
                        : "border-white/10 hover:border-white/20 bg-[#030712]/50"
                    }`}
                  >
                    {selectedFile ? (
                      <div className="w-full flex flex-col items-center space-y-4">
                        {/* Render dynamic preview depending on file type */}
                        {selectedFile.type.startsWith("video/") ? (
                          <video
                            src={filePreviewUrl}
                            controls
                            className="max-h-[160px] rounded-lg border border-white/10 shadow-lg"
                          />
                        ) : (
                          <img
                            src={filePreviewUrl}
                            alt="Uploaded cricket context"
                            className="max-h-[160px] rounded-lg border border-white/10 shadow-lg object-contain"
                          />
                        )}
                        <div className="text-center font-mono text-xs">
                          <p className="text-white font-bold max-w-sm truncate">{selectedFile.name}</p>
                          <p className="text-gray-500 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setFilePreviewUrl("");
                            }}
                            className="mt-3 px-3 py-1 rounded bg-red-950/60 border border-red-500/25 hover:bg-red-900/60 text-red-300 font-bold transition-all cursor-pointer"
                          >
                            Remove file
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                          <Upload className="w-6 h-6 text-neon-volt animate-bounce" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Drag and drop your cricket media here</p>
                          <p className="text-xs text-gray-500 mt-1">Supports MP4, MOV, PNG, or JPG (Max 30s / 25MB)</p>
                        </div>
                        <label className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold cursor-pointer transition-all hover:scale-105 active:scale-100">
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

                  {/* Visual selectors options row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Commentary Style Selector */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
                        <span>Commentary Voice Style</span>
                        <span className="text-[10px] text-neon-volt lowercase font-normal italic">modulates pitch/mood</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {["Professional", "IPL Excited", "Hindi Commentary", "Funny", "Radio Style"].map((sty) => (
                          <button
                            key={sty}
                            type="button"
                            onClick={() => setCommentaryStyle(sty)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer truncate ${
                              commentaryStyle === sty 
                                ? "bg-emerald-950/60 border-neon-green text-neon-volt shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
                                : "bg-[#030712]/80 border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
                            }`}
                          >
                            {sty}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-neon-volt" />
                        Language Output
                      </label>
                      <div className="flex gap-4">
                        {["English", "Hindi"].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setCommentaryLanguage(lang)}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg border transition-all cursor-pointer ${
                              commentaryLanguage === lang 
                                ? "bg-emerald-950/60 border-neon-green text-neon-volt shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
                                : "bg-[#030712]/80 border-white/10 hover:border-white/20 text-gray-400"
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
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
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
                      className="px-6 py-3.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs font-mono tracking-wider uppercase text-gray-400 cursor-pointer"
                    >
                      Clear
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !selectedFile}
                      className="relative group overflow-hidden px-8 py-3.5 rounded-xl bg-neon-green hover:bg-[#1db053] text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        Generate Commentary
                        <ChevronRight className="w-4 h-4" />
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-neon-volt to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  </div>

                </form>
              )}

              {/* --- MODE 2 CONTENT: SCORE SITUATION SIMULATOR --- */}
              {activeMode === "match" && (
                <div className="space-y-6">
                  
                  {/* UX PRESETS SUBSECTION */}
                  <div id="presets">
                    <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-emerald-500 mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      Situation Sandbox
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {MATCH_TEMPLATES.map((tpl, i) => (
                        <div
                          key={i}
                          onClick={() => handleApplyMatchTemplate(tpl)}
                          className="glass-panel glass-panel-hover p-3 rounded-lg cursor-pointer border border-white/5 text-left group"
                        >
                          <h4 className="font-bold text-[11px] text-white group-hover:text-neon-volt transition-colors line-clamp-1">
                            {tpl.name}
                          </h4>
                          <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-gray-500 border-t border-white/5 pt-1.5">
                            <span>Runs: <strong className="text-neon-green">{tpl.requiredRuns}</strong></span>
                            <span>Balls: <strong className="text-white">{tpl.ballsLeft}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* INPUT FORM GRID */}
                  <form onSubmit={handleGenerateMatchAnalysis}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Fields Column */}
                      <div className="space-y-4">
                        {/* Score */}
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
                            <span>Current Score <strong className="text-rose-500">*</strong></span>
                            <span className="text-gray-500 text-[10px] lowercase font-normal">(runs/wickets format)</span>
                          </label>
                          <input
                            type="text"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder="145/6"
                            className="w-full bg-[#030712]/80 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono transition-all"
                            required
                          />
                        </div>

                        {/* Required Runs */}
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                            Required Runs <strong className="text-rose-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={requiredRuns}
                            onChange={(e) => setRequiredRuns(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="22"
                            className="w-full bg-[#030712]/80 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono transition-all"
                            required
                            min="0"
                          />
                        </div>

                        {/* Balls Left */}
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                            Balls Left <strong className="text-rose-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={ballsLeft}
                            onChange={(e) => setBallsLeft(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="12"
                            className="w-full bg-[#030712]/80 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono transition-all"
                            required
                            min="0"
                          />
                        </div>

                        {/* Wickets Left */}
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                            Wickets Remaining <strong className="text-rose-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={wicketsLeft}
                            onChange={(e) => setWicketsLeft(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="4"
                            className="w-full bg-[#030712]/80 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono transition-all"
                            required
                            min="0"
                            max="10"
                          />
                        </div>
                      </div>

                      {/* Right Fields Column */}
                      <div className="space-y-4">
                        {/* Current Run Rate */}
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                            Current Run Rate (CRR) <strong className="text-rose-500">*</strong>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={runRate}
                            onChange={(e) => setRunRate(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="8.2"
                            className="w-full bg-[#030712]/80 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono transition-all"
                            required
                          />
                        </div>

                        {/* Required Run Rate */}
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
                            <span>Required Run Rate (RRR) <strong className="text-rose-500">*</strong></span>
                            <span className="text-[10px] text-neon-volt italic font-normal flex items-center gap-0.5">
                              <Info className="w-3 h-3" /> Auto-calculated
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={requiredRunRate}
                            onChange={(e) => setRequiredRunRate(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="11.0"
                            className="w-full bg-[#030712]/80 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono transition-all"
                            required
                          />
                        </div>

                        {/* Strike Rate */}
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                            Strike Rate of Striker <strong className="text-rose-500">*</strong>
                          </label>
                          <input
                            type="number"
                            value={strikeRate}
                            onChange={(e) => setStrikeRate(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="165"
                            className="w-full bg-[#030712]/80 border border-white/10 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono transition-all"
                            required
                          />
                        </div>

                        {/* Pressure slider */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Match Pressure Slider</label>
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-neon-green/30 text-neon-volt font-mono font-black">
                              {pressure}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={pressure}
                            onChange={(e) => setPressure(Number(e.target.value))}
                            className="w-full h-2 bg-[#030712] rounded-lg appearance-none cursor-pointer accent-neon-green focus:outline-none"
                          />
                          <div className="flex justify-between text-[10px] text-gray-500 mt-2 px-1 font-mono">
                            <span className={pressure <= 3 ? "text-neon-green font-bold" : ""}>1 (Friendly)</span>
                            <span className={pressure > 3 && pressure <= 7 ? "text-neon-volt font-bold" : ""}>5 (League)</span>
                            <span className={pressure > 7 ? "text-gold font-bold animate-pulse" : ""}>10 (World Cup Final)</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Validation Errors banner */}
                    <AnimatePresence>
                      {validationError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 overflow-hidden"
                        >
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="font-semibold">{validationError}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Score simulator action bars */}
                    <div className="flex justify-end pt-6 border-t border-white/5 gap-4 mt-6">
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
                        className="px-6 py-3.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs font-mono tracking-wider uppercase text-gray-400 cursor-pointer"
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="relative group overflow-hidden px-8 py-3.5 rounded-xl bg-neon-green hover:bg-[#1db053] text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1.5">
                          Predict Match Emotion
                          <ChevronRight className="w-4 h-4" />
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-neon-volt to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                    className="absolute inset-0 bg-[#030712]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-30"
                  >
                    {/* Glowing scanner sweep lines */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div 
                        className="w-full h-[3px] bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-80 shadow-[0_0_25px_#22c55e]"
                        style={{
                          animation: 'float 2s infinite ease-in-out',
                        }}
                      />
                    </div>

                    <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-950 border-t-neon-green border-r-neon-volt animate-spin" style={{ animationDuration: '1.2s' }} />
                      <div className="absolute inset-2 rounded-full border border-dashed border-emerald-900 border-b-gold animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                      {activeMode === "video" ? (
                        <Video className="w-10 h-10 text-neon-volt animate-pulse" />
                      ) : (
                        <Activity className="w-10 h-10 text-neon-volt animate-pulse" />
                      )}
                    </div>

                    <h3 className="font-mono text-sm uppercase tracking-widest text-white mb-2 font-black flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                      {activeMode === "video" ? "Extracting & Translating Footage" : "Compiling Scoreboard Matrix"}
                    </h3>

                    <div className="h-6 overflow-hidden">
                      <p className="text-xs text-gray-500 font-mono italic animate-pulse">
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
        <div ref={dashboardRef} className="scroll-mt-8">
          
          {/* --- RESULTS 1: VIDEO COMMENTARY RESULTS PANEL --- */}
          <AnimatePresence>
            {videoCommentaryResult && (
              <motion.section
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="py-8"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {/* Title */}
                  <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 bg-neon-green rounded-full shadow-[0_0_8px_#22c55e]" />
                      <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2">
                        Synthesized Broadcast Report
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-neon-volt uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping" /> Live Video Review
                    </span>
                  </div>

                  {/* BENTO GRID (2 columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* BENTO 1: Video Preview Card */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden relative">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-emerald-500" />
                        Uploaded Footplay Media
                      </h4>
                      <div className="flex-1 flex items-center justify-center bg-[#030712]/80 rounded-xl overflow-hidden p-2 border border-white/5 min-h-[180px]">
                        {selectedFile?.type.startsWith("video/") ? (
                          <video
                            src={filePreviewUrl}
                            controls
                            className="w-full max-h-[220px] rounded-lg object-contain"
                          />
                        ) : (
                          <img
                            src={filePreviewUrl}
                            alt="Visual context key"
                            className="w-full max-h-[220px] rounded-lg object-contain"
                          />
                        )}
                      </div>
                      <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono text-gray-500">
                        <span>Format: <strong className="text-white">{selectedFile?.name.substring(selectedFile.name.lastIndexOf(".") + 1).toUpperCase() || ""}</strong></span>
                        <span>Size: <strong className="text-white">{((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB</strong></span>
                      </div>
                    </div>

                    {/* BENTO 2: Excitement, Highlight, Player */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Excitement Rating */}
                      <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-5 relative group">
                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.03)" strokeWidth="5" fill="transparent" />
                            <circle 
                              cx="40" 
                              cy="40" 
                              r="32" 
                              stroke="#22c55e" 
                              strokeWidth="5" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 32}
                              strokeDashoffset={2 * Math.PI * 32 * (1 - videoCommentaryResult.excitement / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute text-xl font-black text-white font-mono">
                            <CountUp value={videoCommentaryResult.excitement} />%
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-emerald-500" />
                            Moment Excitement
                          </h4>
                          <p className="text-sm font-bold text-white mt-1">Simulated stadium noise.</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Crowd decibel fluctuations peak at this moment.</p>
                        </div>
                      </div>

                      {/* Highlight overview */}
                      <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-neon-volt" />
                          Moments Highlights
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-semibold italic bg-[#030712]/40 p-3 rounded-lg border border-white/5">
                          {videoCommentaryResult.highlight}
                        </p>
                      </div>

                      {/* Player of the Moment */}
                      <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-gold" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-gray-500 block uppercase">Player of Moment</span>
                            <span className="text-xs font-black text-white uppercase font-mono tracking-wider">{videoCommentaryResult.player}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-gold bg-yellow-950/50 px-2 py-0.5 rounded border border-yellow-900/30">
                          Standout Performer
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* ROW 2: LIVE BROADCAST COMMENTARY BOX */}
                  <div className="glass-panel p-6 rounded-2xl border border-neon-green/20 shadow-[0_0_20px_rgba(34,197,94,0.05)] relative overflow-hidden">
                    <div className="absolute -left-12 -top-12 w-28 h-28 bg-neon-green/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded bg-neon-green/10 border border-neon-green/30">
                          <Mic className="w-4 h-4 text-neon-green animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                            🎙 AI Broadcast Commentary Booth
                          </h4>
                          <p className="text-[9px] font-mono text-gray-500 lowercase">style: {commentaryStyle} | language: {commentaryLanguage}</p>
                        </div>
                      </div>

                      {/* Equalizers and Play vocal button */}
                      <div className="flex items-center gap-3">
                        
                        {/* Audio Wave */}
                        <div className="flex items-end h-[24px] px-2">
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
                          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSpeaking 
                              ? "bg-red-950/60 border-red-500/30 text-red-300" 
                              : "bg-emerald-950/60 border-neon-green/40 text-neon-volt hover:bg-emerald-900/60"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              Mute Broadcaster
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              Speak Commentary
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#030712]/80 border border-white/5 rounded-xl p-4 md:p-5 relative min-h-[90px] flex items-center">
                      <TypingCommentary text={videoCommentaryResult.commentary} />
                    </div>
                  </div>

                  {/* ROW 3: SOCIAL CAPTION COMPONENT */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Viral Share Caption</span>
                      <p className="text-xs text-gray-200 font-mono italic selection:bg-neon-green/30">
                        {videoCommentaryResult.caption}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(videoCommentaryResult.caption)}
                      className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 text-xs font-mono font-bold shrink-0 cursor-pointer text-gray-300 hover:text-white"
                    >
                      {copiedCaption ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-neon-green" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Share
                        </>
                      )}
                    </button>
                  </div>

                  {/* Reset action bottom */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleResetMode}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Analyze Another Video
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
                className="py-8"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {/* Header title */}
                  <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 bg-neon-green rounded-full shadow-[0_0_8px_#22c55e]" />
                      <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2">
                        Simulated Emotional Metrics
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-neon-volt uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping" /> Live Prediction
                    </span>
                  </div>

                  {/* BENTO GRID (3 Columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* BENTO 1: Excitement Meter */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden relative group">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-emerald-500" />
                            Excitement Score
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/30">
                            {matchAnalysisResult.excitement >= 85 ? "Extreme" : matchAnalysisResult.excitement >= 60 ? "Thrilling" : "Moderate"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-5 my-2">
                          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                              <circle 
                                cx="40" 
                                cy="40" 
                                r="32" 
                                stroke="#22c55e" 
                                strokeWidth="6" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 * (1 - matchAnalysisResult.excitement / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute text-xl font-black text-white font-mono">
                              <CountUp value={matchAnalysisResult.excitement} />%
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            <p className="font-semibold text-white">Crowd Decibel</p>
                            <p className="mt-1 leading-relaxed text-[11px]">Crowd decibel fluctuations peak at this moment.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 2: Tension Meter */}
                    <div className={`glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden relative group ${matchAnalysisResult.tension >= 80 ? 'shake-tension border-red-500/20' : ''}`}>
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-red-500" />
                            Tension Index
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            matchAnalysisResult.tension >= 85 ? 'text-red-400 bg-red-950/50 border-red-900/30' : 'text-orange-400 bg-orange-950/50 border-orange-900/30'
                          }`}>
                            {matchAnalysisResult.tension >= 85 ? "Critical" : matchAnalysisResult.tension >= 65 ? "High" : "Controlled"}
                          </span>
                        </div>

                        <div className="my-2">
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-[11px] text-gray-400 font-mono">Stress Index</span>
                            <span className={`text-xl font-mono font-black ${matchAnalysisResult.tension >= 80 ? 'text-red-500' : 'text-orange-400'}`}>
                              <CountUp value={matchAnalysisResult.tension} />/100
                            </span>
                          </div>
                          <div className="w-full h-3 bg-red-950/20 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                matchAnalysisResult.tension >= 85 ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-orange-500'
                              }`}
                              style={{ width: `${matchAnalysisResult.tension}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-2.5 leading-relaxed font-mono">
                            {matchAnalysisResult.tension >= 80 ? "Cardiac stress peaking. Nail-biting finish expected." : "Controlled tension. Sturdy defensive setups."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 3: Dominance Indicator */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden relative group">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Trophy className="w-4 h-4 text-gold" />
                            Tactical Dominance
                          </h4>
                          <span className="text-[10px] font-mono text-gold bg-yellow-950/50 px-2 py-0.5 rounded border border-yellow-900/30">
                            Supremacy
                          </span>
                        </div>

                        <div className="my-2 text-center">
                          <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                            <span className={`flex items-center gap-1 ${matchAnalysisResult.dominance === "Batting" ? "text-neon-green" : "text-gray-600"}`}>
                              <Swords className="w-3.5 h-3.5" /> Batting
                            </span>
                            <span className={`text-[10px] uppercase font-normal px-1.5 py-0.5 rounded bg-white/5 text-gray-400 ${matchAnalysisResult.dominance === "Balanced" ? "border border-neon-volt/30 text-neon-volt" : ""}`}>
                              {matchAnalysisResult.dominance === "Balanced" ? "Neutral" : "Tactical Shift"}
                            </span>
                            <span className={`flex items-center gap-1 ${matchAnalysisResult.dominance === "Bowling" ? "text-red-500" : "text-gray-600"}`}>
                              Bowling <Shield className="w-3.5 h-3.5" />
                            </span>
                          </div>

                          <div className="w-full h-3 bg-white/5 rounded-full p-[1px] relative overflow-hidden border border-white/5">
                            <div 
                              className={`absolute top-0 bottom-0 transition-all duration-1000 ease-out rounded-full ${
                                matchAnalysisResult.dominance === "Batting" 
                                  ? "left-0 w-3/4 bg-neon-green shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                                  : matchAnalysisResult.dominance === "Bowling" 
                                  ? "right-0 w-3/4 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]" 
                                  : "left-1/4 right-1/4 bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                              }`}
                            />
                          </div>
                          
                          <div className="mt-3.5 text-xs text-left">
                            <span className="text-gray-400 font-semibold block">Verdict:</span>
                            <span className="text-[11px] text-gray-500 leading-normal font-mono">
                              {matchAnalysisResult.dominance === "Batting" 
                                ? "The batters are operating in control, putting bowlers on warning."
                                : matchAnalysisResult.dominance === "Bowling"
                                ? "Bowling attack has choked run flow. Fall of wickets impending."
                                : "Both units locked in a tactical equilibrium. Dot balls are key."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 4: Suspense Level */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 md:col-span-1 flex flex-col justify-between overflow-hidden relative group">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            Suspense index
                          </h4>
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/30">
                            {matchAnalysisResult.suspense >= 85 ? "Max Drama" : matchAnalysisResult.suspense >= 55 ? "High" : "Standard"}
                          </span>
                        </div>

                        <div className="my-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500 font-mono">Outcome volatility</span>
                            <span className="font-mono text-lg font-black text-indigo-300">
                              <CountUp value={matchAnalysisResult.suspense} />%
                            </span>
                          </div>

                          <div className="w-full h-8 flex items-end justify-between px-1 bg-[#030712]/50 rounded-lg py-1 border border-white/5">
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
                          <p className="text-[11px] text-gray-500 mt-3 leading-relaxed font-mono">
                            High suspense values signal that any boundary or dot ball completely swings prediction algorithms.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 5: Win Probability */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 md:col-span-1 flex flex-col justify-between overflow-hidden relative group">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <ChevronRight className="w-4 h-4 text-teal-400" />
                            Probability Matrix
                          </h4>
                          <span className="text-[10px] font-mono text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-900/30">
                            Calculation
                          </span>
                        </div>

                        <div className="my-2">
                          <div className="flex justify-between text-xs font-bold mb-2 font-mono">
                            <span className="text-neon-green">Batting: {matchAnalysisResult.winProbability}%</span>
                            <span className="text-red-400">Bowling: {100 - matchAnalysisResult.winProbability}%</span>
                          </div>

                          <div className="w-full h-4 bg-red-950/30 rounded-full flex overflow-hidden p-[1px] border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-600 to-neon-green rounded-l transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                              style={{ width: `${matchAnalysisResult.winProbability}%` }}
                            />
                            <div 
                              className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-r transition-all duration-1000 ease-out"
                              style={{ width: `${100 - matchAnalysisResult.winProbability}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-2 uppercase">
                            <span>Runs Needed</span>
                            <span>Line Defended</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BENTO 6: Stadium Atmosphere */}
                    <div className={`glass-panel p-5 rounded-2xl border transition-all duration-700 ${getAtmosphereGlow(matchAnalysisResult.atmosphere)} flex flex-col justify-between overflow-hidden relative group`}>
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-400" />
                            Stadium Acoustics
                          </h4>
                          <span className="text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">
                            Ambience
                          </span>
                        </div>

                        <div className="my-2 float-slow">
                          <div className="text-3xl font-black tracking-wider text-white uppercase font-mono flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            {matchAnalysisResult.atmosphere}
                          </div>
                          
                          <p className="text-[11px] text-gray-300 mt-3 leading-relaxed font-mono">
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
                  <div className="glass-panel p-6 rounded-2xl border border-neon-green/20 shadow-[0_0_20px_rgba(34,197,94,0.05)] relative overflow-hidden">
                    <div className="absolute -left-12 -top-12 w-28 h-28 bg-neon-green/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded bg-neon-green/10 border border-neon-green/30">
                          <Mic className="w-4 h-4 text-neon-green animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                            🎙 AI Broadcast Commentary
                          </h4>
                          <p className="text-[9px] font-mono text-gray-500 lowercase">broadcasting live predictions</p>
                        </div>
                      </div>

                      {/* Wave audio speaker buttons */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-end h-[24px] px-2">
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                          <span className="audio-bar" style={{ animationPlayState: isSpeaking ? 'running' : 'paused' }} />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleVoiceSynthesis(matchAnalysisResult.commentary)}
                          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSpeaking 
                              ? "bg-red-950/60 border-red-500/30 text-red-300" 
                              : "bg-emerald-950/60 border-neon-green/40 text-neon-volt hover:bg-emerald-900/60"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              Mute Broadcaster
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              Speak Commentary
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#030712]/80 border border-white/5 rounded-xl p-4 md:p-5 relative min-h-[90px] flex items-center">
                      <TypingCommentary text={matchAnalysisResult.commentary} />
                    </div>
                  </div>

                  {/* ROW 3: FINAL PREDICTION ORACLE */}
                  <div className="glass-panel p-6 rounded-2xl border border-neon-border-gold shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tr from-gold/10 to-transparent rounded-tl-full pointer-events-none" />

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30">
                        <Sparkles className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-gold font-bold">
                          🔮 Match Prediction Oracle
                        </h4>
                        <p className="text-[9px] font-mono text-gray-500 lowercase">projected endgame sequence</p>
                      </div>
                    </div>

                    <div className="border border-amber-500/10 bg-amber-950/10 rounded-xl p-4 md:p-5">
                      <p className="text-sm md:text-base font-extrabold text-white tracking-wide leading-relaxed font-mono">
                        {matchAnalysisResult.prediction}
                      </p>
                    </div>
                  </div>

                  {/* Reset action bottom */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleResetMode}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
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

      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-8 mt-auto z-20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-gray-500">
        <div>
          <p>© 2026 CrickVoice AI. All rights reserved.</p>
          <p className="text-[10px] text-gray-600 mt-1">Cinematic audio-atmosphere commentator & cricket emotion simulator.</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-white/10">|</span>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <span className="text-white/10">|</span>
          <span className="text-neon-volt/60 font-semibold uppercase">Powered by Gemini 2.5</span>
        </div>
      </footer>

    </div>
  );
}
