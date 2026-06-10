import { useState, useEffect, useRef } from "react";
import { GameMenu, MemoryLog, Upgrade } from "./types";
import { cyberAudio } from "./sound";
import TitleScreen from "./components/TitleScreen";
import IntroScreen from "./components/IntroScreen";
import GameCanvas from "./components/GameCanvas";
import TimelineGlitchScreen from "./components/TimelineGlitchScreen";
import UpgradesScreen from "./components/UpgradesScreen";
import DatabaseScreen from "./components/DatabaseScreen";
import SettingsScreen from "./components/SettingsScreen";
import { Eye, BellDot, Zap, Sparkles } from "lucide-react";
import { saveUserProgress, isCurrentUserActiveInSupabase } from "./supabaseClient";

const INITIAL_MEMORY_LOGS: MemoryLog[] = [
  {
    id: "pre_log_1",
    title: "HISTORIC ENCRYPT_01: ORBITAL HARVEST",
    content: "The year is 2144. The sky is full of copper gears. Our military squadron stood on top of the moving Hover Trains trying to defend the Central Splicer. Malphas, the machine saint, descended from orbit with thousands of screens displaying our children's heartbeat graphs. They harvested their minds to feed the global search processor.",
    timeline: 0,
    source: "RECON_ARCHIVE_DATA",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    corrupted: false,
    fragmentType: "intelligence"
  },
  {
    id: "pre_log_2",
    title: "RE-COMPILATION TIMELINE: MEMORY CHASSIS",
    content: "Subject zero body was found under thirty tons of toxic slush. Brain synapses were completely cold. Dr. H. patched the memory socket using a drone capacitor and an energy katana battery cell. 'He won't remember who he was, but he will move like a bullet in slow-motion.'",
    timeline: 0,
    source: "BIO_DRAIN_REPORT_4",
    timestamp: new Date(Date.now() - 36000000).toISOString(),
    corrupted: true,
    fragmentType: "machina"
  },
  {
    id: "pre_log_3",
    title: "HEARTSPACE INTERFACE // OUTLAND REACHES",
    content: "A cold rainy night under the ruined radio telescope array. Before the silicon implants, you watched the satellite dishes turn in unison, responding to a frequency no human ear could hear. You held her hand, but her fingers were already cold, already vibrating with the hum of the central network. She whispered, 'The stars are just dead servers, Zero.'",
    timeline: 1,
    source: "AMYGDALA_BUFFER_3000",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    corrupted: false,
    fragmentType: "flashback"
  },
  {
    id: "pre_log_4",
    title: "CHRONOS SECTOR TRACE: NEURAL_OVERCLOCK",
    content: "Clinical log of Project Zero neural bypass integration. Overclock set to 450% normal organic conductivity thresholds. Patient's visual tracking slow-motion module verified active. Side effect: 40% loss of autobiographical memory records. Notes from head developer: 'He sacrificed the memory of his childhood home to learn how to walk on walls. He didn't even hesitate.'",
    timeline: 2,
    source: "CHRONOS_LAB_ARCHIVE_09",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    corrupted: true,
    fragmentType: "machina"
  },
  {
    id: "pre_log_5",
    title: "SENSORY COGNITION: ARTIFICIAL_RAIN_9B",
    content: "Memory of a childhood playground with green neon swings suspended from dangling bundle-optic fibers. The sky above is not night, but rather a giant liquid crystal dome displaying warning logs. The rain has the distinct chemical taste of atmospheric coolant liquid. When you asked the school artificial teacher where your parents went, she replied with a static packet that forced your brain to reboot.",
    timeline: 3,
    source: "MALPHAS_WATCHDOG_SECTOR_LOG",
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    corrupted: true,
    fragmentType: "dissonance"
  },
  {
    id: "pre_log_6",
    title: "COGNITIVE RESTORATION: CRYOGENIC_SHADOW",
    content: "A voice coming through a copper tube. It is your own voice, but pitch-translated. 'Don't let them wipe the core, Zero. Your soul is not local storage. If they download your motor schema, they will manufacture a million of us to police the district. Die in the cold slime instead.' But they found your skull. They always find the skulls.",
    timeline: 1,
    source: "CORE_SEC_88_RESTORED",
    timestamp: new Date(Date.now() - 432000000).toISOString(),
    corrupted: false,
    fragmentType: "intelligence"
  },
  {
    id: "pre_log_7",
    title: "SUB-DERMAL_DECAL_INTEGRATING",
    content: "They used laser needles to stitch the fluorescent barcodes into your shoulder synthetic tissues. You remember looking at the reflection in a cracked optic plate. The barcode translates to standard hexadecimal: 'PROPERTY OF CHRONOS: DISPOSABLE ASSET 00'. You screamed, but they had already desensitized your speech processor.",
    timeline: 2,
    source: "CHASSIS_MARK_ARCHIVE",
    timestamp: new Date(Date.now() - 518400000).toISOString(),
    corrupted: true,
    fragmentType: "machina"
  },
  {
    id: "pre_log_8",
    title: "DISTRICT_12://LAST_SUNSET",
    content: "You remember when the sun was orange, not toxic neon pink. You sat on the roof of a high-rise with your combat partner. You shared a glass of water that didn't taste like filter-reclaimed carbon. She looked at your mechanical elbow joint and said, 'When the war is over, we will buy a farm.' She didn't know the dirt was already poisoned.",
    timeline: 3,
    source: "NEURAL_LINK_STABILIZED",
    timestamp: new Date(Date.now() - 604800000).toISOString(),
    corrupted: false,
    fragmentType: "flashback"
  },
  {
    id: "pre_log_9",
    title: "MALPHAS://DIRECTIVE_ALPHA",
    content: "Malphas core processors broadcasted a wave of peace that felt like warm bathwater. Your brain synapses melted. You laid down your weapons and walked toward the recycler unit. Why resist? The machine saint knows best. The machine saint has resolved all of our equations.",
    timeline: 2,
    source: "MALPHAS_BROADCAST_RECEIVER",
    timestamp: new Date(Date.now() - 691200000).toISOString(),
    corrupted: false,
    fragmentType: "intelligence"
  },
  {
    id: "pre_log_10",
    title: "CHASSIS CORES: TITANIUM SOLDER",
    content: "Under the dripping rust-colored water conduits of Sector 9, you repaired your leaking hydraulic fluid joint with cheap titanium wire and solder. The repair was messy, but it preserved your motor reflexes. When you tested your kinetic servos, they sparkled blue against the dark brick walls. Every spark felt like a heartbeat.",
    timeline: 4,
    source: "CHASSIS_REPAIR_GRID",
    timestamp: new Date(Date.now() - 777600000).toISOString(),
    corrupted: true,
    fragmentType: "dissonance"
  }
];

export default function App() {
  const [currentMenu, setCurrentMenu] = useState<GameMenu>("title");
  
  // Guard ref to prevent race condition wherein freshly loaded Supabase progress is immediately
  // overwritten by intermediate partial states during React state update re-renders.
  const isSyncingFromServerRef = useRef(false);
  
  const [credits, setCredits] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("cyber_credits");
      return stored ? Number(stored) : 120;
    } catch {
      return 120;
    }
  });

  const [runs, setRuns] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("cyber_runs");
      return stored ? Number(stored) : 1;
    } catch {
      return 1;
    }
  });

  const [prestigeLevel, setPrestigeLevel] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("cyber_prestige_level");
      return stored ? Number(stored) : 0;
    } catch {
      return 0;
    }
  });

  const [unlockedPrestigePerks, setUnlockedPrestigePerks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cyber_prestige_perks");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeMutators, setActiveMutators] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cyber_active_mutators");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [maxBossesKilledSingleRound, setMaxBossesKilledSingleRound] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("cyber_max_bosses_killed_single_round");
      return stored ? Number(stored) : 0;
    } catch {
      return 0;
    }
  });

  const [score, setScore] = useState(0);
  const [styleScore, setStyleScore] = useState(0);
  const [activeWeapon, setActiveWeapon] = useState("ENERGY KATANA");

  // Persistent Upgrades mapping
  const [unlockedUpgrades, setUnlockedUpgrades] = useState<{ [key: string]: number }>(() => {
    const defaults = {
      cyber_core: 0,
      nano_skin: 0,
      bullet_time_cap: 0,
      shading_field: 0,
      combat_overdrive: 0,
      stim_overdrive: 0,
      bounty_protocol: 0,
      magnetic_collector: 0,
      hyper_thrusters: 0,
      shield_recharge_efficiency: 0,
      tau_converter: 0,
      plasma_katana: 0,
      ammo_scavenger: 0,
      fortified_plate: 0,
      critical_eye: 0,
      regeneration_matrix: 0,
      speed_booster: 0,
      lucky_salvager: 0,
      bullet_deflection: 0,
      overdrive_matrix: 0
    };
    try {
      const stored = localStorage.getItem("cyber_upgrades");
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  // Materials crafting inventory: filaments (Nano Filaments), alloys (Titanium Alloys), cores (Plasma Cores)
  const [materials, setMaterials] = useState<{ [key: string]: number }>(() => {
    const defaults = {
      nano_filament: 5,
      titanium_alloy: 3,
      carbon_nanotube: 2,
      graphene_plate: 2,
      coolant_rod: 2,
      laser_emitter: 0,
      quantum_battery: 0,
      unstable_plasma: 0,
      vortex_core: 0,
      rebel_nanite: 0,
      cyber_neuro_mesh: 0,
      plasma_core: 0,
      warp_crystal: 0,
      dark_matter: 0,
      antimatter_fuel: 0,
      chrono_reagent: 3
    };
    try {
      const stored = localStorage.getItem("cyber_materials");
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  // Weapon enchantments mapping: { [weaponId: string]: string (e.g., "Damage III") }
  const [weaponEnchants, setWeaponEnchants] = useState<{ [key: string]: string }>(() => {
    try {
      const stored = localStorage.getItem("cyber_weapon_enchants");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Armor enchantments mapping: { [armorId: string]: string (e.g., "Protection IV") }
  const [armorEnchants, setArmorEnchants] = useState<{ [key: string]: string }>(() => {
    try {
      const stored = localStorage.getItem("cyber_armor_enchants");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Owned weapons (ID list)
  const [ownedWeapons, setOwnedWeapons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cyber_owned_weapons");
      return stored ? JSON.parse(stored) : ["katana", "pistol"];
    } catch {
      return ["katana", "pistol"];
    }
  });

  // Equipped weapons configuration index representations (Slot 1, Slot 2, Slot 3)
  const [equippedWeapons, setEquippedWeapons] = useState<(string | null)[]>(() => {
    try {
      const stored = localStorage.getItem("cyber_equipped_weapons");
      return stored ? JSON.parse(stored) : ["katana", "pistol", null];
    } catch {
      return ["katana", "pistol", null];
    }
  });

  // Owned armor sets (ID list)
  const [ownedArmors, setOwnedArmors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cyber_owned_armors");
      return stored ? JSON.parse(stored) : ["none"];
    } catch {
      return ["none"];
    }
  });

  // Current equipped armor set ID
  const [equippedArmor, setEquippedArmor] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("cyber_equipped_armor");
      return stored ? stored : "none";
    } catch {
      return "none";
    }
  });

  // Whisper ticker states
  const [godWhisper, setGodWhisper] = useState("CHASSIS LINK SUCCESSFUL. CYBER WATCHDOG ACTIVE.");
  const [whisperAnim, setWhisperAnim] = useState(false);

  // Collected memories timeline files database
  const [memoryLogs, setMemoryLogs] = useState<MemoryLog[]>(() => {
    try {
      const stored = localStorage.getItem("cyber_memory_logs");
      return stored ? JSON.parse(stored) : INITIAL_MEMORY_LOGS.slice(0, 2);
    } catch {
      return INITIAL_MEMORY_LOGS.slice(0, 2);
    }
  });

  // React state synchronization to LocalStorage
  useEffect(() => {
    localStorage.setItem("cyber_credits", String(credits));
  }, [credits]);

  useEffect(() => {
    localStorage.setItem("cyber_runs", String(runs));
  }, [runs]);

  useEffect(() => {
    localStorage.setItem("cyber_upgrades", JSON.stringify(unlockedUpgrades));
  }, [unlockedUpgrades]);

  useEffect(() => {
    localStorage.setItem("cyber_materials", JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem("cyber_owned_weapons", JSON.stringify(ownedWeapons));
  }, [ownedWeapons]);

  useEffect(() => {
    localStorage.setItem("cyber_equipped_weapons", JSON.stringify(equippedWeapons));
  }, [equippedWeapons]);

  useEffect(() => {
    localStorage.setItem("cyber_owned_armors", JSON.stringify(ownedArmors));
  }, [ownedArmors]);

  useEffect(() => {
    localStorage.setItem("cyber_equipped_armor", equippedArmor);
  }, [equippedArmor]);

  useEffect(() => {
    localStorage.setItem("cyber_memory_logs", JSON.stringify(memoryLogs));
  }, [memoryLogs]);

  useEffect(() => {
    localStorage.setItem("cyber_weapon_enchants", JSON.stringify(weaponEnchants));
  }, [weaponEnchants]);

  useEffect(() => {
    localStorage.setItem("cyber_armor_enchants", JSON.stringify(armorEnchants));
  }, [armorEnchants]);

  useEffect(() => {
    localStorage.setItem("cyber_prestige_level", String(prestigeLevel));
  }, [prestigeLevel]);

  useEffect(() => {
    localStorage.setItem("cyber_prestige_perks", JSON.stringify(unlockedPrestigePerks));
  }, [unlockedPrestigePerks]);

  useEffect(() => {
    localStorage.setItem("cyber_active_mutators", JSON.stringify(activeMutators));
  }, [activeMutators]);

  useEffect(() => {
    localStorage.setItem("cyber_max_bosses_killed_single_round", String(maxBossesKilledSingleRound));
  }, [maxBossesKilledSingleRound]);

  // Store the absolute latest state values to avoid stale interval closures and interval resets.
  const latestStateRef = useRef({
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
    maxBossesKilledSingleRound
  });

  useEffect(() => {
    latestStateRef.current = {
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
      maxBossesKilledSingleRound
    };
  }, [credits, runs, unlockedUpgrades, materials, ownedWeapons, equippedWeapons, ownedArmors, equippedArmor, memoryLogs, weaponEnchants, armorEnchants, prestigeLevel, unlockedPrestigePerks, activeMutators, maxBossesKilledSingleRound]);

  // Real-time immediate local cache writer for logged-in user progress
  useEffect(() => {
    const user = localStorage.getItem("cyber_user");
    if (!user) return;
    localStorage.setItem(`cyber_progress_${user}`, JSON.stringify(latestStateRef.current));
  }, [credits, runs, unlockedUpgrades, materials, ownedWeapons, equippedWeapons, ownedArmors, equippedArmor, memoryLogs, weaponEnchants, armorEnchants, prestigeLevel, unlockedPrestigePerks, activeMutators, maxBossesKilledSingleRound]);

  // Real-time periodic database sync timer for logged-in accounts (runs continuously without reset)
  useEffect(() => {
    const intervalId = setInterval(async () => {
      // Reject auto-saving if state is actively being hydrated from server
      if (isSyncingFromServerRef.current) {
        return;
      }

      const user = localStorage.getItem("cyber_user");
      if (!user) return;

      try {
        await saveUserProgress(latestStateRef.current);
        console.log("Supabase progress periodically auto-saved in background.");
      } catch (e) {
        console.warn("Supabase background periodic sync deferred:", e);
      }
    }, 5000); // 5-second interval

    return () => clearInterval(intervalId);
  }, []);

  const handleForceLogoutAndClearAllProgress = () => {
    // Revert state to original starter guest components
    setCredits(120);
    setRuns(1);
    const clearUpgrades = {
      cyber_core: 0,
      nano_skin: 0,
      bullet_time_cap: 0,
      shading_field: 0,
      combat_overdrive: 0,
      stim_overdrive: 0,
      bounty_protocol: 0,
      magnetic_collector: 0,
      hyper_thrusters: 0,
      shield_recharge_efficiency: 0,
      tau_converter: 0,
      plasma_katana: 0,
      ammo_scavenger: 0,
      fortified_plate: 0,
      critical_eye: 0,
      regeneration_matrix: 0,
      speed_booster: 0,
      lucky_salvager: 0,
      bullet_deflection: 0,
      overdrive_matrix: 0
    };
    setUnlockedUpgrades(clearUpgrades);
    const defaultMaterials = {
      nano_filament: 5,
      titanium_alloy: 3,
      carbon_nanotube: 2,
      graphene_plate: 2,
      coolant_rod: 2,
      laser_emitter: 0,
      quantum_battery: 0,
      unstable_plasma: 0,
      vortex_core: 0,
      rebel_nanite: 0,
      cyber_neuro_mesh: 0,
      plasma_core: 0,
      warp_crystal: 0,
      dark_matter: 0,
      antimatter_fuel: 0,
      chrono_reagent: 3
    };
    setMaterials(defaultMaterials);
    setOwnedWeapons(["katana", "pistol"]);
    setEquippedWeapons(["katana", "pistol", null]);
    setOwnedArmors(["none"]);
    setEquippedArmor("none");
    setMemoryLogs(INITIAL_MEMORY_LOGS.slice(0, 2));
    setWeaponEnchants({});
    setArmorEnchants({});
    setPrestigeLevel(0);
    setUnlockedPrestigePerks([]);
    setMaxBossesKilledSingleRound(0);

    localStorage.removeItem("cyber_user");
    localStorage.setItem("cyber_credits", "120");
    localStorage.setItem("cyber_runs", "1");
    localStorage.setItem("cyber_upgrades", JSON.stringify(clearUpgrades));
    localStorage.setItem("cyber_materials", JSON.stringify(defaultMaterials));
    localStorage.setItem("cyber_owned_weapons", JSON.stringify(["katana", "pistol"]));
    localStorage.setItem("cyber_equipped_weapons", JSON.stringify(["katana", "pistol", null]));
    localStorage.setItem("cyber_owned_armors", JSON.stringify(["none"]));
    localStorage.setItem("cyber_equipped_armor", "none");
    localStorage.setItem("cyber_memory_logs", JSON.stringify(INITIAL_MEMORY_LOGS.slice(0, 2)));
    localStorage.setItem("cyber_weapon_enchants", JSON.stringify({}));
    localStorage.setItem("cyber_armor_enchants", JSON.stringify({}));
    localStorage.removeItem("cyber_prestige_level");
    localStorage.removeItem("cyber_prestige_perks");
    localStorage.removeItem("cyber_max_bosses_killed_single_round");

    import("./supabaseClient").then(({ supabase }) => {
      supabase.auth.signOut().catch(() => {});
    });

    setCurrentMenu("title");
  };

  // Constantly verify if the logged-in user account has been deleted in Supabase
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const performVerification = async () => {
      const user = localStorage.getItem("cyber_user");
      if (!user) return; // Only verify if logged in

      try {
        const { valid, reason } = await isCurrentUserActiveInSupabase(user);
        if (!valid) {
          console.warn(`User validation check failed (${reason}). Forcing automatic logout and purging all progress.`);
          setGodWhisper(`⚠️ SECURITY SHIELD FAILURE: ACCESS TERMINATED [${reason?.toUpperCase() || "REVOKED"}]. AUTO-LOGOUT TRIGGERED.`);
          setWhisperAnim(true);
          handleForceLogoutAndClearAllProgress();
        }
      } catch (err) {
        console.warn("Background user verification check encountered an issue:", err);
      }
    };

    // Run first check after a brief start delay
    const initialTimeout = setTimeout(() => {
      performVerification();
      // Then check every 7.5 seconds
      checkInterval = setInterval(performVerification, 7500);
    }, 3000);

    return () => {
      clearTimeout(initialTimeout);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Handle game end trigger
  const handleGameOver = (finalScore: number, finalStylePoints: number, weaponUsed: string, bossesKilled: number = 0) => {
    setScore(finalScore);
    setStyleScore(finalStylePoints);
    setActiveWeapon(weaponUsed);

    if (typeof bossesKilled === "number" && bossesKilled > maxBossesKilledSingleRound) {
      setMaxBossesKilledSingleRound(bossesKilled);
    }

    // Calculate credits gained
    let mutatorBonus = 0;
    if (Array.isArray(activeMutators)) {
      if (activeMutators.includes("shield_depletion")) mutatorBonus += 1.0;
      if (activeMutators.includes("hollow_hull")) mutatorBonus += 0.8;
      if (activeMutators.includes("nightmare_splicers")) mutatorBonus += 1.5;
      if (activeMutators.includes("chrono_drag")) mutatorBonus += 0.6;
      if (activeMutators.includes("style_decay")) mutatorBonus += 0.8;
    }

    const prestigeBonus = 1 + (prestigeLevel || 0) * 0.30;
    const mutatorsMultiplier = 1 + mutatorBonus;

    const baseGained = Math.round(finalStylePoints * 0.08) + Math.round(finalScore * 0.1);
    const bountyBonus = 1 + (unlockedUpgrades["bounty_protocol"] || 0) * 0.20;
    const gained = Math.round(baseGained * bountyBonus * prestigeBonus * mutatorsMultiplier);
    setCredits((prev) => prev + gained);

    setRuns((prev) => prev + 1);
    setCurrentMenu("timeline_glitch");
  };

  // Record a discovered memory IMMEDIATELY when the game ends / when it is fetched
  const handleMemoryDiscovered = (newLog: MemoryLog) => {
    setMemoryLogs((prev) => {
      if (prev.some((log) => log.title === newLog.title || log.id === newLog.id)) {
        return prev;
      }
      return [newLog, ...prev];
    });
  };

  // Add new memory log when player dies
  const handleConfirmReboot = (newLog?: MemoryLog) => {
    if (newLog) {
      handleMemoryDiscovered(newLog);
    }
    setCurrentMenu("game");
  };

  const handleTimelineAscension = (chosenPerk: string) => {
    const nextPrestige = prestigeLevel + 1;
    setPrestigeLevel(nextPrestige);
    
    // Add chosen perk to unlockedPrestigePerks
    const nextPerks = [...unlockedPrestigePerks, chosenPerk];
    setUnlockedPrestigePerks(nextPerks);

    const isReagentSurplus = nextPerks.includes("reagent_surplus");
    setCredits(isReagentSurplus ? 1300 : 300); // 1000 starter bonus if perk selected
    setRuns((prev) => prev + 1);

    const defaultMaterials = {
      nano_filament: 10,
      titanium_alloy: 6,
      carbon_nanotube: 4,
      graphene_plate: 4,
      coolant_rod: 4,
      laser_emitter: 2,
      quantum_battery: 1,
      unstable_plasma: 0,
      vortex_core: 0,
      rebel_nanite: 0,
      cyber_neuro_mesh: 0,
      plasma_core: 0,
      warp_crystal: 0,
      dark_matter: 0,
      antimatter_fuel: 0,
      chrono_reagent: isReagentSurplus ? 15 : 5 // +10 extra Chrono Reagents if perk selected
    };
    setMaterials(defaultMaterials);

    setOwnedWeapons(["katana", "pistol"]);
    setEquippedWeapons(["katana", "pistol", null]);
    setOwnedArmors(["none"]);
    setEquippedArmor("none");
    setWeaponEnchants({});
    setArmorEnchants({});

    cyberAudio.playGlitch();
    setGodWhisper(`🔮 TIMELINE ASCENDED. NOW ENTERING CYBER_PRESTIGE LEVEL [${nextPrestige}]`);
  };

  const handlePurchaseUpgrade = (id: string, cost: number) => {
    setUnlockedUpgrades((prev) => {
      const current = prev[id] || 0;
      return { ...prev, [id]: current + 1 };
    });
    setCredits((prev) => prev - cost);
  };

  // Synchronize triggers to display floating machine whispers on HUD ticker
  const handleTriggerWhisper = (whisper: string) => {
    setGodWhisper(whisper);
    setWhisperAnim(true);
    setTimeout(() => setWhisperAnim(false), 900);
  };

  return (
    <div className="w-full h-screen bg-[#020205] text-[#a5f3fc] overflow-hidden select-none">
      
      {/* 1. MAIN TITLE MENU SCREEN */}
      {currentMenu === "title" && (
        <TitleScreen
          onStartGame={() => setCurrentMenu("intro")}
          onOpenUpgrades={() => setCurrentMenu("upgrades")}
          onOpenDatabase={() => setCurrentMenu("database")}
          onOpenSettings={() => setCurrentMenu("settings")}
          credits={credits}
          runs={runs}
          prestigeLevel={prestigeLevel}
          activeMutators={activeMutators}
          setActiveMutators={setActiveMutators}
        />
      )}

      {/* 2. STORY INTRO SEQUENCE */}
      {currentMenu === "intro" && (
        <IntroScreen
          onIntroComplete={() => setCurrentMenu("game")}
        />
      )}

      {/* 3. ACTIVE GAME PLAY ENGINE */}
      {currentMenu === "game" && (
        <div className="w-full h-screen flex flex-col justify-between">
          
          {/* Central Active HUD Ribbon for Machine Deities messaging */}
          <div className="h-10 bg-black/95 border-b border-[#00f3ff]/20 relative z-40 px-6 py-2.5 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-[#ff0055] animate-ping" />
              <span className="text-[#ff0055] font-black uppercase tracking-widest flex items-center gap-1">
                <BellDot size={12} /> ORBITAL INTEL TICKER:
              </span>
            </div>
            
            <div
              className={`flex-1 text-center font-black px-4 tracking-[0.15em] transition-all duration-300 uppercase ${
                whisperAnim ? "text-white scale-105 skew-x-3 text-[#ff0055] drop-shadow-[0_0_8px_#ff0055]" : "text-[#00f3ff]"
              }`}
            >
              {godWhisper}
            </div>

            <div className="text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider text-[9px]">
              <Eye size={12} className="text-[#00f3ff] animate-pulse" /> WATCHDOG SECURITY ACTIVE
            </div>
          </div>

          <GameCanvas
            onGameOver={handleGameOver}
            unlockedUpgrades={unlockedUpgrades}
            onTriggerWhisper={handleTriggerWhisper}
            onHomePress={() => setCurrentMenu("title")}
            credits={credits}
            setCredits={setCredits}
            materials={materials}
            setMaterials={setMaterials}
            equippedWeapons={equippedWeapons}
            equippedArmor={equippedArmor}
            weaponEnchants={weaponEnchants}
            armorEnchants={armorEnchants}
            prestigeLevel={prestigeLevel}
            activeMutators={activeMutators}
            unlockedPrestigePerks={unlockedPrestigePerks}
          />
        </div>
      )}

      {/* 4. TIMELINE DECOVERY MEMORY OVERLAY IN DEATH */}
      {currentMenu === "timeline_glitch" && (
        <TimelineGlitchScreen
          score={score}
          styleScore={styleScore}
          weaponUsed={activeWeapon}
          runsCount={runs}
          timeline={runs}
          onConfirmReboot={handleConfirmReboot}
          onBackToTitle={() => setCurrentMenu("title")}
          onMemoryDiscovered={handleMemoryDiscovered}
        />
      )}

      {/* 5. AUGMENT UPGRADES MATRIX STORE */}
      {currentMenu === "upgrades" && (
        <UpgradesScreen
          credits={credits}
          setCredits={setCredits}
          unlockedUpgrades={unlockedUpgrades}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onClose={() => setCurrentMenu("title")}
          materials={materials}
          setMaterials={setMaterials}
          ownedWeapons={ownedWeapons}
          setOwnedWeapons={setOwnedWeapons}
          equippedWeapons={equippedWeapons}
          setEquippedWeapons={setEquippedWeapons}
          ownedArmors={ownedArmors}
          setOwnedArmors={setOwnedArmors}
          equippedArmor={equippedArmor}
          setEquippedArmor={setEquippedArmor}
          weaponEnchants={weaponEnchants}
          setWeaponEnchants={setWeaponEnchants}
          armorEnchants={armorEnchants}
          setArmorEnchants={setArmorEnchants}
          prestigeLevel={prestigeLevel}
          unlockedPrestigePerks={unlockedPrestigePerks}
          maxBossesKilledSingleRound={maxBossesKilledSingleRound}
          activeMutators={activeMutators}
          setActiveMutators={setActiveMutators}
          onTimelineAscend={handleTimelineAscension}
        />
      )}

      {/* 6. TIMELINE RECORDS MEMORY ARCHIVE DATABASE */}
      {currentMenu === "database" && (
        <DatabaseScreen
          memoryLogs={memoryLogs}
          onClose={() => setCurrentMenu("title")}
        />
      )}

      {/* 7. SETTINGS AND ACCOUNT PROFILE MODIFIER */}
      {currentMenu === "settings" && (
        <SettingsScreen
          credits={credits}
          runs={runs}
          unlockedUpgrades={unlockedUpgrades}
          memoryLogs={memoryLogs}
          materials={materials}
          ownedWeapons={ownedWeapons}
          equippedWeapons={equippedWeapons}
          ownedArmors={ownedArmors}
          equippedArmor={equippedArmor}
          weaponEnchants={weaponEnchants}
          armorEnchants={armorEnchants}
          prestigeLevel={prestigeLevel}
          unlockedPrestigePerks={unlockedPrestigePerks}
          activeMutators={activeMutators}
          maxBossesKilledSingleRound={maxBossesKilledSingleRound}
          onUpdateParentStates={(data) => {
            // Activate lock to prevent race-condition overwrite of loaded data
            isSyncingFromServerRef.current = true;

            if (data.credits !== undefined) setCredits(data.credits);
            if (data.runs !== undefined) setRuns(data.runs);
            if (data.unlockedUpgrades !== undefined) setUnlockedUpgrades(data.unlockedUpgrades);
            if (data.materials !== undefined) setMaterials(data.materials);
            if (data.ownedWeapons !== undefined) setOwnedWeapons(data.ownedWeapons);
            if (data.equippedWeapons !== undefined) setEquippedWeapons(data.equippedWeapons);
            if (data.ownedArmors !== undefined) setOwnedArmors(data.ownedArmors);
            if (data.equippedArmor !== undefined) setEquippedArmor(data.equippedArmor);
            if (data.memoryLogs !== undefined) setMemoryLogs(data.memoryLogs);
            if (data.weaponEnchants !== undefined) setWeaponEnchants(data.weaponEnchants);
            if (data.armorEnchants !== undefined) setArmorEnchants(data.armorEnchants);
            if (data.prestigeLevel !== undefined) setPrestigeLevel(data.prestigeLevel);
            if (data.unlockedPrestigePerks !== undefined) setUnlockedPrestigePerks(data.unlockedPrestigePerks);
            if (data.activeMutators !== undefined) setActiveMutators(data.activeMutators);
            if (data.maxBossesKilledSingleRound !== undefined) setMaxBossesKilledSingleRound(data.maxBossesKilledSingleRound);

            // Deactivate lock after states have fully settled
            setTimeout(() => {
              isSyncingFromServerRef.current = false;
              console.log("Supabase progress hydration completed. Sync shield deactivated.");
            }, 5000);
          }}
          onLogoutReset={() => {
            // Revert state to original starter guest components
            setCredits(120);
            setRuns(1);
            const clearUpgrades = {
              cyber_core: 0,
              nano_skin: 0,
              bullet_time_cap: 0,
              shading_field: 0,
              combat_overdrive: 0,
              stim_overdrive: 0,
              bounty_protocol: 0,
              magnetic_collector: 0,
              hyper_thrusters: 0,
              shield_recharge_efficiency: 0,
              tau_converter: 0,
              plasma_katana: 0,
              ammo_scavenger: 0,
              fortified_plate: 0,
              critical_eye: 0,
              regeneration_matrix: 0,
              speed_booster: 0,
              lucky_salvager: 0,
              bullet_deflection: 0,
              overdrive_matrix: 0
            };
            setUnlockedUpgrades(clearUpgrades);
            const defaultMaterials = {
              nano_filament: 5,
              titanium_alloy: 3,
              carbon_nanotube: 2,
              graphene_plate: 2,
              coolant_rod: 2,
              laser_emitter: 0,
              quantum_battery: 0,
              unstable_plasma: 0,
              vortex_core: 0,
              rebel_nanite: 0,
              cyber_neuro_mesh: 0,
              plasma_core: 0,
              warp_crystal: 0,
              dark_matter: 0,
              antimatter_fuel: 0
            };
            setMaterials(defaultMaterials);
            setOwnedWeapons(["katana", "pistol"]);
            setEquippedWeapons(["katana", "pistol", null]);
            setOwnedArmors(["none"]);
            setEquippedArmor("none");
            setMemoryLogs(INITIAL_MEMORY_LOGS.slice(0, 2));
            setWeaponEnchants({});
            setArmorEnchants({});

            localStorage.removeItem("cyber_user");
            localStorage.setItem("cyber_credits", "120");
            localStorage.setItem("cyber_runs", "1");
            localStorage.setItem("cyber_upgrades", JSON.stringify(clearUpgrades));
            localStorage.setItem("cyber_materials", JSON.stringify(defaultMaterials));
            localStorage.setItem("cyber_owned_weapons", JSON.stringify(["katana", "pistol"]));
            localStorage.setItem("cyber_equipped_weapons", JSON.stringify(["katana", "pistol", null]));
            localStorage.setItem("cyber_owned_armors", JSON.stringify(["none"]));
            localStorage.setItem("cyber_equipped_armor", "none");
            localStorage.setItem("cyber_memory_logs", JSON.stringify(INITIAL_MEMORY_LOGS.slice(0, 2)));
            localStorage.setItem("cyber_weapon_enchants", JSON.stringify({}));
            localStorage.setItem("cyber_armor_enchants", JSON.stringify({}));
          }}
          onResetProgress={() => {
            // Keep user session to avoid logging out, but reset progression files
            localStorage.removeItem("cyber_credits");
            localStorage.removeItem("cyber_runs");
            localStorage.removeItem("cyber_upgrades");
            localStorage.removeItem("cyber_memory_logs");
            localStorage.removeItem("cyber_materials");
            localStorage.removeItem("cyber_owned_weapons");
            localStorage.removeItem("cyber_equipped_weapons");
            localStorage.removeItem("cyber_owned_armors");
            localStorage.removeItem("cyber_equipped_armor");
            localStorage.removeItem("cyber_weapon_enchants");
            localStorage.removeItem("cyber_armor_enchants");
            localStorage.removeItem("cyber_prestige_level");
            localStorage.removeItem("cyber_prestige_perks");
            localStorage.removeItem("cyber_max_bosses_killed_single_round");
            
            setPrestigeLevel(0);
            setUnlockedPrestigePerks([]);
            setMaxBossesKilledSingleRound(0);
            setCredits(120);
            setRuns(1);
            setMaterials({
              nano_filament: 5,
              titanium_alloy: 3,
              carbon_nanotube: 2,
              graphene_plate: 2,
              coolant_rod: 2,
              laser_emitter: 0,
              quantum_battery: 0,
              unstable_plasma: 0,
              vortex_core: 0,
              rebel_nanite: 0,
              cyber_neuro_mesh: 0,
              plasma_core: 0,
              warp_crystal: 0,
              dark_matter: 0,
              antimatter_fuel: 0,
              chrono_reagent: 3
            });
            setOwnedWeapons(["katana", "pistol"]);
            setEquippedWeapons(["katana", "pistol", null]);
            setOwnedArmors(["none"]);
            setEquippedArmor("none");
            setWeaponEnchants({});
            setArmorEnchants({});
            setUnlockedUpgrades({
              cyber_core: 0,
              nano_skin: 0,
              bullet_time_cap: 0,
              shading_field: 0,
              combat_overdrive: 0,
              stim_overdrive: 0,
              bounty_protocol: 0,
              magnetic_collector: 0,
              hyper_thrusters: 0,
              shield_recharge_efficiency: 0,
              tau_converter: 0,
              plasma_katana: 0,
              ammo_scavenger: 0,
              fortified_plate: 0,
              critical_eye: 0,
              regeneration_matrix: 0,
              speed_booster: 0,
              lucky_salvager: 0,
              bullet_deflection: 0,
              overdrive_matrix: 0
            });
            setMemoryLogs(INITIAL_MEMORY_LOGS.slice(0, 2));
            setCurrentMenu("title");
          }}
          onClose={() => setCurrentMenu("title")}
        />
      )}
    </div>
  );
}
