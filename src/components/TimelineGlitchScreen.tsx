import { useEffect, useState } from "react";
import { MemoryLog } from "../types";
import { cyberAudio } from "../sound";
import { RotateCw, ShieldAlert, Cpu, Brain, Database, AlertTriangle, Home } from "lucide-react";

interface TimelineGlitchScreenProps {
  score: number;
  styleScore: number;
  weaponUsed: string;
  runsCount: number;
  timeline: number;
  onConfirmReboot: (newLog: MemoryLog) => void;
  onBackToTitle: () => void;
  onMemoryDiscovered?: (newLog: MemoryLog) => void;
}

export default function TimelineGlitchScreen({
  score,
  styleScore,
  weaponUsed,
  runsCount,
  timeline,
  onConfirmReboot,
  onBackToTitle,
  onMemoryDiscovered
}: TimelineGlitchScreenProps) {
  const [loading, setLoading] = useState(true);
  const [glitchLog, setGlitchLog] = useState<MemoryLog | null>(null);
  const [textTyped, setTextTyped] = useState("");
  const [corruptionPulse, setCorruptionPulse] = useState(false);

  useEffect(() => {
    // Heavy static glitch pop sound
    cyberAudio.playExplosion();
    cyberAudio.playGlitch();

    const fetchGlitchedMemory = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/memory-corruption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deathSector: "NEON STREETS // OUTPOST 9",
            weaponUsed: weaponUsed || "ENERGY KATANA",
            runsCount: runsCount,
            timeline: timeline,
            styleScore: styleScore
          })
        });

        const data = await res.json();
        
        // Structure the memory log properly
        const log: MemoryLog = {
          id: `log_${Date.now()}`,
          title: data.title || "RESTORED SEGMENT // NULL_ZERO",
          content: data.content || "Memory logs disrupted. The grid is shutting down.",
          timeline: timeline,
          source: data.source || "UNKNOWN_COGNITIVE_NODULE",
          timestamp: new Date().toISOString(),
          corrupted: data.corrupted !== undefined ? data.corrupted : true,
          fragmentType: data.fragmentType || "flashback"
        };

        setGlitchLog(log);
        setLoading(false);

        // Call memory discovered immediately so it's recorded on the backend/state and persistent storage
        if (onMemoryDiscovered) {
          onMemoryDiscovered(log);
        }

        // Animate story text typing out
        let index = 0;
        const msg = log.content;
        const interval = setInterval(() => {
          setTextTyped((prev) => prev + msg[index - 1]);
          index++;
          if (index > msg.length) {
            clearInterval(interval);
          }
        }, 18);
      } catch (err) {
        console.error("Glitched memory fetch failed, activating offline memory matrix backup", err);
        
        const FALLBACKS = [
          {
            title: "SEGMENT_99_ZERO: THE SILENT CRADLE",
            content: "The smell of scorched plastic and liquid ammonia floats in the chamber. You look down at a cold metallic floor and see your original hands—clothed in a black tactical glove. An AI voice laughs: 'That is not your mother, Project Zero. That is her designer. You killed her first.'",
            fragmentType: "flashback" as const,
            source: "CHRONOS_SYS_BACKUP",
            corrupted: true
          },
          {
            title: "ORBITAL SHELL_LOG [RECONSTRUCTED]",
            content: "We were 12 miles above the neon canopy when the shockwave hit. The machine god Malphas didn't hack our systems—HE BLEW THE WHOLE ORBITAL COLD STACK. Our bodies burned, but our consciousness chips were captured by the swarm.",
            fragmentType: "intelligence" as const,
            source: "HOLOGRA-MARKET_SNIFFER",
            corrupted: false
          },
          {
            title: "RECON RECONCONSTRUCT: BIO_LABS",
            content: "A door with an emblem of two weeping angels. Inside, failed android prototypes suspended in viscous teal gel. One of them opens its eyes. Its face matches yours. In its chest is a power module labeled: 'SUBJECT ZERO: PRIMARY DONOR'.",
            fragmentType: "machina" as const,
            source: "BIO-TECH_MAIN_RESTORE",
            corrupted: true
          },
          {
            title: "HEART_RATE_ZERO://DISSONANCE",
            content: "Memory of a field of white chrysanthemums, cold wind, rain that does not glow blue. Free of the grid, free of the gods. But wait—the sky is a giant liquid crystal monitor displaying: 'RUNNING SIMULATION_9294. REBOOT IN 3... 2...'",
            fragmentType: "dissonance" as const,
            source: "VISOR_SENSORY_LOG",
            corrupted: true
          }
        ];

        const fallbackData = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
        const log: MemoryLog = {
          id: `log_${Date.now()}`,
          title: fallbackData.title,
          content: fallbackData.content,
          timeline: timeline,
          source: fallbackData.source,
          timestamp: new Date().toISOString(),
          corrupted: fallbackData.corrupted,
          fragmentType: fallbackData.fragmentType
        };

        setGlitchLog(log);
        setLoading(false);

        if (onMemoryDiscovered) {
          onMemoryDiscovered(log);
        }

        // Animate story text typing out
        let index = 0;
        const msg = log.content;
        const interval = setInterval(() => {
          setTextTyped((prev) => prev + msg[index - 1]);
          index++;
          if (index > msg.length) {
            clearInterval(interval);
          }
        }, 18);
      }
    };

    fetchGlitchedMemory();

    const flash = setInterval(() => {
      setCorruptionPulse((prev) => !prev);
      cyberAudio.playGlitch();
    }, 4500);

    return () => clearInterval(flash);
  }, []);

  const handleReboot = () => {
    if (glitchLog) {
      cyberAudio.playHack();
      onConfirmReboot(glitchLog);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] text-[#00f3ff] font-mono flex items-center justify-center p-6 overflow-hidden border-8 border-[#0a0a12]">
      {/* Heavy CRT Scan Lines and Noise */}
      <div className="absolute inset-0 pointer-events-none z-15 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,85,0.04),rgba(0,243,255,0.01),rgba(0,243,255,0.04))] bg-[length:100%_6px,4px_100%] opacity-90" />
      
      {/* Background glow points */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#00f3ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#ff0055]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Terminal Frame with glowing border */}
      <div className="relative z-10 max-w-2xl w-full bg-black/90 border border-[#ff0055]/40 p-8 shadow-[0_0_40px_rgba(255,0,85,0.18)] rounded-md flex flex-col gap-6">
        
        {/* Terminal Header Alert shaped like diagnostic blocks */}
        <div className="flex items-center justify-between border-b border-[#00f3ff]/20 pb-4">
          <div className="flex items-center gap-3 bg-[#ff0055]/10 px-3 py-1 border-l-2 border-[#ff0055]">
            <AlertTriangle className="text-[#ff0055] animate-pulse" size={18} />
            <span className="text-sm md:text-base font-black tracking-widest text-[#ff0055] uppercase">// TIME MATRIX CORRUPTED: SECTOR_9</span>
          </div>
          <span className="text-[10px] text-[#00f3ff] font-bold px-2.5 py-0.5 border border-[#00f3ff]/30 rounded bg-[#00f3ff]/5 uppercase">
            AT-0x892AA
          </span>
        </div>

        {/* Tactical run summary stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/80 px-3 py-3 rounded border border-[#00f3ff]/15 text-center shadow-md">
            <div className="text-[9px] text-[#00f3ff]/60 font-bold uppercase tracking-wider mb-1">TERRITORY SCORE</div>
            <div className="text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{score}</div>
          </div>
          <div className="bg-black/80 px-3 py-3 rounded border border-[#00f3ff]/15 text-center shadow-md">
            <div className="text-[9px] text-[#00f3ff]/60 font-bold uppercase tracking-wider mb-1">STYLE MARKS</div>
            <div className="text-xl font-black text-[#ff0055] drop-shadow-[0_0_8px_#ff0055]">{styleScore}</div>
          </div>
          <div className="bg-black/80 px-3 py-3 rounded border border-[#ff0055]/15 text-center shadow-md">
            <div className="text-[9px] text-[#ff0055]/60 font-bold uppercase tracking-wider mb-1">ACTIVE GEAR</div>
            <span className="text-xs text-[#00f3ff] font-black uppercase truncate max-w-full block">{weaponUsed || "Saber"}</span>
          </div>
        </div>

        {/* Memory Reconstruction Box */}
        <div className="flex-1 bg-slate-950/80 border border-[#00f3ff]/25 rounded p-5 min-h-[160px] flex flex-col gap-3.5 relative shadow-inner">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 font-mono">
              <RotateCw className="text-[#00f3ff] animate-spin" size={24} />
              <div className="text-xs tracking-widest text-[#00f3ff] animate-pulse uppercase">RECONSTRUCTING COGNITIVE SYNAPSE FRAGMENTS...</div>
            </div>
          ) : (
            <>
              {/* Source label */}
              <div className="flex items-center justify-between font-mono text-[9px] border-b border-[#00f3ff]/10 pb-2">
                <span className="text-[#00f3ff] flex items-center gap-1.5 font-bold uppercase"><Brain size={12} /> FRAGMENT: {glitchLog?.title}</span>
                <span className="text-slate-500 font-bold font-bold">SOURCE: {glitchLog?.source}</span>
              </div>

              {/* Typed narrative output blocks */}
              <p className="text-xs leading-relaxed text-slate-200">
                {textTyped}
                <span className="inline-block w-1.5 h-3.5 bg-[#00f3ff] animate-pulse ml-0.5" />
              </p>

              {/* Memory corruption rating */}
              <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5 font-mono text-[9px] text-slate-500">
                <span className="flex items-center gap-1.5 uppercase text-[#ff0055] font-bold"><Cpu size={12} /> Corruption Ratio: {runsCount * 7.5}%</span>
                <span className="flex items-center gap-1.5 text-[#00f3ff] font-bold"><Database size={12} /> Sync complete inside datacore</span>
              </div>
            </>
          )}
        </div>

        {/* Chilling prompt advisory */}
        <div className="p-3 bg-gradient-to-r from-[#ff0055]/5 to-[#ff0055]/10 border border-[#ff0055]/15 rounded font-mono text-[10px] leading-relaxed text-[#ff0055] max-w-xl text-center self-center italic">
          "Your physical matrix shell was cremated by the corporate grids.
          Your mind remains trapped inside this cycle. The city continues."
        </div>

        {/* Actions Triggers */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleReboot}
            disabled={loading}
            id="reboot-sync-btn"
            className="flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#ff0055] to-[#c00040] hover:from-[#ff1a6c] hover:to-[#ff0055] disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-black tracking-widest py-4 rounded-md cursor-pointer text-xs shadow-[0_0_20px_rgba(255,0,85,0.25)] transition-all duration-300 active:scale-95 border border-[#ff0055]/20 font-bold"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
            REBOOT CHASSIS & RUN SYNC
          </button>
          
          <button
            onClick={onBackToTitle}
            id="home-back-btn"
            className="flex-1 flex items-center justify-center gap-2.5 bg-[#0a0a14] border border-[#ff0055]/40 hover:border-[#ff0055] hover:bg-[#ff0055]/10 text-[#ff0055] hover:text-white font-mono tracking-widest py-4 rounded-md cursor-pointer text-xs transition-all duration-300 active:scale-95 font-bold uppercase"
          >
            <Home size={14} />
            RETURN TO CITY TERMINAL
          </button>
        </div>
      </div>

      {/* CORNER ACCENTS */}
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-[#00f3ff22] rounded-bl-md pointer-events-none z-10 hidden md:block"></div>
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-[#00f3ff22] rounded-br-md pointer-events-none z-10 hidden md:block"></div>
    </div>
  );
}
