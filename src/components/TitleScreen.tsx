import { useEffect, useState, useRef, Dispatch, SetStateAction } from "react";
import { cyberAudio } from "../sound";
import { Info, Cpu, Play, Database, RefreshCw, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import ControlsManual from "./ControlsManual";

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenUpgrades: () => void;
  onOpenDatabase: () => void;
  onOpenSettings: () => void;
  credits: number;
  runs: number;
  prestigeLevel?: number;
  activeMutators?: string[];
  setActiveMutators?: Dispatch<SetStateAction<string[]>>;
}

const GAME_MUTATORS = [
  { id: "shield_depletion", name: "DEFLECTOR OFFLINE", desc: "Shield is permanently disabled (0 Max Shield)", creditBonus: "+100% Credits", color: "#f43f5e" },
  { id: "hollow_hull", name: "FRAGILE REBOOT", desc: "Max standard HP is reduced by 50%", creditBonus: "+80% Credits", color: "#f43f5e" },
  { id: "nightmare_splicers", name: "OVERCLOCKED SAINTS", desc: "Standard enemies move +40% faster & have +50% health", creditBonus: "+150% Credits", color: "#ef4444" },
  { id: "chrono_drag", name: "CHRONO SPATIAL FRICTION", desc: "Movement speed is slowed by 30% & fire rate is 30% slower", creditBonus: "+60% Credits", color: "#a855f7" },
  { id: "style_decay", name: "STYLE DECAY PARADIGM", desc: "Style rating points decay twice as fast", creditBonus: "+80% Credits", color: "#fb7185" },
];

export default function TitleScreen({ 
  onStartGame, 
  onOpenUpgrades, 
  onOpenDatabase, 
  onOpenSettings, 
  credits, 
  runs,
  prestigeLevel = 0,
  activeMutators = [],
  setActiveMutators
}: TitleScreenProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [glitchActive, setGlitchActive] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [screenState, setScreenState] = useState<"main" | "anomalies">("main");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initial audio state sync
    setIsMuted(cyberAudio.getMuteState());

    // Slow ambient sound reminder
    const timer = setInterval(() => {
      setGlitchActive(true);
      cyberAudio.playGlitch();
      setTimeout(() => setGlitchActive(false), 300);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  // Animate the title screen backdrop: rain, neon fog, flickering ads, kneeling android skeleton, and colossal drifting machine god eyes in the clouds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Rain particles
    const rainCount = 120;
    const rain: Array<{ x: number; y: number; speed: number; len: number; o: number }> = [];
    for (let i = 0; i < rainCount; i++) {
      rain.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: Math.random() * 10 + 12,
        len: Math.random() * 15 + 15,
        o: Math.random() * 0.4 + 0.2,
      });
    }

    // Distant machine god eye coordinates
    let eyePulse = 0;
    let eyeSweep = 0;

    // Flickering billboards
    let addFlicker = 1;

    const render = () => {
      ctx.fillStyle = "#020205"; // deep pitch midnight void
      ctx.fillRect(0, 0, width, height);

      // Draw distant neon vector grid and skyscrapers
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(1.1, 1.1);
      ctx.translate(-width / 2, -height / 2);

      // Distant mountain outline or megastructure
      ctx.fillStyle = "#0a0a14";
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width * 0.1, height * 0.4);
      ctx.lineTo(width * 0.25, height * 0.55);
      ctx.lineTo(width * 0.5, height * 0.15); // colossal brutalist tower
      ctx.lineTo(width * 0.6, height * 0.5);
      ctx.lineTo(width * 0.85, height * 0.35);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Brutalist building panels and glowing yellow/cyan window grids
      ctx.strokeStyle = "rgba(45, 212, 191, 0.15)";
      ctx.lineWidth = 1.5;
      
      // Colossal central spire grid lines
      ctx.beginPath();
      for (let x = width * 0.42; x < width * 0.58; x += 15) {
        ctx.moveTo(x, height * 0.15);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      // Holographic Machine God rising in cloud canopy
      eyePulse += 0.02;
      eyeSweep = Math.sin(eyePulse * 0.5) * 15;
      const eyeOpacity = 0.2 + Math.abs(Math.sin(eyePulse)) * 0.15;
      const eyeY = height * 0.24;

      ctx.shadowBlur = 25;
      ctx.shadowColor = "#f43f5e"; // rose glow for corrupted machine mind
      ctx.strokeStyle = `rgba(244, 63, 94, ${eyeOpacity})`;
      ctx.lineWidth = 3;
      
      // Giant eye outlines
      ctx.beginPath();
      // left side of eye
      ctx.arc(width * 0.5 + eyeSweep, eyeY, 140, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(width * 0.5 + eyeSweep, eyeY, 140, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();

      // Eye pupil
      ctx.fillStyle = `rgba(244, 63, 94, ${eyeOpacity + 0.2})`;
      ctx.beginPath();
      ctx.arc(width * 0.5 + eyeSweep, eyeY - 20, 20 + Math.sin(eyePulse) * 4, 0, Math.PI * 2);
      ctx.fill();

      // Vertical data streams falling near the machine god
      ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
      ctx.font = "8px monospace";
      for (let i = 0; i < 5; i++) {
        const streamX = width * 0.45 + i * 30 + eyeSweep;
        const streamY = (eyeY + 50 + (eyePulse * 100 + i * 40) % 300);
        ctx.fillText("01101001", streamX, streamY);
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      // Flickering Holographic Ads
      addFlicker = Math.random() < 0.08 ? (Math.random() < 0.5 ? 0.1 : 0.8) : 1;
      ctx.fillStyle = `rgba(6, 182, 212, ${0.4 * addFlicker})`; // digital neon cyan
      ctx.font = "bold 15px monospace";
      ctx.fillText("[ SYSTEM DECEIT: ONLINE ]", width * 0.08, height * 0.25);
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 * addFlicker})`;
      ctx.strokeRect(width * 0.07, height * 0.22, 220, 42);

      // Distant hover flight traffic indicators (red and white fast streaks)
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.48);
      ctx.lineTo(width, height * 0.42);
      ctx.stroke();

      // Kneeling Android Silhouette in foreground
      const center = width * 0.5;
      const ground = height * 0.88;

      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#10b981"; // emerald matrix pulse from its chest core
      
      // Kneeling body silhouette
      ctx.fillStyle = "#0c0a0f";
      ctx.beginPath();
      ctx.arc(center, ground - 120, 26, 0, Math.PI * 2); // head
      ctx.fill();

      // Neck + spine
      ctx.fillRect(center - 4, ground - 95, 8, 40);

      // Shoulders
      ctx.fillRect(center - 45, ground - 95, 90, 16);

      // Slumped arms
      ctx.beginPath();
      ctx.moveTo(center - 40, ground - 90);
      ctx.lineTo(center - 55, ground - 30);
      ctx.lineTo(center - 40, ground);
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#0c0a0f";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(center + 40, ground - 90);
      ctx.lineTo(center + 55, ground - 30);
      ctx.lineTo(center + 35, ground);
      ctx.stroke();

      // Rib cage
      ctx.fillRect(center - 25, ground - 80, 50, 45);

      // Thighs kneeling
      ctx.beginPath();
      ctx.moveTo(center - 20, ground - 35);
      ctx.lineTo(center - 60, ground);
      ctx.lineTo(center + 10, ground);
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(center + 20, ground - 35);
      ctx.lineTo(center + 60, ground);
      ctx.lineTo(center - 10, ground);
      ctx.stroke();

      // Exposed Green glowing reactor core inside the rib cage (the mercenary memory chip)
      const corePulse = 0.6 + Math.sin(eyePulse * 3.5) * 0.35;
      ctx.fillStyle = `rgba(16, 185, 129, ${corePulse})`;
      ctx.beginPath();
      ctx.arc(center, ground - 65, 8, 0, Math.PI * 2);
      ctx.fill();

      // Exposed wires sparking out
      if (Math.random() < 0.12) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(center, ground - 65);
        ctx.lineTo(center + (Math.random() * 40 - 20), ground - 65 + (Math.random() * 30 - 15));
        ctx.stroke();
      }

      ctx.restore();

      // Render rain streaks on outer layers
      ctx.lineWidth = 1.5;
      for (let i = 0; i < rainCount; i++) {
        const r = rain[i];
        ctx.strokeStyle = `rgba(165, 243, 252, ${r.o})`;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 2, r.y + r.len);
        ctx.stroke();

        r.y += r.speed;
        r.x -= 0.5; // wind drift

        if (r.y > height) {
          r.y = -20;
          r.x = Math.random() * width;
        }
      }

      // Neon ground steam rising
      ctx.fillStyle = "rgba(165, 243, 252, 0.02)";
      ctx.fillRect(0, ground, width, height - ground);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleAudioToggle = () => {
    const nextMuted = cyberAudio.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      cyberAudio.startAmbient();
    }
  };

  const handleStart = () => {
    cyberAudio.playHack();
    setScreenState("anomalies");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020205] text-[#00f3ff] font-sans flex flex-col justify-between p-6 md:p-12 border-8 border-[#0a0a12]">
      {/* Background Simulation Canvas */}
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Cyber Visor Scanning Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%] opacity-80" />

      {/* Neon Glows background blur */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#00f3ff]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#ff0055]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* TOP HUD: SYSTEM DIAGNOSTICS & STATUS */}
      <header className="relative z-20 w-full flex justify-between items-start font-mono text-[10px] tracking-widest">
        <div className="flex flex-col gap-1.5">
          <div className="bg-[#00f3ff22] px-3.5 py-1.5 border-l-2 border-[#00f3ff] font-bold">
            CORE_STABILITY: 12.04% // CRITICAL
          </div>
          <div className="px-2 text-[#00f3ff] opacity-80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
            CHASSIS: ZERO_V4 // CREDITS: {credits} ₩
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1.5">
          <div className="bg-[#ff005522] px-3.5 py-1.5 border-r-2 border-[#ff0055] text-[#ff0055] font-bold">
            CYCLE: 0{runs} [RECURSIVE]
          </div>
          <div className="px-2 text-[#ff0055] opacity-80">
            MACHINE_GODS_DETECTED: ORBITAL_ALTITUDE
          </div>
        </div>
      </header>

      {/* Central Interactive Content */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 text-center mt-[-10px] md:mt-[-30px]">
        {/* Cinematic Glitch Title with double-shadow effect from theme design */}
        <div className="relative mb-3">
          <h1
            className={`text-6xl md:text-[100px] font-black tracking-tighter leading-none italic uppercase opacity-40 translate-x-1 translate-y-1 text-[#ff0055] absolute inset-0 select-none ${
              glitchActive ? "skew-x-6 scale-y-95 text-[#00f3ff]" : ""
            }`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            NEON GRAVE
          </h1>
          <h1
            className={`text-6xl md:text-[100px] font-black tracking-tighter leading-none italic uppercase opacity-40 -translate-x-1 -translate-y-1 text-[#00f3ff] absolute inset-0 select-none ${
              glitchActive ? "skew-y-3 scale-x-105 text-[#ff0055]" : ""
            }`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            NEON GRAVE
          </h1>
          <h1
            className={`text-6xl md:text-[100px] font-black tracking-tighter leading-none italic uppercase text-white relative z-10 select-none ${
              glitchActive ? "translate-x-0.5" : ""
            }`}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textShadow: "0 0 40px rgba(0, 243, 255, 0.45)"
            }}
          >
            NEON GRAVE
          </h1>
        </div>

        {/* Dynamic subheader segment with gradient dividers */}
        <div className="flex items-center gap-4 -mt-1 md:-mt-2 mb-6">
          <div className="h-px w-20 md:w-28 bg-gradient-to-r from-transparent to-[#00f3ff]"></div>
          <span className="text-2xl md:text-3xl font-black italic tracking-[0.4em] text-[#00f3ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.7)]">
            // ZERO
          </span>
          <div className="h-px w-20 md:w-28 bg-gradient-to-l from-transparent to-[#00f3ff]"></div>
        </div>

        {/* Chilling Cinematic Tagline */}
        <p className="font-mono text-xs md:text-sm tracking-[0.4em] font-light text-white opacity-95 uppercase leading-relaxed max-w-xl transition-all">
          YOU DIED. <span className="text-[#ff0055] font-black drop-shadow-[0_0_8px_#ff0055]">THE CITY DIDN’T LET GO.</span>
        </p>

        {prestigeLevel > 0 && (
          <div className="mt-4 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-y border-amber-500/30 px-6 py-2 rounded text-amber-400 text-[10px] md:text-xs tracking-widest font-black uppercase shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse flex items-center gap-2">
            ✨ TRANSCENDENT CLONE CLASSIFICATION: LEVEL [ {prestigeLevel} ] Ascent // +{prestigeLevel * 25}% Damage, +{prestigeLevel * 50}% Credits
          </div>
        )}

        {/* GLITCH CHALLENGE ANOMALIES (Endgame Mutators Panel) - Shown only under 'anomalies' selection state */}
        {screenState === "anomalies" && (
          <div className="mt-6 bg-[#04040a]/95 p-5 rounded-lg border border-red-950/40 max-w-2xl w-full mx-4 flex flex-col gap-4 font-mono shadow-[0_0_25px_rgba(239,68,68,0.1)]">
            <div className="flex justify-between items-center border-b border-red-950 pb-2">
              <span className="text-[10px] text-red-500 font-extrabold tracking-widest flex items-center gap-1.5 uppercase animate-pulse">
                <ShieldAlert size={14} className="text-[#ff0055]" /> GLITCH ANOMALIES // HAZARD ACTUATOR
              </span>
              <span className="text-[9px] text-[#00f3ff] font-extrabold uppercase bg-[#00f3ff]/10 px-2.5 py-0.5 rounded border border-[#00f3ff]/20">
                Score multiplier: {activeMutators.length > 0 ? `+${activeMutators.reduce((acc, currentID) => {
                  const matchVal = GAME_MUTATORS.find(m => m.id === currentID);
                  return acc + (matchVal ? parseInt(matchVal.creditBonus.replace(/[^0-9]/g, '')) : 0);
                }, 0)}% Credits` : "NORMAL"}
              </span>
            </div>

            <p className="text-[9px] text-slate-500 leading-relaxed uppercase">
              Toggle terminal difficulty constraints to overload chronal output streams. Handicaps stack and amplify Credit yields.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {GAME_MUTATORS.map((m) => {
                const isActive = activeMutators.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (setActiveMutators) {
                        cyberAudio.playGlitch();
                        if (isActive) {
                          setActiveMutators(activeMutators.filter(x => x !== m.id));
                        } else {
                          setActiveMutators([...activeMutators, m.id]);
                        }
                      }
                    }}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      isActive
                        ? "bg-[#ff0055]/10 border-[#ff0055]/50 shadow-[0_0_12px_rgba(255,0,85,0.12)]"
                        : "bg-[#05060b]/75 border-slate-900/60 hover:border-slate-850"
                    }`}
                  >
                    <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center ${isActive ? "border-[#ff0055] bg-[#ff0055]/20" : "border-slate-800 bg-black"}`}>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#ff0055]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-[10px] font-black tracking-wide text-slate-300 truncate">{m.name}</span>
                        <span className="text-[8.5px] font-extrabold shrink-0" style={{ color: m.color }}>{m.creditBonus}</span>
                      </div>
                      <p className="text-[8px] text-slate-500 mt-0.5 leading-tight uppercase font-medium">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* NAVIGATION MENUS - VARY BASED ON THE STATE */}
        {screenState === "main" ? (
          <div className="mt-12 flex flex-col md:flex-row gap-6 md:gap-8 max-w-4xl w-full justify-center px-4 items-center">
            
            <button
              onClick={handleStart}
              id="start-chassis-btn"
              className="group relative px-6 py-3 flex flex-col items-center cursor-pointer transition-transform duration-300 transform active:scale-95"
            >
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#00f3ff]/70 mb-1 group-hover:text-[#00f3ff] group-hover:opacity-100 transition-opacity">
                WAKE_UP // RUN SYNC
              </span>
              <span className="text-base md:text-lg font-black tracking-widest text-[#00f3ff] group-hover:text-white transition-colors flex items-center gap-2">
                <Play size={14} className="fill-current" /> INITIALIZE CHASSIS
              </span>
              <div className="absolute -bottom-1.5 w-0 h-0.5 bg-[#00f3ff] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_#00f3ff]"></div>
            </button>

            <button
              onClick={onOpenUpgrades}
              id="upgrades-btn"
              className="group relative px-6 py-3 flex flex-col items-center cursor-pointer border-y md:border-y-0 md:border-x border-white/10 transition-transform duration-300 transform active:scale-95"
            >
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#00f3ff]/70 mb-1">
                AUGMENT CHASSIS
              </span>
              <span className="text-base md:text-lg font-black tracking-widest text-cyan-200 group-hover:text-white transition-colors flex items-center gap-2">
                <Cpu size={14} /> CYBERNETICS STORE
              </span>
              <div className="absolute -bottom-1.5 w-0 h-0.5 bg-[#ff0055] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_#ff0055]"></div>
            </button>

            <button
              onClick={onOpenDatabase}
              id="database-btn"
              className="group relative px-6 py-3 flex flex-col items-center cursor-pointer border-r border-[#ff0055]/10 pr-6 transition-transform duration-300 transform active:scale-95"
            >
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#ff0055]/70 mb-1">
                ACCESS RECON_X7
              </span>
              <span className="text-base md:text-lg font-black tracking-widest text-[#ff0055] group-hover:text-rose-100 transition-colors flex items-center gap-2">
                <Database size={14} /> MEMORY CHIP LOGS
              </span>
              <div className="absolute -bottom-1.5 w-0 h-0.5 bg-[#ff0055] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_#ff0055]"></div>
            </button>

            <button
              onClick={onOpenSettings}
              id="settings-btn"
              className="group relative px-6 py-3 flex flex-col items-center cursor-pointer transition-transform duration-300 transform active:scale-95"
            >
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#fbbf24]/70 mb-1">
                PROFILE & UTILITIES
              </span>
              <span className="text-base md:text-lg font-black tracking-widest text-[#fbbf24] group-hover:text-amber-100 transition-colors flex items-center gap-1.5">
                <Cpu size={14} /> COGNITIVE SETTINGS
              </span>
              <div className="absolute -bottom-1.5 w-0 h-0.5 bg-[#fbbf24] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_#fbbf24]"></div>
            </button>
          </div>
        ) : (
          <div className="mt-10 flex flex-col sm:flex-row gap-4 max-w-md w-full justify-center">
            <button
              onClick={() => {
                cyberAudio.playHack();
                onStartGame();
              }}
              className="group relative px-8 py-3 flex flex-col items-center bg-[#ff0055]/10 hover:bg-[#ff0055]/20 border border-[#ff0055] rounded cursor-pointer transition-all active:scale-95 text-[#ff0055]"
            >
              <span className="text-[8px] uppercase tracking-[0.2em] text-[#ff0055]/70 mb-1">
                EXECUTE CHASSIS SYNC
              </span>
              <span className="text-sm font-black tracking-widest group-hover:text-white transition-colors flex items-center gap-2">
                <Play size={12} className="fill-current" /> CONTINUE RUN
              </span>
            </button>

            <button
              onClick={() => {
                cyberAudio.playGlitch();
                setScreenState("main");
              }}
              className="group relative px-8 py-3 flex flex-col items-center bg-slate-950/90 hover:bg-slate-900 border border-slate-800 rounded cursor-pointer transition-all active:scale-95 text-slate-400"
            >
              <span className="text-[8px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                ABORT CONFIGURATION
              </span>
              <span className="text-sm font-black tracking-widest group-hover:text-slate-200 transition-colors">
                BACK TO BAY
              </span>
            </button>
          </div>
        )}
      </main>

      {/* FOOTER: CONTROLS, AUDIO CONFIG, AND CORNER ACCENTS */}
      <footer className="relative z-20 w-full px-4 pt-4 flex flex-col md:flex-row items-center justify-between border-t border-cyan-950/40 bg-black/60 backdrop-blur-md gap-4">
        <div className="flex items-center gap-4 text-[10px] font-mono text-cyan-400">
          <button
            onClick={() => {
              cyberAudio.playHack();
              setShowManual(true);
            }}
            id="open-manual-title-btn"
            className="flex items-center gap-2 hover:text-white transition-all cursor-pointer group/manual"
            title="Inspect comprehensive controls overview and training instructions"
          >
            <Info size={14} className="text-[#00f3ff] group-hover/manual:rotate-12 transition-all" />
            <span className="tracking-wider text-white/80 group-hover/manual:text-white uppercase font-bold text-left">
              WASD to Move // SPACE to Dash // SHIFT for Bullet-Time <span className="text-[#00f3ff] animate-pulse ml-1.5 underline font-extrabold">[GUIDE & MANUAL 🕹️]</span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleAudioToggle}
            id="audio-mute-ctrl-btn"
            className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-[10px] tracking-widest font-bold cursor-pointer border transition-all duration-300 ${
              isMuted
                ? "bg-[#ff0055]/10 text-[#ff0055] border-[#ff0055]/40 animate-pulse hover:bg-[#ff0055]/20"
                : "bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff]/40 hover:bg-[#00f3ff]/20"
            }`}
          >
            {isMuted ? <span className="font-bold">MUTED 🚫</span> : <span className="font-bold">AUDIO ON 🔈</span>}
            {isMuted ? "ENABLE SOUNDTRACK" : "SOUNDTRACK ACTIVE"}
          </button>
        </div>
      </footer>

      {/* DYNAMIC RESET MODAL / CONTROLS TRAINING MANUAL DETECTED STATE */}
      {showManual && (
        <ControlsManual onClose={() => setShowManual(false)} />
      )}

      {/* CORNER ACCENTS - FROM THEME SPECIFICATION */}
      <div className="absolute bottom-16 left-12 w-24 h-24 border-b-2 border-l-2 border-[#00f3ff22] rounded-bl-xl pointer-events-none z-10 hidden md:block"></div>
      <div className="absolute bottom-16 right-12 w-24 h-24 border-b-2 border-r-2 border-[#00f3ff22] rounded-br-xl pointer-events-none z-10 hidden md:block"></div>

      <div className="absolute bottom-20 left-16 font-mono text-[8px] opacity-40 leading-normal hidden md:block select-none">
        [S] DISK_SCAN: OK<br />
        [S] VISOR_RECEPTORS: 82%<br />
        [S] ADRENALINE_BYPASS: ON
      </div>

      <div className="absolute bottom-20 right-16 font-mono text-[8px] opacity-40 text-right uppercase leading-normal hidden md:block select-none">
        Protocol: Zero_Soul<br />
        Firmware: v2.09.corrupt<br />
        Location: Sector_G7
      </div>
    </div>
  );
}
