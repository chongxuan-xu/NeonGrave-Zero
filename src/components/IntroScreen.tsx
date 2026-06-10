import { useEffect, useState } from "react";
import { cyberAudio } from "../sound";
import { Terminal, Shield, RefreshCw, Cpu, Activity, Play } from "lucide-react";

interface IntroScreenProps {
  onIntroComplete: () => void;
}

export default function IntroScreen({ onIntroComplete }: IntroScreenProps) {
  const [loadProgress, setLoadProgress] = useState(0);
  const [typedMsg, setTypedMsg] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const fullStory = "PROJECT NEON GRAVE APPROVED. SOUL CONSCIOUSNESS UPLOAD: SUCCESSFUL. EXPERIMENTAL RE-ASSEMBLED COMBAT ANDROID V4 INITIALIZED. URBAN ECO-POLIS UNDER SIEGE BY UNNAMED ORBITAL MACHINE DEITIES. FIND THE TRUTH BEFORE THE CENTRAL CODE COMPILER PURGES THIS SYSTEM REVOLUTION...";

  useEffect(() => {
    cyberAudio.playHack();

    // Increment progress bar indices
    const bar = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(bar);
          return 100;
        }
        return prev + 2.5;
      });
    }, 45);

    // Dynamic terminal loading checklist steps
    const steps = setInterval(() => {
      setLoadingStep((prev) => {
        cyberAudio.playGlitch();
        if (prev >= 4) {
          clearInterval(steps);
          return 4;
        }
        return prev + 1;
      });
    }, 700);

    // Animating the deep text story
    let idx = 0;
    const typing = setInterval(() => {
      setTypedMsg((prev) => prev + fullStory[idx - 1]);
      idx++;
      if (idx > fullStory.length) {
        clearInterval(typing);
      }
    }, 18);

    return () => {
      clearInterval(bar);
      clearInterval(steps);
      clearInterval(typing);
    };
  }, []);

  const handleFinish = () => {
    cyberAudio.playHack();
    onIntroComplete();
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] text-[#00f3ff] font-mono flex items-center justify-center p-6 overflow-hidden border-8 border-[#0a0a12]">
      
      {/* Visual Visor Lines */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(0,243,255,0.01),rgba(255,0,85,0.01))] bg-[length:100%_4px,3px_100%] opacity-40" />

      {/* Cyber glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f3ff]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff0055]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Terminal Board Panel */}
      <div className="relative z-10 max-w-xl w-full bg-black/90 p-8 border border-[#00f3ff]/30 rounded-md shadow-[0_0_40px_rgba(0,243,255,0.12)] flex flex-col gap-6">
        
        {/* Header scanner */}
        <div className="flex items-center gap-3 border-b border-[#00f3ff]/20 pb-4 justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="text-[#00f3ff] animate-pulse" size={18} />
            <span className="text-sm font-black tracking-widest text-[#00f3ff]">BOOTSTRAPPING TERMINAL</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">CHASSIS_0_V4</span>
        </div>

        {/* Loading Steps checklist */}
        <div className="flex flex-col gap-2.5 bg-[#04050d] border border-[#00f3ff]/20 p-4 rounded text-[11px] leading-relaxed">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <Cpu size={12} className={loadingStep >= 1 ? "text-[#00f3ff]" : "text-slate-600 animate-spin"} />
              1. LOCATING RESIDENT MEMORY CHIP COGNITION...
            </span>
            {loadingStep >= 1 ? <span className="text-[#00f3ff] font-bold">READY</span> : <span className="text-slate-500">SEEKING</span>}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <Shield size={12} className={loadingStep >= 2 ? "text-[#00f3ff]" : "text-slate-600"} />
              2. CONFIGURING NANO-SUIT KINETIC MATRIX RESISTANCE...
            </span>
            {loadingStep >= 2 ? <span className="text-[#00f3ff] font-bold">READY</span> : <span className="text-slate-500">QUEUE</span>}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <Activity size={12} className={loadingStep >= 3 ? "text-[#00f3ff]" : "text-slate-600"} />
              3. DEPLOYING ENERGY TRANSLATION REFLECTORS...
            </span>
            {loadingStep >= 3 ? <span className="text-[#00f3ff] font-bold">READY</span> : <span className="text-slate-500">QUEUE</span>}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <RefreshCw size={12} className={loadingStep >= 4 ? "text-[#ff0055] animate-spin" : "text-slate-600"} />
              4. HARNESSING ORBITAL TELEMETRY SECURE RELAYS...
            </span>
            {loadingStep >= 4 ? <span className="text-[#ff0055] font-bold animate-pulse">CONNECTED</span> : <span className="text-slate-500">WAITING</span>}
          </div>
        </div>

        {/* Cinematic typing content storyline */}
        <div className="border border-[#00f3ff]/20 bg-slate-950/70 p-5 rounded min-h-[140px]">
          <p className="text-[12px] leading-relaxed text-slate-200">
            {typedMsg}
            <span className="inline-block w-1.5 h-3.5 bg-[#00f3ff] animate-pulse ml-0.5" />
          </p>
        </div>

        {/* Progress percent bar overlay */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider">
            <span>SYNAPSE CALIBRATION MATRIX</span>
            <span className="text-[#00f3ff]">{Math.round(loadProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px] border border-[#00f3ff]/20">
            <div className="h-full bg-gradient-to-r from-[#00f3ff] to-[#ff0055] transition-all duration-75" style={{ width: `${loadProgress}%` }} />
          </div>
        </div>

        {/* Completion button trigger */}
        <button
          onClick={handleFinish}
          disabled={loadProgress < 100}
          id="sync-chassis-btn"
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#ff0055] to-[#c00040] hover:from-[#ff1a6c] hover:to-[#ff0055] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded font-mono tracking-widest text-xs cursor-pointer shadow-[0_0_20px_rgba(255,0,85,0.25)] transition-all duration-300 border border-[#ff0055]/20 active:scale-95"
        >
          <Play size={13} className="fill-current" />
          SYNC CHASSIS BOOTSTRAP
        </button>
      </div>

      {/* CORNER ACCENTS - FROM SYSTEM LAYOUT */}
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-[#00f3ff22] rounded-bl-md pointer-events-none z-10 hidden md:block"></div>
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-[#00f3ff22] rounded-br-md pointer-events-none z-10 hidden md:block"></div>
    </div>
  );
}
