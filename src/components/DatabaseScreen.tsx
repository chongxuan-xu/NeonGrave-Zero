import { useState } from "react";
import { MemoryLog } from "../types";
import { cyberAudio } from "../sound";
import { X, Calendar, Database, ShieldAlert, FileText, CheckCircle, Search, HelpCircle } from "lucide-react";

interface DatabaseScreenProps {
  memoryLogs: MemoryLog[];
  onClose: () => void;
}

export default function DatabaseScreen({ memoryLogs, onClose }: DatabaseScreenProps) {
  const [selectedLog, setSelectedLog] = useState<MemoryLog | null>(
    memoryLogs.length > 0 ? memoryLogs[0] : null
  );

  const selectItem = (log: MemoryLog) => {
    cyberAudio.playGlitch();
    setSelectedLog(log);
  };

  const getFragmentColor = (type: string) => {
    if (type === "flashback") return "border-[#ff0055] text-[#ff0055] bg-[#ff0055]/10";
    if (type === "machina") return "border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/10";
    if (type === "intelligence") return "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10";
    return "border-amber-400 text-amber-300 bg-amber-950/20";
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] text-[#00f3ff] font-mono p-6 md:p-12 flex flex-col justify-between overflow-hidden border-8 border-[#0a0a12]">
      
      {/* Visual background scans */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,243,255,0.01),rgba(255,0,85,0.01))] bg-[length:100%_4px,3px_100%] opacity-40" />

      {/* Header index */}
      <header className="relative z-20 flex items-center justify-between border-b border-[#00f3ff]/20 pb-5 max-w-5xl w-full self-center">
        <div className="flex items-center gap-3 bg-[#00f3ff]/10 px-4 py-2 border-l-2 border-[#00f3ff]">
          <Database className="text-[#00f3ff]" size={20} />
          <h2 className="text-xl md:text-2xl font-black tracking-widest text-[#00f3ff] italic">COGNITIVE ARCHIVES // DEC FILES</h2>
        </div>
        <button
          onClick={onClose}
          id="close-db-btn"
          className="p-2.5 hover:bg-slate-900 border border-[#00f3ff]/20 rounded-full cursor-pointer transition-colors text-white"
        >
          <X size={18} />
        </button>
      </header>

      {/* Database splits columns */}
      <main className="relative z-20 flex-1 overflow-hidden max-w-5xl w-full self-center py-6 flex flex-col md:flex-row gap-6">
        
        {/* Left pane: file list */}
        <div className="w-full md:w-2/5 border border-[#00f3ff]/20 bg-slate-950/40 p-4 rounded flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 border-b border-[#00f3ff]/10 pb-2 uppercase tracking-widest font-bold">
            <Search size={13} /> Registered Memory Blobs ({memoryLogs.length})
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {memoryLogs.map((log) => {
              const active = selectedLog?.id === log.id;
              return (
                <button
                  key={log.id}
                  onClick={() => selectItem(log)}
                  className={`w-full text-left p-3 rounded transition-all duration-300 border cursor-pointer select-none ${
                    active
                      ? "bg-slate-900/80 border-[#00f3ff] text-white shadow-[0_0_12px_rgba(0,243,255,0.12)]"
                      : "bg-[#0b0c16]/50 border-slate-950 text-slate-400 hover:border-[#00f3ff]/30 hover:text-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                    <span className="text-[#00f3ff]">TIMELINE_B{log.timeline}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase border ${getFragmentColor(log.fragmentType)}`}>
                      {log.fragmentType}
                    </span>
                  </div>
                  <h4 className="font-bold text-[11.5px] truncate uppercase">{log.title}</h4>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right pane: file details */}
        <div className="flex-1 border border-[#00f3ff]/20 bg-black/60 p-6 rounded flex flex-col justify-between overflow-y-auto">
          {selectedLog ? (
            <div className="flex flex-col gap-5">
              
              {/* Header metadata */}
              <div className="border-b border-[#00f3ff]/15 pb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#ff0055] font-black flex items-center gap-1 bg-[#ff0055]/10 px-2 py-0.5 border-l-2 border-[#ff0055]">
                    <ShieldAlert size={12} /> SECURED DECRYPTED CHIP MATRIX
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-bold uppercase">
                    <Calendar size={12} /> TIMESTAMP: {new Date(selectedLog.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-[#00f3ff] uppercase tracking-wide">{selectedLog.title}</h3>
                
                <div className="flex gap-4 text-[10px] text-slate-500">
                  <div>
                    <span className="mr-1 font-bold">NODE TIMELINE:</span>
                    <span className="text-white font-extrabold">B_{selectedLog.timeline}</span>
                  </div>
                  <div className="border-l border-[#00f3ff]/10 pl-4">
                    <span className="mr-1 font-bold">DATA SOURCE:</span>
                    <span className="text-white font-extrabold">{selectedLog.source}</span>
                  </div>
                </div>
              </div>

              {/* Chip content reading */}
              <div className="bg-[#050611] border border-[#00f3ff]/15 p-5 pr-6 rounded-md min-h-[160px] flex flex-col justify-between shadow-inner">
                <p className="text-[12px] leading-relaxed text-slate-200">
                  {selectedLog.content}
                </p>

                {/* Glitch integrity indicator */}
                <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] tracking-wider font-bold">
                  <span className="text-[#00f3ff] flex items-center gap-1.5 uppercase"><FileText size={12} /> FRAGMENT REGISTER</span>
                  {selectedLog.corrupted ? (
                    <span className="text-[#ff0055] font-black flex items-center gap-1.5 animate-pulse uppercase">
                      ● DATA CORRUPTED WITH ERROR INDEX
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1.5 uppercase">
                      <CheckCircle size={12} /> DATA INTEGRITY SECURED
                    </span>
                  )}
                </div>
              </div>

              {/* Explanatory detail card */}
              <div className="p-3 bg-[#0d0a0f] border border-[#ff0055]/15 rounded text-[10px] leading-relaxed text-slate-400">
                "Each memory trace outlines a timeline branch. Reconstruct segments to unravel
                which variables led to the orbital collapse. Refrain from syncing with foreign databases."
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
              <HelpCircle size={32} />
              <p className="text-xs">Select a decrypted memory node from the listing matrix to initiate playback.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer copyright stamp */}
      <footer className="relative z-20 border-t border-[#00f3ff]/10 pt-4 text-center font-mono text-[9px] text-[#00f3ff]/60 max-w-5xl w-full self-center uppercase tracking-wider">
        "COGNITIVE LOG REGISTERS INCORPORATING SECURE BIOMATRIX RESTORATION FILES"
      </footer>

      {/* CORNER ACCENTS */}
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-[#00f3ff22] rounded-bl-md pointer-events-none z-10 hidden md:block"></div>
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-[#00f3ff22] rounded-br-md pointer-events-none z-10 hidden md:block"></div>
    </div>
  );
}
