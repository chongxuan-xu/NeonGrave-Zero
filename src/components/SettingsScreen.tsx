import { useState, useEffect } from "react";
import { cyberAudio } from "../sound";
import { X, Volume2, VolumeX, RefreshCw, KeyRound, User, Lock, CheckCircle2, AlertTriangle, LogOut, Mail, Terminal } from "lucide-react";
import { MemoryLog } from "../types";
import { signUp, login, logout, getCurrentUser, getUsername, supabase, saveUserProgress, getUserProgress } from "../supabaseClient";

interface SettingsScreenProps {
  credits: number;
  runs: number;
  unlockedUpgrades: { [key: string]: number };
  memoryLogs: MemoryLog[];
  materials: { [key: string]: number };
  ownedWeapons: string[];
  equippedWeapons: (string | null)[];
  ownedArmors: string[];
  equippedArmor: string;
  weaponEnchants: { [key: string]: string };
  armorEnchants: { [key: string]: string };
  prestigeLevel: number;
  unlockedPrestigePerks: string[];
  activeMutators: string[];
  maxBossesKilledSingleRound: number;
  onUpdateParentStates: (data: {
    credits?: number;
    runs?: number;
    unlockedUpgrades?: { [key: string]: number };
    materials?: { [key: string]: number };
    ownedWeapons?: string[];
    equippedWeapons?: (string | null)[];
    ownedArmors?: string[];
    equippedArmor?: string;
    memoryLogs?: MemoryLog[];
    weaponEnchants?: { [key: string]: string };
    armorEnchants?: { [key: string]: string };
    prestigeLevel?: number;
    unlockedPrestigePerks?: string[];
    activeMutators?: string[];
    maxBossesKilledSingleRound?: number;
  }) => void;
  onLogoutReset: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export default function SettingsScreen({
  credits,
  runs,
  unlockedUpgrades,
  memoryLogs,
  materials,
  ownedWeapons,
  equippedWeapons,
  ownedArmors,
  equippedArmor,
  weaponEnchants,
  armorEnchants,
  prestigeLevel,
  unlockedPrestigePerks,
  activeMutators,
  maxBossesKilledSingleRound,
  onUpdateParentStates,
  onLogoutReset,
  onResetProgress,
  onClose
}: SettingsScreenProps) {
  // Volume controls state
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem("cyber_volume");
    return stored ? Number(stored) : 80;
  });

  // Account authentication states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [loggedUser, setLoggedUser] = useState<string>("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [playgroundOutput, setPlaygroundOutput] = useState<string>("");

  // Reset confirmation state
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load current user and state upon boot
  useEffect(() => {
    setIsMuted(cyberAudio.getMuteState());
    
    const initSession = async () => {
      try {
        const userObj = await getCurrentUser();
        if (userObj) {
          const activeUser = (await getUsername(userObj.id)) || userObj.email?.split("@")[0] || "anon";
          setIsLogged(true);
          setLoggedUser(activeUser);
          localStorage.setItem("cyber_user", activeUser);
          // Restore progress from DB
          await loadUserProgressFromDB(activeUser);
        } else {
          // If no active Supabase Auth session, treat strictly as guest and clear stale user key
          setIsLogged(false);
          setLoggedUser("");
          localStorage.removeItem("cyber_user");
        }
      } catch (err) {
        console.warn("Failed retrieving Supabase session on startup:", err);
      }
    };
    initSession();
  }, []);

  const handleMuteToggle = () => {
    const nextMute = cyberAudio.toggleMute();
    setIsMuted(nextMute);
    if (!nextMute) {
      cyberAudio.startAmbient();
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    localStorage.setItem("cyber_volume", String(v));
    // Small audio beep to reference adjustment
    cyberAudio.playGlitch();
  };

  const saveUserToLocal = (user: string) => {
    try {
      const stateObj = {
        credits,
        runs,
        unlockedUpgrades,
        materials,
        ownedWeapons,
        equippedWeapons,
        ownedArmors,
        equippedArmor,
        memoryLogs,
        weaponEnchants,
        weapon_enchants: weaponEnchants,
        armorEnchants,
        armor_enchants: armorEnchants,
        prestigeLevel,
        unlockedPrestigePerks,
        activeMutators,
        maxBossesKilledSingleRound,
      };
      localStorage.setItem(`cyber_progress_${user}`, JSON.stringify(stateObj));
    } catch (e) {
      console.warn("Failed saving state to local:", e);
    }
  };

  const loadUserFromLocal = (user: string) => {
    try {
      const stored = localStorage.getItem(`cyber_progress_${user}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        onUpdateParentStates({
          credits: parsed.credits,
          runs: parsed.runs,
          unlockedUpgrades: parsed.unlockedUpgrades,
          materials: parsed.materials,
          ownedWeapons: parsed.ownedWeapons,
          equippedWeapons: parsed.equippedWeapons,
          ownedArmors: parsed.ownedArmors,
          equippedArmor: parsed.equippedArmor,
          memoryLogs: parsed.memoryLogs || [],
          weaponEnchants: parsed.weaponEnchants || parsed.weapon_enchants || {},
          armorEnchants: parsed.armorEnchants || parsed.armor_enchants || {},
          prestigeLevel: parsed.prestigeLevel || 0,
          unlockedPrestigePerks: parsed.unlockedPrestigePerks || [],
          activeMutators: parsed.activeMutators || [],
          maxBossesKilledSingleRound: parsed.maxBossesKilledSingleRound || 0,
        });
      }
    } catch (e) {
      console.warn("Failed loading state from local:", e);
    }
  };

  const loadUserProgressFromDB = async (user: string) => {
    try {
      setPlaygroundOutput(`Synchronizing with neural database via Supabase...`);
      const remoteData = await getUserProgress();
      if (remoteData) {
        const weaponEnchantsMapped = remoteData.weaponEnchants || remoteData.weapon_enchants || {};
        const armorEnchantsMapped = remoteData.armorEnchants || remoteData.armor_enchants || {};

        onUpdateParentStates({
          credits: remoteData.credits,
          runs: remoteData.runs,
          unlockedUpgrades: remoteData.unlockedUpgrades,
          materials: remoteData.materials,
          ownedWeapons: remoteData.ownedWeapons,
          equippedWeapons: remoteData.equippedWeapons,
          ownedArmors: remoteData.ownedArmors,
          equippedArmor: remoteData.equippedArmor,
          memoryLogs: remoteData.memoryLogs || [],
          weaponEnchants: weaponEnchantsMapped,
          armorEnchants: armorEnchantsMapped,
          prestigeLevel: remoteData.prestigeLevel || 0,
          unlockedPrestigePerks: remoteData.unlockedPrestigePerks || [],
          activeMutators: remoteData.activeMutators || [],
          maxBossesKilledSingleRound: remoteData.maxBossesKilledSingleRound || 0,
        });
        
        // Save backups of all keys to LocalStorage
        localStorage.setItem(`cyber_progress_${user}`, JSON.stringify(remoteData));
        if (remoteData.credits !== undefined) localStorage.setItem("cyber_credits", String(remoteData.credits));
        if (remoteData.runs !== undefined) localStorage.setItem("cyber_runs", String(remoteData.runs));
        if (remoteData.unlockedUpgrades) localStorage.setItem("cyber_upgrades", JSON.stringify(remoteData.unlockedUpgrades));
        if (remoteData.materials) localStorage.setItem("cyber_materials", JSON.stringify(remoteData.materials));
        if (remoteData.ownedWeapons) localStorage.setItem("cyber_owned_weapons", JSON.stringify(remoteData.ownedWeapons));
        if (remoteData.equippedWeapons) localStorage.setItem("cyber_equipped_weapons", JSON.stringify(remoteData.equippedWeapons));
        if (remoteData.ownedArmors) localStorage.setItem("cyber_owned_armors", JSON.stringify(remoteData.ownedArmors));
        if (remoteData.equippedArmor) localStorage.setItem("cyber_equipped_armor", remoteData.equippedArmor);
        if (remoteData.memoryLogs) localStorage.setItem("cyber_memory_logs", JSON.stringify(remoteData.memoryLogs));
        localStorage.setItem("cyber_weapon_enchants", JSON.stringify(weaponEnchantsMapped));
        localStorage.setItem("cyber_armor_enchants", JSON.stringify(armorEnchantsMapped));
        if (remoteData.prestigeLevel !== undefined) {
          localStorage.setItem("cyber_prestige_level", String(remoteData.prestigeLevel));
        }
        if (remoteData.unlockedPrestigePerks) localStorage.setItem("cyber_prestige_perks", JSON.stringify(remoteData.unlockedPrestigePerks));
        if (remoteData.activeMutators) localStorage.setItem("cyber_active_mutators", JSON.stringify(remoteData.activeMutators));
        if (remoteData.maxBossesKilledSingleRound !== undefined) localStorage.setItem("cyber_max_bosses_killed_single_round", String(remoteData.maxBossesKilledSingleRound));

        setPlaygroundOutput(`SUPABASE LINK: Progress downloaded & updated successfully.`);
        setAuthSuccess(`DATABASE LINKED: ONLINE PROGRESS RESTORED.`);
      } else {
        setPlaygroundOutput(`No cloud progress found. Initializing check of local cache for user [${user}]...`);
        loadUserFromLocal(user);
      }
    } catch (e: any) {
      console.warn("Failed fetching progress from Supabase DB:", e);
      const hint = e.message?.toLowerCase().includes("progress") 
        ? " Please make sure to add the 'progress' column in Supabase profiles table via SQL."
        : "";
      setPlaygroundOutput(`SUPABASE LINK WARNING: ${e.message || "Failed syncing with DB. Fallback to LocalStorage profile."}${hint}`);
      setAuthError(`DATABASE OFFLINE: ${e.message || "Could not retrieve online database progress."}${hint}`);
      loadUserFromLocal(user);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setAuthError("CRITICAL: IDENTIFIER, EMAIL, AND ACCESS KEY CANNOT BE VOID.");
      return;
    }
    
    // Email syntax validation (e.g., rejecting a@a.c)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setAuthError("CRITICAL: WEAK EMAIL FREQUENCY. DOMAIN OR TLD IS SEVERELY INVALID.");
      return;
    }

    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    setPlaygroundOutput("Invoking: signUp(username, email, password)...");
    try {
      const data = await signUp(username.trim(), email.trim(), password);
      const registeredUsername = data?.user?.user_metadata?.username || username.trim();
      setAuthSuccess(`REGISTRY COMPLETED: USER [${registeredUsername}] REGISTERED IN SUPABASE CHARTERS.`);
      setPlaygroundOutput(JSON.stringify(data, null, 2));
      
      // Store session and login
      localStorage.setItem("cyber_user", registeredUsername);
      setIsLogged(true);
      setLoggedUser(registeredUsername);

      // Save initial progress setup
      saveUserToLocal(registeredUsername);
    } catch (err: any) {
      setAuthError(err.message || "UNKNOWN REGISTRY DISRUPTION DURING SUPABASE AUTH.");
      setPlaygroundOutput(JSON.stringify({ error: err.message || err }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError("EMAIL / USERNAME AND PASSWORD REQUIRED.");
      return;
    }

    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    setPlaygroundOutput("Resolving identifier...");

    try {
      let loginEmail = email.trim();

      // If input is NOT an email, treat it as username
      const looksLikeEmail = loginEmail.includes("@");

      if (!looksLikeEmail) {
        const { data, error } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", loginEmail)
          .maybeSingle();

        if (error || !data?.email) {
          throw new Error("USERNAME NOT FOUND.");
        }

        loginEmail = data.email;
      }

      const data = await login(loginEmail, password);

      const activeUser =
        (await getUsername(data.user.id)) ||
        loginEmail.split("@")[0] ||
        "anon";

      setAuthSuccess(`WELCOME BACK, ${activeUser.toUpperCase()}`);
      setPlaygroundOutput(JSON.stringify(data, null, 2));

      localStorage.setItem("cyber_user", activeUser);
      setIsLogged(true);
      setLoggedUser(activeUser);

      await loadUserProgressFromDB(activeUser);
    } catch (err: any) {
      setAuthError(err.message || "LOGIN FAILED.");
      setPlaygroundOutput(JSON.stringify({ error: err.message || err }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    setPlaygroundOutput("Invoking: logout()...");
    try {
      await logout();
      onLogoutReset();
      setIsLogged(false);
      setLoggedUser("");
      localStorage.removeItem("cyber_user");
      setAuthSuccess("PROFILE EXCISED. SYSTEM DISCONNECTED VIA SUPABASE.");
      setPlaygroundOutput(JSON.stringify({ logout: "success" }, null, 2));
    } catch (err: any) {
      setAuthError(err.message || "LOGOUT REJECTION OCCURRED.");
      setPlaygroundOutput(JSON.stringify({ error: err.message || err }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!loggedUser) return;
    setIsLoading(true);
    setAuthError("");
    setAuthSuccess("");
    setPlaygroundOutput("Invoking profile row deletion from Supabase database...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: delErr } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id);
        if (delErr) throw delErr;
      }
      
      await logout();
      cyberAudio.playExplosion();
      onLogoutReset();
      setIsLogged(false);
      setLoggedUser("");
      setConfirmDelete(false);
      localStorage.removeItem("cyber_user");
      setAuthSuccess("ACCOUNT SUCCESSFULLY DELETED. GUEST CONSCIOUSNESS RUNNING.");
      setPlaygroundOutput(JSON.stringify({ profileDeleted: true, status: "success" }, null, 2));
    } catch (err: any) {
      setAuthError(err.message || "CONNECTION FAILURE WHILE REQUESTING PROFILE DELETION.");
      setPlaygroundOutput(JSON.stringify({ error: err.message || err }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const syncSaveData = async (user: string) => {
    try {
      // First save to LocalStorage cache
      saveUserToLocal(user);
      
      // Package progress
      const stateObj = {
        credits,
        runs,
        unlockedUpgrades,
        materials,
        ownedWeapons,
        equippedWeapons,
        ownedArmors,
        equippedArmor,
        memoryLogs,
        weaponEnchants,
        weapon_enchants: weaponEnchants,
        armorEnchants,
        armor_enchants: armorEnchants,
        prestigeLevel,
        unlockedPrestigePerks,
        activeMutators,
        maxBossesKilledSingleRound,
      };
      
      // Save directly to raw Supabase rows!
      await saveUserProgress(stateObj);
      setAuthSuccess(`DATABASE SYNC SUCCESS: Online backup established for player [${user}].`);
      setPlaygroundOutput(`SAVED TO NEURAL DATABASE. TIMESTAMP: ${new Date().toISOString()}`);
    } catch (err: any) {
      console.warn("Auto sync failed for Supabase:", err);
      const hint = err.message?.toLowerCase().includes("progress") 
        ? " Please run the ALTER TABLE sql command to create the 'progress' column in profiles."
        : "";
      setAuthError(`DATABASE OFFLINE: ${err.message || "Failed syncing data backup to Supabase."}${hint}`);
      setPlaygroundOutput(`SYNC ERROR: ${err.message || "Unknown db sync fault."}${hint}`);
    }
  };

  const forceManualSync = async () => {
    if (!loggedUser) return;
    setIsLoading(true);
    setAuthError("");
    setAuthSuccess("");
    setPlaygroundOutput(`Initiating real-time socket upload packets to Supabase database...`);
    try {
      await syncSaveData(loggedUser);
      cyberAudio.playHack();
    } catch {
      setAuthError("MANUAL SYNC TIMEOUT: DATA PACKET DISCARDED.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run dynamic verification test functions
  const testGetCurrentUser = async () => {
    setIsLoading(true);
    setPlaygroundOutput("Invoking: getCurrentUser()...");
    try {
      const data = await getCurrentUser();
      setPlaygroundOutput(JSON.stringify(data || { status: "No active authenticated session" }, null, 2));
      if (data) {
        const fetchedUsername = await getUsername(data.id);
        setAuthSuccess(`RETRIEVED ACTIVE AGENT: [${fetchedUsername || "anon"}]`);
      } else {
        setAuthSuccess("GET_CURRENT_USER Run completed: No active Supabase session.");
      }
    } catch (err: any) {
      setPlaygroundOutput(JSON.stringify({ error: err.message || err }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const testGetUsername = async () => {
    setIsLoading(true);
    setPlaygroundOutput("Invoking: getUsername()...");
    try {
      const activeUser = await getUsername();
      setPlaygroundOutput(JSON.stringify({ getUsername: activeUser || "No active session user" }, null, 2));
      if (activeUser) {
        setAuthSuccess(`GET_USERNAME RESOLVED USER: [${activeUser}]`);
      } else {
        setAuthSuccess("GET_USERNAME run completed: No active session.");
      }
    } catch (err: any) {
      setPlaygroundOutput(JSON.stringify({ error: err.message || err }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] text-[#00f3ff] font-mono p-4 md:p-12 flex flex-col justify-between overflow-hidden border-8 border-[#0a0a12]">
      {/* Background neon elements */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,243,255,0.01),rgba(255,0,85,0.01))] bg-[length:100%_4px,3px_100%] opacity-40" />
      <div className="absolute top-1/3 right-10 w-[200px] h-[200px] bg-[#fbbf24]/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Header Index */}
      <header className="relative z-20 flex items-center justify-between border-b border-[#00f3ff]/20 pb-5 max-w-5xl w-full self-center">
        <div className="flex items-center gap-3 bg-[#00f3ff]/10 px-4 py-2 border-l-2 border-[#00f3ff]">
          <Volume2 className="text-[#00f3ff]" size={20} />
          <h2 className="text-xl md:text-2xl font-black tracking-widest text-[#00f3ff] italic">SYSTEM CONFIG // TERMINAL</h2>
        </div>
        <button
          onClick={onClose}
          id="close-settings-btn"
          className="p-2.5 hover:bg-slate-900 border border-[#00f3ff]/20 rounded-full cursor-pointer transition-colors text-white"
        >
          <X size={18} />
        </button>
      </header>

      {/* Configuration Grid */}
      <main className="relative z-20 flex-1 overflow-y-auto max-w-5xl w-full self-center py-6 grid grid-cols-1 md:grid-cols-2 gap-8 pr-2">
        {/* Left Column: Audio and Hardware resets */}
        <div className="flex flex-col gap-6">
          <div className="p-5 border border-[#00f3ff]/20 bg-slate-950/40 rounded-md">
            <h3 className="text-sm font-black tracking-widest text-[#00f3ff] mb-4 uppercase border-b border-[#00f3ff]/10 pb-1.5 flex items-center gap-2">
              <Volume2 size={16} /> AUDIO MODULATOR
            </h3>
            
            <div className="flex flex-col gap-5">
              {/* Mute toggle row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">MASTER SYNTH SOUNDTRACK</span>
                <button
                  onClick={handleMuteToggle}
                  className={`px-4 py-2 rounded text-[10px] tracking-wider font-extrabold font-mono cursor-pointer border transition-all ${
                    isMuted
                      ? "bg-[#ff0055]/10 text-[#ff0055] border-[#ff0055]/30 animate-pulse hover:bg-[#ff0055]/20"
                      : "bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff]/30 hover:bg-[#00f3ff]/20"
                  }`}
                >
                  {isMuted ? "CORE_SOUNDTRACK: DE-LINKED 🚫" : "CORE_SOUNDTRACK: DIRECT_FEED 🔉"}
                </button>
              </div>

              {/* Slider simulation */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-400">VOLUME</span>
                  <span className="text-[#00f3ff]">{isMuted ? 0 : volume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <VolumeX className="text-slate-500" size={14} />
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    disabled={isMuted}
                    className="flex-1 accent-[#00f3ff] bg-slate-900 border border-slate-800 rounded-lg cursor-pointer h-1.5 outline-none disabled:opacity-30"
                  />
                  <Volume2 className="text-[#00f3ff]" size={14} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border border-[#ff0055]/30 bg-rose-950/5 rounded-md">
            <h3 className="text-sm font-black tracking-widest text-[#ff0055] mb-4 uppercase border-b border-[#ff0055]/10 pb-1.5 flex items-center gap-2">
              <RefreshCw size={16} /> DATA RESET PROTOCOL
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Warning: Resetting progress will permanently remove all unlocked cybernetics upgrades, credits, run data, and recovered memory logs. This action cannot be undone.
            </p>

            {!confirmReset ? (
              <button
                onClick={() => {
                  cyberAudio.playGlitch();
                  setConfirmReset(true);
                }}
                className="w-full bg-[#ff0055]/10 text-[#ff0055] hover:bg-[#ff0055]/25 hover:text-white border border-[#ff0055]/40 py-2.5 rounded font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                RESET PROGRESS
              </button>
            ) : (
              <div className="flex flex-col gap-2 bg-black/40 p-4 border border-[#ff0055]/60 rounded">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                  <AlertTriangle size={15} className="text-[#ff0055] animate-bounce" /> CONFIRM CHIP PURGING MATRIX?
                </span>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => {
                      cyberAudio.playHack();
                      onResetProgress();
                      setConfirmReset(false);
                      setAuthSuccess("MEMORY RESET FULLY COMPLETED.");
                    }}
                    className="bg-[#ff0055] hover:bg-rose-700 text-white py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                  >
                    YES // PURGE ALL
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                  >
                    NO // RE-ESTABLISH LINK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account authentication stored in database */}
        <div className="flex flex-col gap-6">
          <div className="p-5 border border-[#fbbf24]/30 bg-slate-950/40 rounded-md flex flex-col gap-4">
            <h3 className="text-sm font-black tracking-widest text-[#fbbf24] mb-1 uppercase border-b border-[#fbbf24]/10 pb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><KeyRound size={16} /> CLOUD CYBER-NET DATA CORES</span>
              <span className="text-[9px] bg-[#fbbf24]/20 px-2 py-0.5 rounded text-white border border-[#fbbf24]/30">SUPABASE</span>
            </h3>

            {isLogged ? (
              // Logged in UI
              <div className="flex flex-col gap-4">
                <div className="bg-[#fbbf24]/10 p-3.5 rounded border border-[#fbbf24]/30 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#fbbf24] font-black uppercase tracking-widest leading-none mb-1">CONNECTED AGENT</div>
                    <div className="text-sm font-extrabold text-white">{loggedUser.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#fbbf24]/20 text-[#fbbf24] font-bold font-mono text-[9px] px-2.5 py-1 rounded border border-[#fbbf24]/40 uppercase tracking-widest">
                    SYNC_ON
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Every cybernetic matrix, memory chip archive, and bounty ledger count is backed up under your registered account database. Safe sync runs are validated.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    onClick={forceManualSync}
                    disabled={isLoading}
                    className="bg-[#fbbf24]/10 hover:bg-[#fbbf24]/30 text-[#fbbf24] border border-[#fbbf24]/40 hover:text-white flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-black uppercase transition-all cursor-pointer disabled:opacity-30 lg:flex"
                  >
                    <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> SYNC TIMELINE
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                  >
                    <LogOut size={13} /> LOGOUT
                  </button>
                </div>

                <div className="mt-4 border-t border-rose-950/40 pt-4 flex flex-col gap-2">
                  {!confirmDelete ? (
                    <button
                      onClick={() => {
                        cyberAudio.playGlitch();
                        setConfirmDelete(true);
                      }}
                      className="w-full bg-[#ff0055]/10 hover:bg-[#ff0055]/25 text-[#ff0055] hover:text-white border border-[#ff0055]/30 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      DELETE SYSTEM ACCOUNT PROFILE
                    </button>
                  ) : (
                    <div className="p-3 border border-[#ff0055]/50 bg-rose-950/10 rounded flex flex-col gap-2">
                      <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle size={12} className="text-[#ff0055] animate-pulse" /> CONFIRM PROFILE DELETION? THIS IS IRREVERSIBLE!
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isLoading}
                          className="bg-[#ff0055] hover:bg-rose-700 text-white text-[9px] font-black py-1 rounded transition-all cursor-pointer"
                        >
                          YES // OBLITERATE
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-[9px] font-black py-1 rounded transition-all cursor-pointer border border-slate-800"
                        >
                          NO // RETREAT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Login / Register UI
              <div className="flex flex-col gap-4">
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => {
                      setIsSignUpMode(false);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className={`flex-1 pb-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                      !isSignUpMode
                        ? "text-[#fbbf24] border-b-2 border-[#fbbf24] font-black"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    IDENTIFIER LOGIN
                  </button>
                  <button
                    onClick={() => {
                      setIsSignUpMode(true);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className={`flex-1 pb-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                      isSignUpMode
                        ? "text-[#fbbf24] border-b-2 border-[#fbbf24] font-black"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    REGISTER SOCKET
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {isSignUpMode
                    ? "Establish a new link in our system databases using Supabase Authentication. Your profile table record is constructed automatically."
                    : "Verify your credentials via your registered Email Portal or utilize the API playground below."}
                </p>

                <div className="flex flex-col gap-3">
                  {/* Name field (Only in Sign Up mode) */}
                  {isSignUpMode && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-[#fbbf24]/70 font-black tracking-widest uppercase">USERNAME</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="PixelWarrior"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-[#fbbf24]/50 rounded py-2 pl-9 pr-4 text-xs text-white outline-none font-bold placeholder-slate-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email field (Both in Sign Up and Login modes) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-[#fbbf24]/70 font-black tracking-widest uppercase">EMAIL</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-[#fbbf24]/50 rounded py-2 pl-9 pr-4 text-xs text-white outline-none font-bold placeholder-slate-600"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-[#fbbf24]/70 font-black tracking-widest uppercase">PASSWORD</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-[#fbbf24]/50 rounded py-2 pl-9 pr-4 text-xs text-white outline-none font-bold placeholder-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  {isSignUpMode ? (
                    <button
                      onClick={handleRegister}
                      disabled={isLoading}
                      className="w-full bg-[#fbbf24]/20 hover:bg-[#fbbf24] text-[#fbbf24] hover:text-black py-2.5 rounded border border-[#fbbf24]/50 text-xs font-black uppercase transition-all cursor-pointer disabled:opacity-30"
                    >
                      {isLoading ? "REGISTRATION INITIALIZED..." : "CREATE ACCOUNT"}
                    </button>
                  ) : (
                    <button
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="w-full bg-[#fbbf24]/20 hover:bg-[#fbbf24] text-[#fbbf24] hover:text-black py-2.5 rounded border border-[#fbbf24]/50 text-xs font-black uppercase transition-all cursor-pointer disabled:opacity-30"
                    >
                      {isLoading ? "RESOLVING IDENTITY & LOGIN..." : "LOGIN"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error / Success logs */}
            {authError && (
              <div className="bg-[#ff0055]/10 p-2.5 border-l-2 border-[#ff0055] rounded text-[10px] text-[#ff0055] font-bold flex gap-2 items-center uppercase tracking-wide">
                <AlertTriangle size={12} />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="bg-emerald-950/40 p-2.5 border-l-2 border-emerald-400 rounded text-[10px] text-emerald-400 font-bold flex gap-2 items-center uppercase tracking-wide">
                <CheckCircle2 size={12} />
                <span>{authSuccess}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer diagnostic details */}
      <footer className="relative z-20 w-full px-4 pt-4 border-t border-cyan-950/40 bg-black/40 flex flex-col md:flex-row items-center justify-between text-[8px] opacity-50 tracking-widest">
        <span>SECURITY_LEVEL: DEEP_ENCRYPTED</span>
        <span>NODE ID: DB_LOCAL_FS_SYS_PROV</span>
        <span>VERSION: G7_RECURSION_STABLE</span>
      </footer>
    </div>
  );
}
