import { X, Swords, HelpCircle, Shield, Zap, Sparkles, Navigation, Crosshair, Eye } from "lucide-react";
import { cyberAudio } from "../sound";

interface ControlsManualProps {
  onClose: () => void;
}

export default function ControlsManual({ onClose }: ControlsManualProps) {
  const handleClose = () => {
    cyberAudio.playHack();
    onClose();
  };

  const protocols = [
    {
      title: "Chassis Locomotion",
      input: "W, A, S, D Keys",
      icon: <Navigation size={18} className="text-[#00f3ff]" />,
      action: "Moves your cybernetic chassis in any direction across the grid.",
      meaning: "Translates your physical thought patterns into instantaneous directional thruster forces.",
      color: "border-[#00f3ff]/30 text-[#00f3ff]"
    },
    {
      title: "Holographic Visor Targeting",
      input: "Mouse Movement",
      icon: <Crosshair size={18} className="text-[#ff0055]" />,
      action: "Directs your weapon targeting modules. Draws a bright red trajectory laser sight.",
      meaning: "Active focus calibrates micro-thrusters and computes lead-vectors for firing mechanics.",
      color: "border-[#ff0055]/30 text-[#ff0055]"
    },
    {
      title: "Offensive Weapon Strike",
      input: "Left Mouse Button (Mouse 1)",
      icon: <Swords size={18} className="text-white" />,
      action: "Discharges current weapons. With ENERGY KATANA, cuts through nearby drone swarms and reflects red projectiles.",
      meaning: "Empowers the core armory accumulator to release devastating localized energy or standard kinetic payloads.",
      color: "border-slate-700 text-white"
    },
    {
      title: "Gravity Hook Tether",
      input: "Right Mouse Button (Mouse 2)",
      icon: <Shield size={18} className="text-emerald-400" />,
      action: "Latches onto green 'grapple anchors' scattered near brutalist walls to swing or pull yourself forward.",
      meaning: "Temporarily breaks local gravitational formulas by creating an artificial magnetic-grip node.",
      color: "border-emerald-500/30 text-emerald-400"
    },
    {
      title: "Hyper-Evade Slide",
      input: "Spacebar Key",
      icon: <Sparkles size={18} className="text-amber-400" />,
      action: "Performs an ultra-fast dash slide. Grants full invincibility frames to bypass lasers/danger unscathed.",
      meaning: "Slightly dematerializes the molecular bonding of your outer micro-armor, sliding between atoms temporarily.",
      color: "border-amber-500/30 text-amber-400"
    },
    {
      title: "Temporal Overclock (Bullet Time)",
      input: "Left Shift Key",
      icon: <Zap size={18} className="text-purple-400" />,
      action: "Slows down time to 35% for easier dodging. Consumes the pink 'Dive Overclock' energy bar.",
      meaning: "Saturates your cognitive processors to decode external inputs at hyper-accelerated neural indices.",
      color: "border-purple-500/30 text-purple-400"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Glitch Overlay Screen border styling */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-60" />

      {/* Main Panel Box */}
      <div className="w-full max-w-4xl bg-[#04040a] border border-[#00f3ff]/40 rounded-lg p-6 md:p-8 flex flex-col justify-between max-h-[92vh] overflow-y-auto relative z-20 shadow-[0_0_50px_rgba(0,243,255,0.15)] font-mono">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#00f3ff]/20 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-[#ff0055]">
              <HelpCircle className="animate-pulse" size={20} />
              <span className="text-xs font-black tracking-widest uppercase">TACTICAL COMBAT PROTOCOL [SECURE]</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-wider">
              System Training & Diagnostics Matrix
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 border border-slate-800 hover:border-[#ff0055] hover:text-[#ff0055] transition-all rounded bg-slate-950 text-slate-400 cursor-pointer"
            title="Return to Interface"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 flex-1 pr-1">
          {protocols.map((p, index) => (
            <div
              key={index}
              className={`p-4 rounded bg-slate-950/80 border ${p.color} flex flex-col justify-between transition-all hover:bg-slate-900/50 hover:shadow-[0_0_12px_rgba(0,0,0,0.5)]`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    MODULE 0{index + 1}
                  </span>
                  <div className="px-2 py-0.5 rounded bg-black border border-white/5 font-bold text-[9px] text-[#00f3ff] uppercase tracking-wider">
                    {p.input}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-2.5">
                  {p.icon}
                  <h3 className="text-sm font-black text-white tracking-wide uppercase">
                    {p.title}
                  </h3>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-300 mb-3">
                  <strong className="text-white">FUNCTION:</strong> {p.action}
                </p>
              </div>

              <div className="border-t border-white/5 pt-2 mt-2">
                <p className="text-[9.5px] leading-relaxed font-light text-[#00f3ff]/70 italic uppercase">
                  <span className="text-[#ff0055]">SYSTEM REASONING:</span> {p.meaning}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tip & Action Row */}
        <div className="bg-[#ff0055]/5 border border-[#ff0055]/20 p-4 rounded flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye size={20} className="text-[#ff0055] animate-pulse shrink-0" />
            <p className="text-[10px] md:text-[11px] text-slate-300 leading-relaxed uppercase">
              <strong className="text-[#ff0055]">PRO ADVANCED COMBAT RATINGS:</strong> Use the <span className="text-white font-bold">SMART PISTOL (Key 2)</span> to deal fast tracking damage, switch to <span className="text-white font-bold">ENERGY KATANA (Key 1)</span> when swarm missiles are closed to deflect their blasts into secondary chain explosions! Keep slide-dashing with <span className="text-white font-bold">SPACE</span> for style streak scaling.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-[#ff0055] to-purple-600 text-white text-xs font-black tracking-widest uppercase rounded hover:shadow-[0_0_15px_#ff0055] transition-all cursor-pointer transform active:scale-95 shrink-0"
          >
            Acknowledge Protocols
          </button>
        </div>
      </div>
    </div>
  );
}
