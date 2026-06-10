import React, { useState } from "react";
import { Upgrade, MemoryLog } from "../types";
import { cyberAudio } from "../sound";
import { Cpu, Shield, Zap, RefreshCw, X, ShoppingCart, Lock, Swords, Package, Layers, Hammer, Check, ArrowRight, Eye, Sparkles, Bomb, Flame, Crosshair, Target, Skull, Activity } from "lucide-react";
import { WEAPONS_CATALOG, ARMORS_CATALOG, MATERIAL_INFO, ALL_MATERIALS_KEYS, CraftableWeapon, CraftableArmor, getMaterialDetails } from "../data";

export const ALL_ASCENSIONS = [
  {
    id: "hyper_drive_weapons",
    name: "⚡ HYPER-DRIVE WEAPONS FEED",
    desc: "+30% weapon firing cycle rate override (shorter cooldown time).",
    color: "#06b6d4"
  },
  {
    id: "nano_reinforced_plating",
    name: "🛡️ SHIELD RE-GEN OVERCLOCK",
    desc: "Starts clone with +50 Shield limit & triggers instant shield recharge to maximum upon dash.",
    color: "#3b82f6"
  },
  {
    id: "reagent_surplus",
    name: "🧪 REAGENT CHRONAL EMITTER",
    desc: "Start each new timeline sequence with an additional +10 Chrono Reagents and +1000 credits startup bonus.",
    color: "#a855f7"
  },
  {
    id: "overcharged_core",
    name: "🔥 DEITY OVERCHARGED CORE",
    desc: "+50 HP maximum chassis vitality boost of clone models.",
    color: "#ec4899"
  },
  {
    id: "tactical_tactician",
    name: "🔮 CHRONO SLOWMO TRANSDUCER",
    desc: "+50% slow-motion duration vectors and +50% bullet-time speed recovery cycles.",
    color: "#eab308"
  },
  {
    id: "deity_scavenger",
    name: "✨ DOUBLE PLASMA HARVESTING",
    desc: "All dropped titanium alloys and plasma filaments double in acquisition count (+2 instead of +1 per pickup).",
    color: "#10b981"
  },
  {
    id: "magnetic_thrusters",
    name: "🚀 MAGNETIC TRAJECTORY BOOST",
    desc: "+25% movement speed vectors in all active operating cycles.",
    color: "#f97316"
  }
];

const AUGMENT_PARENTS: { [key: string]: string } = {
  // cybernetic
  fortified_plate: "cyber_core",
  regeneration_matrix: "fortified_plate",
  nano_skin: "cyber_core",
  shield_recharge_efficiency: "nano_skin",
  stim_overdrive: "cyber_core",
  magnetic_collector: "stim_overdrive",
  speed_booster: "cyber_core",

  // combat
  combat_overdrive: "cyber_core",
  overdrive_matrix: "combat_overdrive",
  critical_eye: "overdrive_matrix",
  plasma_katana: "combat_overdrive",
  bullet_deflection: "plasma_katana",

  // tactical
  bullet_time_cap: "cyber_core",
  tau_converter: "bullet_time_cap",
  bounty_protocol: "tau_converter",
  shading_field: "bullet_time_cap",
  hyper_thrusters: "shading_field",
  ammo_scavenger: "bullet_time_cap",
  lucky_salvager: "ammo_scavenger",
};

const AUGMENT_TREE_POSITIONS: { [key: string]: { x: number; y: number } } = {
  // Absolute Single Root: Cyber Core at centered top
  cyber_core: { x: 50, y: 18 },

  // Level 1 Branches (Middle Layer at y: 36)
  // Cybernetic (Left Wing)
  fortified_plate: { x: 10, y: 36 },
  nano_skin: { x: 18, y: 36 },
  stim_overdrive: { x: 26, y: 36 },
  speed_booster: { x: 34, y: 36 },

  // Combat (Center)
  combat_overdrive: { x: 50, y: 36 },

  // Chrono Tactical (Right Wing)
  bullet_time_cap: { x: 74, y: 36 },

  // Level 2 Branches/Nodes (Standard height at y: 54)
  // Cybernetic Level 2
  regeneration_matrix: { x: 10, y: 54 },
  shield_recharge_efficiency: { x: 18, y: 54 },
  magnetic_collector: { x: 26, y: 54 },

  // Combat Level 2
  overdrive_matrix: { x: 44, y: 54 },
  plasma_katana: { x: 56, y: 54 },

  // Tactical Level 2
  tau_converter: { x: 67, y: 54 },
  shading_field: { x: 75, y: 54 },
  ammo_scavenger: { x: 83, y: 54 },

  // Level 3 Branches/Nodes
  // Combat Level 3
  critical_eye: { x: 44, y: 72 },
  bullet_deflection: { x: 56, y: 72 },

  // Tactical Level 3
  bounty_protocol: { x: 67, y: 72 },
  hyper_thrusters: { x: 75, y: 72 },
  lucky_salvager: { x: 83, y: 72 },
};

const getWeaponParent = (w: CraftableWeapon): CraftableWeapon | null => {
  const listInCat = WEAPONS_CATALOG.filter(item => item.category === w.category);
  const index = listInCat.findIndex(item => item.id === w.id);
  if (index <= 0) return null;
  const parentIndex = Math.floor((index - 1) / 3);
  return listInCat[parentIndex] || null;
};

const getWeaponDepth = (w: CraftableWeapon): number => {
  const listInCat = WEAPONS_CATALOG.filter(item => item.category === w.category);
  const index = listInCat.findIndex(item => item.id === w.id);
  if (index <= 0) return 0;
  if (index >= 1 && index <= 3) return 1;
  if (index >= 4 && index <= 12) return 2;
  return 3;
};

const getWeaponConnector = (w: CraftableWeapon): string => {
  const listInCat = WEAPONS_CATALOG.filter(item => item.category === w.category);
  const index = listInCat.findIndex(item => item.id === w.id);
  if (index <= 0) return "";
  const parentIndex = Math.floor((index - 1) / 3);
  const lastChildIndex = 3 * parentIndex + 3;
  const isLast = (index === lastChildIndex) || (index === listInCat.length - 1);
  return isLast ? "└──" : "├──";
};

function buildWeaponTreeNodes(listInCat: CraftableWeapon[]): { item: CraftableWeapon; depth: number; connector: string }[] {
  if (listInCat.length === 0) return [];
  const nodes: { item: CraftableWeapon; depth: number; connector: string }[] = [];

  function traverse(index: number, depth: number, prefixes: string[], isLastSibling: boolean) {
    if (index >= listInCat.length) return;
    
    let connector = "";
    if (depth > 0) {
      connector = prefixes.join("") + (isLastSibling ? "└── " : "├── ");
    }
    
    const item = listInCat[index];
    nodes.push({ item, depth, connector });

    const child1 = 3 * index + 1;
    const child2 = 3 * index + 2;
    const child3 = 3 * index + 3;

    const validChildren: number[] = [];
    if (child1 < listInCat.length) validChildren.push(child1);
    if (child2 < listInCat.length) validChildren.push(child2);
    if (child3 < listInCat.length) validChildren.push(child3);

    validChildren.forEach((childIndex, i) => {
      const isLast = i === validChildren.length - 1;
      const nextPrefixes = [...prefixes];
      if (depth > 0) {
        nextPrefixes.push(isLastSibling ? "    " : "│   ");
      }
      traverse(childIndex, depth + 1, nextPrefixes, isLast);
    });
  }

  traverse(0, 0, [], true);
  return nodes;
}

function buildArmorTreeNodes(list: CraftableArmor[]): { item: CraftableArmor; depth: number; connector: string }[] {
  const root = list.find(a => a.id === "none");
  if (!root) return [];
  const nodes: { item: CraftableArmor; depth: number; connector: string }[] = [];

  function traverse(item: CraftableArmor, depth: number, prefixes: string[], isLastSibling: boolean) {
    let connector = "";
    if (depth > 0) {
      connector = prefixes.join("") + (isLastSibling ? "└── " : "├── ");
    }
    nodes.push({ item, depth, connector });

    const children = list.filter(child => ARMOR_PARENTS[child.id] === item.id);
    children.forEach((child, i) => {
      const isLast = i === children.length - 1;
      const nextPrefixes = [...prefixes];
      if (depth > 0) {
        nextPrefixes.push(isLastSibling ? "    " : "│   ");
      }
      traverse(child, depth + 1, nextPrefixes, isLast);
    });
  }

  traverse(root, 0, [], true);
  return nodes;
}

const ARMOR_PARENTS: { [key: string]: string } = {
  dragon_set: "none",
  shadow_set: "none",
  crystal_set: "dragon_set",
  berserker_set: "dragon_set",
  celestial_set: "shadow_set",
  void_set: "shadow_set",
  storm_set: "crystal_set",
  titan_set: "void_set",
};

const ARMOR_ORDERED_IDS = [
  "none",
  "dragon_set",
  "crystal_set",
  "storm_set",
  "berserker_set",
  "shadow_set",
  "celestial_set",
  "void_set",
  "titan_set"
];

const getArmorParent = (a: CraftableArmor): CraftableArmor | null => {
  const parentId = ARMOR_PARENTS[a.id];
  if (!parentId) return null;
  return ARMORS_CATALOG.find(item => item.id === parentId) || null;
};

const getArmorDepth = (armorId: string): number => {
  if (armorId === "none") return 0;
  if (armorId === "dragon_set" || armorId === "shadow_set") return 1;
  if (armorId === "crystal_set" || armorId === "berserker_set" || armorId === "celestial_set" || armorId === "void_set") return 2;
  return 3;
};

const getArmorConnector = (armorId: string): string => {
  if (armorId === "none") return "";
  if (armorId === "berserker_set" || armorId === "titan_set" || armorId === "storm_set") {
    return "└──";
  }
  return "├──";
};

const getSymmetricTreePath = (pPos: { x: number; y: number }, cPos: { x: number; y: number }, offset_x = 3.6, offset_y = 3.6) => {
  if (Math.abs(pPos.y - cPos.y) < 0.1) {
    const startX = pPos.x + (pPos.x < cPos.x ? offset_x : -offset_x);
    const endX = cPos.x + (pPos.x < cPos.x ? -offset_x : offset_x);
    return `M ${startX} ${pPos.y} H ${endX}`;
  }
  const midY = (pPos.y + cPos.y) / 2;
  const startY = pPos.y + offset_y;
  const endY = cPos.y - offset_y;
  return `M ${pPos.x} ${startY} V ${midY} H ${cPos.x} V ${endY}`;
};

const WEAPON_TREE_POSITIONS: { [index: number]: { x: number; y: number } } = {
  0: { x: 50, y: 10 },   // Root (Level 0)

  // Level 1 Branches (linked to 0)
  1: { x: 20, y: 28 },
  2: { x: 50, y: 28 },
  3: { x: 80, y: 28 },

  // Level 2 Sub-branches (4,5,6 linked to 1; 7,8,9 linked to 2; 10,11,12 linked to 3)
  4: { x: 10, y: 48 },
  5: { x: 20, y: 48 },
  6: { x: 30, y: 48 },
  7: { x: 42, y: 48 },
  8: { x: 50, y: 48 },
  9: { x: 58, y: 48 },
  10: { x: 70, y: 48 },
  11: { x: 80, y: 48 },
  12: { x: 90, y: 48 },

  // Level 3 Deep-leaves (13,14,15 linked to 4; 16,17,18 linked to 5; 19,20,21 linked to 6; 22,23,24 linked to 7)
  13: { x: 6, y: 74 },
  14: { x: 11, y: 74 },
  15: { x: 16, y: 74 },
  16: { x: 21, y: 74 },
  17: { x: 26, y: 74 },
  18: { x: 31, y: 74 },
  19: { x: 37, y: 74 },
  20: { x: 42, y: 74 },
  21: { x: 47, y: 74 },
  22: { x: 60, y: 74 },
  23: { x: 75, y: 74 },
  24: { x: 90, y: 74 }
};

const WEAPON_TREE_CONNECTIONS = [
  // Root to Level 1
  [0, 1], [0, 2], [0, 3],

  // Level 1 to Level 2
  [1, 4], [1, 5], [1, 6],
  [2, 7], [2, 8], [2, 9],
  [3, 10], [3, 11], [3, 12],

  // Level 2 to Level 3
  [4, 13], [4, 14], [4, 15],
  [5, 16], [5, 17], [5, 18],
  [6, 19], [6, 20], [6, 21],
  [7, 22], [7, 23], [7, 24]
];

const ARMOR_TREE_POSITIONS: { [id: string]: { x: number; y: number } } = {
  none: { x: 50, y: 22 },         // Centered Root (Level 0)
  dragon_set: { x: 30, y: 38 },   // Level 1 Left
  crystal_set: { x: 20, y: 54 },  // Level 2 Left-Left
  storm_set: { x: 20, y: 70 },    // Level 3 Left-Left-Down
  berserker_set: { x: 40, y: 54 },// Level 2 Left-Right
  shadow_set: { x: 70, y: 38 },   // Level 1 Right
  celestial_set: { x: 60, y: 54 },// Level 2 Right-Left
  void_set: { x: 80, y: 54 },     // Level 2 Right-Right
  titan_set: { x: 80, y: 70 }     // Level 3 Right-Right-Down
};

const ARMOR_TREE_CONNECTIONS = [
  ["none", "dragon_set"],
  ["dragon_set", "crystal_set"],
  ["crystal_set", "storm_set"],
  ["dragon_set", "berserker_set"],
  ["none", "shadow_set"],
  ["shadow_set", "celestial_set"],
  ["shadow_set", "void_set"],
  ["void_set", "titan_set"]
];

const getWeaponIcon = (w: CraftableWeapon) => {
  const name = w.name.toUpperCase();
  const color = w.color || "#fbbf24";
  
  if (w.category === "melee") {
    if (name.includes("SHIELD") || name.includes("AEGIS")) return <Shield size={18} style={{ color }} />;
    if (name.includes("MACE") || name.includes("HAMMER")) return <Hammer size={18} style={{ color }} />;
    if (name.includes("BATON") || name.includes("STAFF")) return <Activity size={18} style={{ color }} />;
    if (name.includes("WHIP")) return <Zap size={18} style={{ color }} />;
    if (name.includes("GUILLOTINE") || name.includes("SICKLE") || name.includes("CLEAVER") || name.includes("SCYTHE")) return <Layers size={18} style={{ color }} />;
    if (name.includes("CLAW") || name.includes("SLASHER") || name.includes("FANG") || name.includes("SHIV") || name.includes("DAGGER")) return <Sparkles size={18} style={{ color }} />;
    return <Swords size={18} style={{ color }} />;
  } else if (w.category === "primary") {
    if (name.includes("SHOTGUN") || name.includes("DEVASTATOR") || name.includes("BOLTER") || name.includes("SHREDDER")) return <Target size={18} style={{ color }} />;
    if (name.includes("RAILGUN") || name.includes("SNIPER") || name.includes("MARKSMAN") || name.includes("DRIVER")) return <Target size={18} style={{ color }} />;
    if (name.includes("LASER") || name.includes("CARBINE") || name.includes("VOLT") || name.includes("PULSE") || name.includes("BEAM") || name.includes("TESLA") || name.includes("ARC")) return <Zap size={18} style={{ color }} />;
    if (name.includes("INJECTOR") || name.includes("SPITTER") || name.includes("NAILER") || name.includes("SWARMER")) return <Layers size={18} style={{ color }} />;
    return <Crosshair size={18} style={{ color }} />;
  } else { // secondary
    if (name.includes("MINE") || name.includes("TRIPMINE")) return <Bomb size={18} style={{ color }} />;
    if (name.includes("GRENADE") || name.includes("DETONATOR") || name.includes("POD") || name.includes("MISSILE") || name.includes("ROCKET")) return <Bomb size={18} style={{ color }} />;
    if (name.includes("FLARE") || name.includes("NAPALM") || name.includes("THERMITE") || name.includes("COMBUSTION")) return <Flame size={18} style={{ color }} />;
    if (name.includes("TOXIC") || name.includes("VIAL") || name.includes("ACID") || name.includes("DECAY") || name.includes("RADIATION")) return <Skull size={18} style={{ color }} />;
    if (name.includes("STINGER") || name.includes("SIPHON") || name.includes("DISCHARGER")) return <Zap size={18} style={{ color }} />;
    if (name.includes("CELL") || name.includes("DART") || name.includes("DYNAMO") || name.includes("SPARKER")) return <Cpu size={18} style={{ color }} />;
    if (name.includes("BUBBLE") || name.includes("HOLOGRAM")) return <Eye size={18} style={{ color }} />;
    return <Cpu size={18} style={{ color }} />;
  }
};

const getArmorIconHelper = (a: CraftableArmor) => {
  const id = a.id;
  const color = a.color || "#94a3b8";
  if (id === "none") return <Cpu size={18} style={{ color }} />;
  if (id === "dragon_set") return <Flame size={18} style={{ color }} />;
  if (id === "shadow_set") return <Eye size={18} style={{ color }} />;
  if (id === "crystal_set") return <Sparkles size={18} style={{ color }} />;
  if (id === "berserker_set") return <Swords size={18} style={{ color }} />;
  if (id === "celestial_set") return <Layers size={18} style={{ color }} />;
  if (id === "void_set") return <Lock size={18} style={{ color }} />;
  if (id === "storm_set") return <Zap size={18} style={{ color }} />;
  if (id === "titan_set") return <Shield size={18} style={{ color }} />;
  return <Shield size={18} style={{ color }} />;
};

interface UpgradesScreenProps {
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  unlockedUpgrades: { [key: string]: number };
  onPurchaseUpgrade: (id: string, cost: number) => void;
  onClose: () => void;

  // New crafting categories and loadout props:
  materials: { [key: string]: number };
  setMaterials: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  ownedWeapons: string[];
  setOwnedWeapons: React.Dispatch<React.SetStateAction<string[]>>;
  equippedWeapons: (string | null)[];
  setEquippedWeapons: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  ownedArmors: string[];
  setOwnedArmors: React.Dispatch<React.SetStateAction<string[]>>;
  equippedArmor: string;
  setEquippedArmor: React.Dispatch<React.SetStateAction<string>>;
  weaponEnchants: { [key: string]: string };
  setWeaponEnchants: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  armorEnchants: { [key: string]: string };
  setArmorEnchants: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  prestigeLevel?: number;
  unlockedPrestigePerks?: string[];
  maxBossesKilledSingleRound?: number;
  activeMutators?: string[];
  setActiveMutators?: React.Dispatch<React.SetStateAction<string[]>>;
  onTimelineAscend?: (perk: string) => void;
}

export default function UpgradesScreen({
  credits,
  setCredits,
  unlockedUpgrades,
  onPurchaseUpgrade,
  onClose,
  materials,
  setMaterials,
  ownedWeapons,
  setOwnedWeapons,
  equippedWeapons,
  setEquippedWeapons,
  ownedArmors,
  setOwnedArmors,
  equippedArmor,
  setEquippedArmor,
  weaponEnchants,
  setWeaponEnchants,
  armorEnchants,
  setArmorEnchants,
  prestigeLevel = 0,
  unlockedPrestigePerks = [],
  maxBossesKilledSingleRound = 0,
  activeMutators = [],
  setActiveMutators,
  onTimelineAscend
}: UpgradesScreenProps) {
  const [activeTab, setActiveTab] = useState<"upgrades" | "weapons" | "armor" | "enchants" | "inventory" | "prestige">("upgrades");
  const [inventorySubTab, setInventorySubTab] = useState<"cargo" | "chrono">("cargo");
  const [weaponCategory, setWeaponCategory] = useState<"melee" | "primary" | "secondary">("melee");
  const [weaponSort, setWeaponSort] = useState<"tree" | "owned" | "weakest" | "strongest">("tree");
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);
  const [armorSort, setArmorSort] = useState<"tree" | "flat">("tree");
  const [selectedArmorId, setSelectedArmorId] = useState<string | null>(null);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);

  const changeTab = (tab: "upgrades" | "weapons" | "armor" | "enchants" | "inventory" | "prestige") => {
    setActiveTab(tab);
    setSelectedUpgradeId(null);
    setSelectedWeaponId(null);
    setSelectedArmorId(null);
    cyberAudio.playHack();
  };

  const getNodeBorderAndGlow = (
    rank: string, 
    isOwned: boolean, 
    isParentUnlocked: boolean, 
    isSelected: boolean
  ) => {
    let hexColor = "#94a3b8"; // COMMON
    
    if (rank === "UNCOMMON") hexColor = "#22c55e";
    else if (rank === "RARE") hexColor = "#3b82f6";
    else if (rank === "EPIC") hexColor = "#a855f7";
    else if (rank === "LEGENDARY") hexColor = "#f97316";
    else if (rank === "MYTHIC") hexColor = "#ef4444";
    else if (rank === "CELESTIAL") hexColor = "#ec4899";

    if (!isParentUnlocked) {
      return {
        nodeClass: "border bg-slate-950 text-secondary opacity-40 hover:opacity-60 scale-95",
        style: {
          borderColor: `${hexColor}40`,
          boxShadow: `0 0 4px ${hexColor}10`
        },
        color: hexColor
      };
    }

    if (isSelected) {
      return {
        nodeClass: "border-2 bg-slate-950 text-white z-20 font-black scale-105",
        style: {
          borderColor: hexColor,
          boxShadow: `0 0 15px ${hexColor}75, inset 0 0 8px ${hexColor}35`
        },
        color: hexColor
      };
    }

    if (isOwned) {
      return {
        nodeClass: "border-2 bg-slate-950 text-white font-bold hover:scale-102",
        style: {
          borderColor: hexColor,
          boxShadow: `0 0 10px ${hexColor}40, inset 0 0 4px ${hexColor}20`
        },
        color: hexColor
      };
    }

    return {
      nodeClass: "border border-dashed bg-slate-950 text-slate-400 hover:border-solid hover:scale-102",
      style: {
        borderColor: `${hexColor}85`,
        boxShadow: `0 0 6px ${hexColor}20`
      },
      color: hexColor
    };
  };

  // Ascension Selection States
  const requiredBossesKilled = 30 + prestigeLevel * 5;
  const hasUnlockedPrestige = maxBossesKilledSingleRound >= requiredBossesKilled;

  const [isSelectingAscension, setIsSelectingAscension] = useState<boolean>(false);
  const [ascensionChoices, setAscensionChoices] = useState<any[]>([]);
  const [selectedAscensionId, setSelectedAscensionId] = useState<string | null>(null);

  const handleStartAscensionSelection = () => {
    // Pick 3 random ascensions that the player hasn't already unlocked (if possible)
    const available = ALL_ASCENSIONS.filter(a => !unlockedPrestigePerks.includes(a.id));
    const pool = available.length >= 3 ? available : ALL_ASCENSIONS;
    
    // Shuffle and take 3
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setAscensionChoices(shuffled.slice(0, 3));
    setSelectedAscensionId(shuffled[0]?.id || null);
    setIsSelectingAscension(true);
    cyberAudio.playGlitch();
  };

  // Chrono Enchantment states
  const [enchantItemType, setEnchantItemType] = useState<"weapon" | "armor">("weapon");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [enchantIntensity, setEnchantIntensity] = useState<1 | 2 | 3>(1);
  const [isEnchanting, setIsEnchanting] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [rollResult, setRollResult] = useState<string | null>(null);

  // Resolve default active item if none selected: default to equipped item, falling back to owned
  const activeSelectedId = selectedItemId || (enchantItemType === "weapon" ? (equippedWeapons[0] || ownedWeapons[0]) : (equippedArmor !== "none" ? equippedArmor : (ownedArmors.find(id => id !== "none") || "none")));

  // Character Augment System upgrades data with exactly 20 clear upgrades
  const [upgradesList] = useState<Upgrade[]>([
    {
      id: "cyber_core",
      name: "REACTOR CYBER-CORE",
      description: "+25 Max HP & +10% Speed per upgrade level.",
      cost: 50,
      maxLevel: 5,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "cpu",
      statModifier: "+25 Max HP // +10% Speed"
    },
    {
      id: "nano_skin",
      name: "NANOSKIN MATRIX SHIELD",
      description: "+25 Barrier Shield Capacity per upgrade level.",
      cost: 75,
      maxLevel: 5,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "shield",
      statModifier: "+25 Shield Capacity"
    },
    {
      id: "bullet_time_cap",
      name: "SENSORY COGNITIVE RE-CAPACITOR",
      description: "+25% Bullet-Time Capacitor duration capacity.",
      cost: 100,
      maxLevel: 3,
      currentLevel: 0,
      category: "tactical",
      iconName: "zap",
      statModifier: "+25% Bullet-Time Capacity"
    },
    {
      id: "shading_field",
      name: "SHADING REFLECTION WAVE",
      description: "+8% Auto projectile damage skip/dodge chances.",
      cost: 150,
      maxLevel: 3,
      currentLevel: 0,
      category: "tactical",
      iconName: "reflector",
      statModifier: "8% Auto Damage Deflection"
    },
    {
      id: "combat_overdrive",
      name: "KINETIC VOLTAGE OVERCLOCK",
      description: "+15% Raw damage output for all equipped weapon systems.",
      cost: 120,
      maxLevel: 5,
      currentLevel: 0,
      category: "combat",
      iconName: "zap",
      statModifier: "+15% Total Damage Scale"
    },
    {
      id: "stim_overdrive",
      name: "NANO-STIM ENHANCER",
      description: "+10 HP / +5 Shield restored on inject and +1 max injector slot.",
      cost: 85,
      maxLevel: 3,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "shield",
      statModifier: "+10 HP / +5 Shield Restored & +1 Max Charge"
    },
    {
      id: "bounty_protocol",
      name: "BOUNTY SYNAPTIC HARVESTER",
      description: "+20% Style points and overall credits gained per level.",
      cost: 110,
      maxLevel: 3,
      currentLevel: 0,
      category: "tactical",
      iconName: "cpu",
      statModifier: "+20% Credits Gain boost"
    },
    {
      id: "magnetic_collector",
      name: "MAGNETIC VACUUM COUPLER",
      description: "+60px item attraction magnet pull distance.",
      cost: 60,
      maxLevel: 4,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "cpu",
      statModifier: "+60px Magnet Attraction Radius"
    },
    {
      id: "hyper_thrusters",
      name: "QUANTUM CHASSIS CATAPULT JET",
      description: "-15% escape Dash cycle cooldown duration.",
      cost: 95,
      maxLevel: 3,
      currentLevel: 0,
      category: "tactical",
      iconName: "zap",
      statModifier: "-15% Dash Cooldown Speed"
    },
    {
      id: "shield_recharge_efficiency",
      name: "PHOTON RECHARGE REGULATOR",
      description: "+40% passive barrier Shield recharging speeds.",
      cost: 70,
      maxLevel: 5,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "shield",
      statModifier: "+40% Passive Shield Regen Speed"
    },
    {
      id: "tau_converter",
      name: "TAU-NEUTRINO CONVERTER",
      description: "+20% Bullet-time slow-mo energy cell recovery speed.",
      cost: 80,
      maxLevel: 4,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "zap",
      statModifier: "+20% Bullet-Time Recharge Rate"
    },
    {
      id: "plasma_katana",
      name: "PLASMA EMITTER ARC OVERCLOCK",
      description: "+12% Energy Katana swipe width and projectile deflection arc.",
      cost: 110,
      maxLevel: 4,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "zap",
      statModifier: "+12% Katana Strike & Deflection Range"
    },
    {
      id: "ammo_scavenger",
      name: "SCRAP RECONVERTER CHIP",
      description: "+8% chance to immediately restore 1 ammo bullet on minor droid kill.",
      cost: 85,
      maxLevel: 5,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "cpu",
      statModifier: "+8% Chance Ammo Replenishment on Kill"
    },
    {
      id: "fortified_plate",
      name: "FORTIFIED ADRENAL PLATING",
      description: "-6% flat reduction on all incoming chassis damages.",
      cost: 130,
      maxLevel: 5,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "shield",
      statModifier: "-6% Incoming Damage Taken"
    },
    {
      id: "critical_eye",
      name: "CRITICAL SYMPATHETIC SENSORS",
      description: "+5% weapon critical strike rating chance.",
      cost: 90,
      maxLevel: 5,
      currentLevel: 0,
      category: "combat",
      iconName: "zap",
      statModifier: "+5% Critical Chance bonus"
    },
    {
      id: "regeneration_matrix",
      name: "BIOMETRIC NANO REGENT MODULE",
      description: "Passive +1 HP restored automatically every 5 seconds.",
      cost: 140,
      maxLevel: 4,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "shield",
      statModifier: "Passive +1 HP / 5 seconds"
    },
    {
      id: "speed_booster",
      name: "HYPERVELOCITY CHASSIS COILS",
      description: "+5% sprint speed and dash slider friction decrease.",
      cost: 60,
      maxLevel: 5,
      currentLevel: 0,
      category: "cybernetic",
      iconName: "zap",
      statModifier: "+5% Movement Speed increase"
    },
    {
      id: "lucky_salvager",
      name: "LUCKY SCRAP COLLECTOR SYSTEM",
      description: "+15% scrap drop yield percentages.",
      cost: 100,
      maxLevel: 4,
      currentLevel: 0,
      category: "tactical",
      iconName: "cpu",
      statModifier: "+15% Material Salvage yield"
    },
    {
      id: "bullet_deflection",
      name: "DEFLECTION KINETIC CAPACITOR",
      description: "+10% deflection angle accuracy on projectile ricochet.",
      cost: 150,
      maxLevel: 3,
      currentLevel: 0,
      category: "combat",
      iconName: "zap",
      statModifier: "+10% Deflector reflection bounds"
    },
    {
      id: "overdrive_matrix",
      name: "KINETIC NOZZLE PRESSURE VALVE",
      description: "+10% shot projectile bullet travel velocity.",
      cost: 110,
      maxLevel: 4,
      currentLevel: 0,
      category: "combat",
      iconName: "zap",
      statModifier: "+10% Projectile velocity"
    }
  ]);

  const handlePurchaseAugment = (u: Upgrade, currentLevel: number) => {
    const pId = AUGMENT_PARENTS[u.id];
    const isParentUnlocked = !pId || (unlockedUpgrades[pId] || 0) > 0;
    if (!isParentUnlocked) {
      cyberAudio.playGlitch();
      return;
    }
    if (credits >= u.cost && currentLevel < u.maxLevel) {
      cyberAudio.playHack();
      onPurchaseUpgrade(u.id, u.cost);
    } else {
      cyberAudio.playGlitch();
    }
  };

  // Craft a weapon using money and collected items
  const handleCraftWeapon = (w: CraftableWeapon) => {
    const parent = getWeaponParent(w);
    const isParentOwned = !parent || ownedWeapons.includes(parent.id);
    if (!isParentOwned) {
      cyberAudio.playGlitch();
      return;
    }
    const meetCredits = credits >= w.creditCost;
    const meetMaterials = Object.entries(w.materialsCost).every(([matKey, amount]) => (materials[matKey] || 0) >= amount);

    if (meetCredits && meetMaterials) {
      cyberAudio.playHack();
      setCredits(prev => prev - w.creditCost);
      setMaterials(prev => {
        const next = { ...prev };
        Object.entries(w.materialsCost).forEach(([matKey, amount]) => {
          next[matKey] = Math.max(0, (next[matKey] || 0) - amount);
        });
        return next;
      });
      setOwnedWeapons(prev => [...prev, w.id]);
      
      // Auto-equip newly crafted weapon to its corresponding slot
      const targetSlot = w.category === "melee" ? 0 : (w.category === "primary" ? 1 : 2);
      handleEquipWeapon(targetSlot, w.id);

      // Migrate any enchantment from parent weapon to the upgraded weapon
      if (parent) {
        setWeaponEnchants(prev => {
          const next = { ...prev };
          if (next[parent.id]) {
            next[w.id] = next[parent.id];
            delete next[parent.id];
          }
          return next;
        });
      }
    } else {
      cyberAudio.playGlitch();
    }
  };

  // Craft an armor set
  const handleCraftArmor = (a: CraftableArmor) => {
    const parent = getArmorParent(a);
    const isParentOwned = !parent || ownedArmors.includes(parent.id);
    if (!isParentOwned) {
      cyberAudio.playGlitch();
      return;
    }
    const meetCredits = credits >= a.creditCost;
    const meetMaterials = Object.entries(a.materialsCost).every(([matKey, amount]) => (materials[matKey] || 0) >= amount);

    if (meetCredits && meetMaterials) {
      cyberAudio.playHack();
      setCredits(prev => prev - a.creditCost);
      setMaterials(prev => {
        const next = { ...prev };
        Object.entries(a.materialsCost).forEach(([matKey, amount]) => {
          next[matKey] = Math.max(0, (next[matKey] || 0) - amount);
        });
        return next;
      });
      setOwnedArmors(prev => [...prev, a.id]);
      setEquippedArmor(a.id); // Auto-equip newly crafted/upgraded armor

      // Migrate any enchantment from parent armor (or starting "none") to the upgraded armor
      setArmorEnchants(prev => {
        const next = { ...prev };
        const sourceKey = parent ? parent.id : "none";
        if (next[sourceKey]) {
          next[a.id] = next[sourceKey];
          delete next[sourceKey];
        } else if (next["none"]) {
          next[a.id] = next["none"];
          delete next["none"];
        }
        return next;
      });
    } else {
      cyberAudio.playGlitch();
    }
  };

  // Execute Chrono codes integration / enchanting
  const handleEnchant = (itemId: string) => {
    if (isEnchanting) return;

    const reagentCount = materials.chrono_reagent || 0;
    if (reagentCount < enchantIntensity) {
      cyberAudio.playGlitch();
      setTerminalLogs([
        "⚠️ SYSTEM CRITICAL SHUTDOWN DETECTED",
        `❌ ERROR: CHRONO REAGENT INSUFFICIENT. REQUESTED: ${enchantIntensity}, CURRENT: ${reagentCount}`,
        "💡 TIP: DEFEAT HIGHER THREAT DRONES OR BOSSES TO SALVAGE CHRONO CODES!"
      ]);
      setRollResult(null);
      return;
    }

    // Spend Reagents
    setIsEnchanting(true);
    setRollResult(null);
    setTerminalLogs([
      "⚡ CHRONO CODE INTEGRATOR CONNECTED...",
      `🔌 INJECTING ${enchantIntensity} REAGENT PROTOCOLS...`
    ]);

    // Stage logs
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, "🧬 DISASSEMBLING SUB-ATOMIC STAT ALIGNMENTS... [OK]"]);
    }, 500);

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, "💾 QUERYING QUANTUM COMBAT DICTIONARIES... [OK]"]);
    }, 1000);

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, "🔮 CONVERGING MATRIX CHUNKS. GENERATING RE-STRUCTURE FIELD..."]);
    }, 1500);

    setTimeout(() => {
      // Determine enchantment details
      let statPool: string[] = [];
      if (enchantItemType === "weapon") {
        const weaponDetails = WEAPONS_CATALOG.find((w) => w.id === itemId);
        const isInfiniteAmmo = itemId === "katana" || (weaponDetails && (weaponDetails.category === "melee" || weaponDetails.type === "katana" || weaponDetails.ammo >= 999));
        if (isInfiniteAmmo) {
          statPool = ["Damage", "Critical", "Cooldown"];
        } else {
          statPool = ["Damage", "Critical", "Cooldown", "Capacity"];
        }
      } else {
        statPool = ["Protection", "Barrier", "Vitality"];
      }

      // Random picker for stat type
      const selectedStat = statPool[Math.floor(Math.random() * statPool.length)];

      // Random picker for roman numeral tier based on intensity
      let tier = "I";
      const rollValue = Math.random();
      if (enchantIntensity === 1) {
        tier = rollValue < 0.7 ? "I" : "II";
      } else if (enchantIntensity === 2) {
        tier = rollValue < 0.65 ? "II" : "III";
      } else if (enchantIntensity === 3) {
        if (rollValue < 0.5) tier = "III";
        else if (rollValue < 0.85) tier = "IV";
        else tier = "V";
      }

      const outcome = `${selectedStat} ${tier}`;

      // Deduct materials
      setMaterials(prev => ({
        ...prev,
        chrono_reagent: Math.max(0, (prev.chrono_reagent || 0) - enchantIntensity)
      }));

      // Update state
      if (enchantItemType === "weapon") {
        setWeaponEnchants(prev => ({
          ...prev,
          [itemId]: outcome
        }));
      } else {
        setArmorEnchants(prev => ({
          ...prev,
          [itemId]: outcome
        }));
      }

      // Save roll details
      setRollResult(outcome);
      setTerminalLogs(prev => [
        ...prev,
        `✅ SUCCESS! CHRONO RECONSTITUTION PROTOCOL LINKED:`,
        `👉 ENCHANTMENT ESTABLISHED: ${outcome.toUpperCase()}! ⚡`,
        "SYSTEM CYCLE COMPLETED."
      ]);
      setIsEnchanting(false);
      cyberAudio.playHack();
    }, 2000);
  };

  // Equip weapon to a specific designated Slot
  const handleEquipWeapon = (slotIndex: number, weaponId: string | null) => {
    cyberAudio.playHack();
    if (weaponId && !ownedWeapons.includes(weaponId)) {
      setOwnedWeapons(prev => [...prev, weaponId]);
    }
    setEquippedWeapons(prev => {
      const next = [...prev];
      next[slotIndex] = weaponId;
      return next;
    });
  };

  // Equip armor
  const handleEquipArmor = (armorId: string) => {
    cyberAudio.playHack();
    setEquippedArmor(armorId);

    // If they had an enchantment on "none" and are equipping a different armor, migrate the enchantment so progress persists!
    if (armorId !== "none") {
      setArmorEnchants(prev => {
        const next = { ...prev };
        if (next["none"]) {
          next[armorId] = next["none"];
          delete next["none"];
        }
        return next;
      });
    }
  };

  const getIcon = (iconName: string) => {
    if (iconName === "cpu") return <Cpu className="text-emerald-400" size={20} />;
    if (iconName === "shield") return <Shield className="text-sky-400" size={20} />;
    return <Zap className="text-violet-400" size={20} />;
  };

  const getUpgradeRarity = (id: string): "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "CELESTIAL" => {
    switch (id) {
      case "cyber_core":
      case "combat_overdrive":
      case "bullet_time_cap":
        return "COMMON";
      case "nano_skin":
      case "stim_overdrive":
      case "speed_booster":
      case "magnetic_collector":
        return "UNCOMMON";
      case "fortified_plate":
      case "overdrive_matrix":
      case "tau_converter":
      case "ammo_scavenger":
      case "shield_recharge_efficiency":
        return "RARE";
      case "shading_field":
      case "plasma_katana":
      case "regeneration_matrix":
        return "EPIC";
      case "critical_eye":
      case "hyper_thrusters":
      case "bounty_protocol":
        return "LEGENDARY";
      case "bullet_deflection":
      case "lucky_salvager":
        return "MYTHIC";
      default:
        return "COMMON";
    }
  };

  const renderAugmentNode = (u: Upgrade) => {
    const lvl = unlockedUpgrades[u.id] || 0;
    const isMaxed = lvl >= u.maxLevel;
    const isAffordable = credits >= u.cost;
    
    const parentId = AUGMENT_PARENTS[u.id];
    const parentUpgrade = parentId ? upgradesList.find(x => x.id === parentId) : null;
    const isParentUnlocked = !parentId || (unlockedUpgrades[parentId] || 0) > 0;
    
    const isSelected = selectedUpgradeId === u.id;
    const rarity = getUpgradeRarity(u.id);
    
    const design = getNodeBorderAndGlow(rarity, lvl > 0, isParentUnlocked, isSelected);
    const pos = AUGMENT_TREE_POSITIONS[u.id] || { x: 50, y: 50 };
    const isBottomHalf = pos.y > 50;

    return (
      <div 
        key={u.id}
        className={`relative flex flex-col items-center group ${isSelected ? "z-[150]" : "z-10"}`}
        style={{ zIndex: isSelected ? 150 : 10 }}
      >
        <button
          id={`node-upgrade-${u.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUpgradeId(isSelected ? null : u.id);
            cyberAudio.playHack();
          }}
          className={`w-11 h-11 rounded flex items-center justify-center border transition-all cursor-pointer relative select-none ${design.nodeClass}`}
          style={design.style || {}}
          title={u.name}
        >
          {getIcon(u.iconName)}
          
          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
            {isMaxed ? (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 block" style={{ boxShadow: "0 0 4px #00f3ff" }} />
            ) : lvl > 0 ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
            ) : isParentUnlocked ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse block" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800 block" />
            )}
          </div>
        </button>

        {/* Floating details and Purchase options beneath the node when selected */}
        {isSelected && (
          <div 
            className={`absolute z-40 w-56 sm:w-64 p-3 bg-[#030712]/98 border rounded-md text-left text-[10px] font-mono leading-relaxed transition-all duration-200 pointer-events-auto flex flex-col gap-1.5 left-1/2 -translate-x-1/2 ${
              isBottomHalf ? "bottom-full mb-2.5" : "top-full mt-2.5"
            }`}
            style={{ 
              borderColor: design.color, 
              boxShadow: `0 0 20px ${design.color}35`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Arrow Indicator pointing to the node */}
            {isBottomHalf ? (
              <div 
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]" 
                style={{ borderTopColor: design.color }}
              />
            ) : (
              <div 
                className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px]" 
                style={{ borderBottomColor: design.color }}
              />
            )}

            <div className="flex items-center justify-between gap-2 border-b pb-1.5" style={{ borderBottomColor: `${design.color}25` }}>
              <span className="font-extrabold text-[#f1f1f1] uppercase text-[9px]/none tracking-wider truncate max-w-[155px]">
                {u.name}
              </span>
              <span 
                className="text-[7px] px-1.5 py-0.5 rounded border font-black shrink-0"
                style={{ 
                  backgroundColor: `${design.color}12`, 
                  color: design.color, 
                  borderColor: `${design.color}25` 
                }}
              >
                {rarity}
              </span>
            </div>

            <p className="text-slate-400 italic text-[9px]/relaxed font-sans font-medium pl-0.5">
              "{u.description}"
            </p>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-slate-900/40 pt-1.5 text-[8px] text-slate-500">
              <div>
                <span>LEVEL: </span>
                <span className="font-extrabold text-white">{lvl} / {u.maxLevel}</span>
              </div>
              <div>
                <span>CHIP TYPE: </span>
                <span className="font-extrabold text-[#c084fc] uppercase">{u.category}</span>
              </div>
            </div>

            <div className="mt-1 border-t border-slate-900/40 pt-1.5 text-[8px] text-slate-400">
              <span className="text-slate-500 block text-[7.5px] font-black uppercase">STAT MODIFIER EFFICIENCY:</span>
              <span className="font-extrabold" style={{ color: design.color }}>{u.statModifier}</span>
            </div>

            <div className="mt-1 border-t border-slate-900/40 pt-1.5 flex flex-col gap-1">
              {!isParentUnlocked && parentUpgrade ? (
                <div className="flex items-center gap-1 text-[7.5px] text-rose-500 font-bold uppercase justify-center bg-[#130303]/40 py-1 rounded border border-rose-950/20">
                  <Lock size={10} /> LOCK: REQUIRES {parentUpgrade.name} LVL 1+
                </div>
              ) : isMaxed ? (
                <div className="flex items-center gap-1 text-[8px] text-cyan-400 font-extrabold uppercase justify-center bg-cyan-950/10 py-1 rounded border border-[#00f3ff]/20">
                  <Check size={10} className="stroke-[3px]" /> CHIP MAX OUT
                </div>
              ) : (
                <button
                  onClick={() => {
                    handlePurchaseAugment(u, lvl);
                  }}
                  disabled={!isAffordable}
                  className={`w-full py-1 rounded font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    isAffordable
                      ? "bg-gradient-to-r text-black font-extrabold hover:brightness-110 active:scale-98 cursor-pointer shadow-md"
                      : "bg-slate-900/60 text-slate-600 border border-slate-950 cursor-not-allowed"
                  }`}
                  style={isAffordable ? {
                    backgroundImage: `linear-gradient(135deg, ${design.color}, #ffffff)`,
                    boxShadow: `0 0 8px ${design.color}30`
                  } : {}}
                >
                  UPGRADE CHIP — {u.cost} ₩
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] text-[#00f3ff] font-mono p-4 md:p-8 flex flex-col justify-between overflow-hidden border-8 border-[#0a0a12]">
      
      {/* Cyber scan lines */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,243,255,0.01),rgba(255,0,85,0.01))] bg-[length:100%_4px,3px_100%] opacity-60" />

      {/* Corporate Matrix Header */}
      <header className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#00f3ff]/20 pb-4 max-w-6xl w-full self-center">
        <div className="flex items-center gap-3 bg-[#00f3ff]/10 px-4 py-2 border-l-2 border-[#00f3ff] select-none">
          <div className="w-2.5 h-2.5 bg-[#00f3ff] rounded-sm animate-pulse" />
          <h2 className="text-md md:text-lg font-black tracking-widest text-[#00f3ff] uppercase italic">
            CHASSIS VECTOR FORGE
          </h2>
        </div>

        {/* Dynamic Materials Inventory Display */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-[#ff0055]/10 border-r-2 border-[#ff0055] px-4 py-1.5 rounded text-xs text-[#ff0055] font-black tracking-widest whitespace-nowrap">
            CREDITS: {credits} ₩
          </div>

          <button
            onClick={onClose}
            id="close-upgrades-btn"
            className="p-1.5 hover:bg-slate-900 border border-[#00f3ff]/20 rounded-full cursor-pointer transition-colors text-white"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Cyber Category Selection Tabs Sub-header */}
      <section className="relative z-20 flex justify-center gap-2 max-w-6xl w-full self-center my-3 border-b border-slate-900 pb-2">
        <button
          onClick={() => changeTab("upgrades")}
          className={`px-4 py-2 text-xs font-black tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "upgrades"
              ? "bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30 shadow-[0_0_12px_rgba(0,243,255,0.1)]"
              : "text-slate-500 border border-transparent hover:text-slate-300"
          }`}
        >
          <Cpu size={14} /> 1. SYSTEM AUGMENTS
        </button>

        <button
          onClick={() => changeTab("weapons")}
          className={`px-4 py-2 text-xs font-black tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "weapons"
              ? "bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30 shadow-[0_0_12px_rgba(251,191,36,0.1)]"
              : "text-slate-500 border border-transparent hover:text-slate-300"
          }`}
        >
          <Swords size={14} /> 2. WEAPONS SPECIFICATION
        </button>

        <button
          onClick={() => changeTab("armor")}
          className={`px-4 py-2 text-xs font-black tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "armor"
              ? "bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 shadow-[0_0_12px_rgba(236,72,153,0.1)]"
              : "text-slate-500 border border-transparent hover:text-slate-300"
          }`}
        >
          <Shield size={14} /> 3. CHASSIS ARMOR PLATING
        </button>

        <button
          onClick={() => changeTab("enchants")}
          className={`px-4 py-2 text-xs font-black tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "enchants"
              ? "bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/30 shadow-[0_0_12px_rgba(167,139,250,0.1)]"
              : "text-slate-500 border border-transparent hover:text-slate-300"
          }`}
        >
          <Sparkles size={14} className="text-[#a78bfa]" /> 4. CHRONO ENCHANT RESO
        </button>

        <button
          onClick={() => changeTab("inventory")}
          className={`px-4 py-2 text-xs font-black tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "inventory"
              ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
              : "text-slate-500 border border-transparent hover:text-slate-300"
          }`}
        >
          <Package size={14} className="text-[#10b981]" /> 5. SYSTEM INVENTORY
        </button>

        <button
          onClick={() => changeTab("prestige")}
          className={`px-4 py-2 text-xs font-black tracking-wider rounded transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "prestige"
              ? "bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              : "text-slate-500 border border-transparent hover:text-slate-300"
          }`}
        >
          <Layers size={14} className="text-amber-500" /> 6. TIMELINE ASCENSION
        </button>
      </section>

      {/* CORE MATRIX TAB CONTENTS */}
      <main className="relative z-20 flex-1 overflow-y-auto max-w-6xl w-full self-center py-2 pr-1.5">
        
        {/* Tab 1: SYSTEM AUGMENTS */}
        {activeTab === "upgrades" && (
          <div 
            onClick={() => setSelectedUpgradeId(null)}
            className="flex flex-col gap-5 pr-1 cursor-default min-h-[640px] w-full"
          >
            {/* Header description block */}
            <div className="bg-[#05060d]/90 p-4 rounded-lg border border-cyan-500/10 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
              <div className="flex justify-between items-center pb-2 mb-1 border-b border-cyan-500/5">
                <div>
                  <h4 className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest">
                    ⚡ NEURAL COGNITIVE DEEP NODE LINK
                  </h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide font-mono">
                    All mainframe processes combined in a single integrated cybernetic cyber-system matrix board.
                  </p>
                </div>
                <div className="flex gap-2 text-[8px] font-mono font-bold">
                  <span className="bg-cyan-900/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 uppercase">
                    CYBERNETIC [CYAN]
                  </span>
                  <span className="bg-rose-900/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 uppercase">
                    COMBAT [ROSE]
                  </span>
                  <span className="bg-amber-900/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                    TACTICAL [AMBER]
                  </span>
                </div>
              </div>
            </div>

            {/* Tree Map Display */}
            <div className="w-full bg-slate-950/70 p-4 rounded border border-slate-900 select-none font-mono text-xs flex flex-col min-h-[630px]">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
                <div>
                  <h4 className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">🛠️ UNIFIED INTEGRATED MOTHERBOARD</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Select any link node to download or overlay system level protocols</p>
                </div>
                <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 uppercase font-black font-mono">PRIMARY LINKING SCHEME</span>
              </div>

              {/* The big relative grid container */}
              <div 
                onClick={() => setSelectedUpgradeId(null)}
                className="flex-1 relative w-full h-[520px] bg-slate-950/40 border border-slate-900 rounded select-none cursor-crosshair"
              >
                {/* SVG Connections behind */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {(() => {
                    return Object.entries(AUGMENT_PARENTS).map(([childId, parentId]) => {
                      const pPos = AUGMENT_TREE_POSITIONS[parentId];
                      const cPos = AUGMENT_TREE_POSITIONS[childId];
                      if (!pPos || !cPos) return null;

                      // Find levels
                      const pLvl = unlockedUpgrades[parentId] || 0;
                      const cLvl = unlockedUpgrades[childId] || 0;
                      const isLineActive = pLvl > 0 || cLvl > 0;

                      // Determine stroke color by category of child upgrade
                      const childUpgrade = upgradesList.find(x => x.id === childId);
                      let strokeColor = "#334155"; // locked gray
                      if (isLineActive) {
                        if (childUpgrade?.category === "cybernetic") {
                          strokeColor = "#06b6d4"; // cyan
                        } else if (childUpgrade?.category === "combat") {
                          strokeColor = "#ec4899"; // pink/rose
                        } else {
                          strokeColor = "#f59e0b"; // amber
                        }
                      }

                      return (
                        <path 
                          key={`link-${childId}`}
                          d={getSymmetricTreePath(pPos, cPos)}
                          fill="none"
                          stroke={strokeColor}
                          vectorEffect="non-scaling-stroke"
                          style={{ strokeWidth: "3px" }}
                          strokeOpacity={isLineActive ? "0.95" : "0.75"}
                          strokeDasharray={pLvl === 0 ? "1 1.2" : undefined}
                          className={isLineActive ? "animate-[pulse_2.5s_infinite]" : ""}
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Nodes absolute positioned */}
                {upgradesList.map((item) => {
                  const pos = AUGMENT_TREE_POSITIONS[item.id];
                  if (!pos) return null;

                  return (
                    <div 
                      key={item.id} 
                      style={{ 
                        position: "absolute", 
                        left: `${pos.x}%`, 
                        top: `${pos.y}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: selectedUpgradeId === item.id ? 150 : 10
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderAugmentNode(item)}
                    </div>
                  );
                })}
              </div>
              <div className="h-[20px]" />
            </div>
          </div>
        )}

        {/* Tab 2: WEAPONS ARMORY & HOTBAR CONFIGURATION */}
        {activeTab === "weapons" && (
          <div className="flex flex-col gap-5">
            
            {/* 3-SLOT ACTIVE COMBAT HOTBAR CONFIGURATION */}
            <div className="bg-[#05060b] p-4 rounded border-2 border-[#fbbf24]/30">
              <h3 className="text-xs font-black text-[#fbbf24] tracking-[0.2em] mb-3 uppercase flex items-center gap-2">
                ⌨️ ACTIVE COMBAT HUD HOTBAR (3 SLOTS MAXIMUM LOADOUT)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* SLOT 1: MELEE WEAPON ONLY */}
                <div className="bg-slate-950 p-3 rounded border border-slate-900 flex flex-col justify-between gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-[#fbbf24] font-black tracking-widest">SLOT 1 • MELEE TYPE</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">HOTKEY [1]</span>
                  </div>

                  <div className="py-2 px-3 bg-black border border-slate-900 rounded font-semibold text-xs flex justify-between items-center text-white">
                    {equippedWeapons[0] ? (
                      <span className="font-extrabold flex items-center gap-1.5" style={{ color: WEAPONS_CATALOG.find(w => w.id === equippedWeapons[0])?.color || "#ffffff" }}>
                        {(() => {
                          const wObj = WEAPONS_CATALOG.find(w => w.id === equippedWeapons[0]);
                          return wObj ? getWeaponIcon(wObj) : null;
                        })()}
                        {WEAPONS_CATALOG.find(w => w.id === equippedWeapons[0])?.name || equippedWeapons[0]}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">EMPTY HANDED</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">SELECT MELEE AUGMENT:</span>
                    <select
                      value={equippedWeapons[0] || ""}
                      onChange={(e) => handleEquipWeapon(0, e.target.value || null)}
                      className="bg-slate-950 text-slate-300 border border-slate-900 hover:border-slate-800 rounded p-1.5 text-[10px] uppercase font-bold outline-none"
                    >
                      {WEAPONS_CATALOG.filter(w => w.category === "melee" && ownedWeapons.includes(w.id)).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SLOT 2: PRIMARY WEAPON ONLY */}
                <div className="bg-slate-950 p-3 rounded border border-slate-900 flex flex-col justify-between gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-[#fbbf24] font-black tracking-widest">SLOT 2 • PRIMARY TYPE</span>
                    <span className="text-[8px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20 font-bold uppercase">HOTKEY [2]</span>
                  </div>

                  <div className="py-2 px-3 bg-black border border-slate-900 rounded font-semibold text-xs flex justify-between items-center text-white">
                    {equippedWeapons[1] ? (
                      <span className="font-extrabold flex items-center gap-1.5" style={{ color: WEAPONS_CATALOG.find(w => w.id === equippedWeapons[1])?.color || "#ffffff" }}>
                        {(() => {
                          const wObj = WEAPONS_CATALOG.find(w => w.id === equippedWeapons[1]);
                          return wObj ? getWeaponIcon(wObj) : null;
                        })()}
                        {WEAPONS_CATALOG.find(w => w.id === equippedWeapons[1])?.name || equippedWeapons[1]}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">EMPTY HANDED</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">SELECT PRIMARY WEAPON:</span>
                    <select
                      value={equippedWeapons[1] || ""}
                      onChange={(e) => handleEquipWeapon(1, e.target.value || null)}
                      className="bg-slate-950 text-slate-300 border border-slate-900 hover:border-slate-800 rounded p-1.5 text-[10px] uppercase font-bold outline-none"
                    >
                      <option value="">-- UN-EQUIP --</option>
                      {WEAPONS_CATALOG.filter(w => w.category === "primary" && ownedWeapons.includes(w.id)).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SLOT 3: SECONDARY WEAPON ONLY */}
                <div className="bg-slate-950 p-3 rounded border border-slate-900 flex flex-col justify-between gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-[#fbbf24] font-black tracking-widest">SLOT 3 • SECONDARY TYPE</span>
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase">HOTKEY [3]</span>
                  </div>

                  <div className="py-2 px-3 bg-black border border-slate-900 rounded font-semibold text-xs flex justify-between items-center text-white">
                    {equippedWeapons[2] ? (
                      <span className="font-extrabold flex items-center gap-1.5" style={{ color: WEAPONS_CATALOG.find(w => w.id === equippedWeapons[2])?.color || "#ffffff" }}>
                        {(() => {
                          const wObj = WEAPONS_CATALOG.find(w => w.id === equippedWeapons[2]);
                          return wObj ? getWeaponIcon(wObj) : null;
                        })()}
                        {WEAPONS_CATALOG.find(w => w.id === equippedWeapons[2])?.name || equippedWeapons[2]}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">EMPTY (SLOT AVAILABEL)</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">SELECT SECONDARY WEAPON:</span>
                    <select
                      value={equippedWeapons[2] || ""}
                      onChange={(e) => handleEquipWeapon(2, e.target.value || null)}
                      className="bg-slate-950 text-slate-300 border border-slate-900 hover:border-slate-800 rounded p-1.5 text-[10px] uppercase font-bold outline-none"
                    >
                      <option value="">-- EMPTY SLOT --</option>
                      {WEAPONS_CATALOG.filter(w => w.category === "secondary" && ownedWeapons.includes(w.id)).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* SUB-CATEGORY PANEL */}
            <div className="bg-[#05060b]/90 p-3.5 rounded border border-slate-900 flex justify-center sm:justify-start gap-3">
              <div className="flex bg-black p-1 rounded border border-slate-800 gap-1 select-none">
                {(["melee", "primary", "secondary"] as const).map(cat => {
                  const itemsCount = WEAPONS_CATALOG.filter(w => w.category === cat).length;
                  const ownedCount = WEAPONS_CATALOG.filter(w => w.category === cat && ownedWeapons.includes(w.id)).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setWeaponCategory(cat); cyberAudio.playHack(); }}
                      className={`px-3 py-1 rounded font-black uppercase cursor-pointer text-[10px] transition-all ${weaponCategory === cat ? "bg-[#fbbf24] text-black" : "text-slate-500 hover:text-white"}`}
                    >
                      {cat} ({ownedCount}/{itemsCount})
                    </button>
                  );
                })}
              </div>
            </div>
            {weaponSort === "tree" ? (
              <div className="w-full">
                {/* Visual Connected Tree */}
                <div className="w-full bg-slate-950/70 p-4 rounded border border-slate-900 select-none font-mono text-xs flex flex-col min-h-[600px]">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
                    <div>
                      <h4 className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">🛠️ SCHEMATIC COGNITIVE MAP</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Select a blueprint node to inspect & materialize</p>
                    </div>
                    <span className="text-[8px] bg-[#fbbf24]/10 text-[#fbbf24] px-1.5 py-0.5 rounded border border-[#fbbf24]/20 uppercase font-black font-mono">TERTIARY STRUCT</span>
                  </div>

                  <div className="w-full overflow-x-auto overflow-y-hidden border border-slate-900 rounded bg-slate-950/40 scrollbar-thin">
                    <div 
                      onClick={() => setSelectedWeaponId(null)}
                      className="relative min-w-[950px] h-[520px] select-none cursor-crosshair"
                    >
                    {/* SVG Connections behind the scenes */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {(() => {
                        const catWeapons = WEAPONS_CATALOG.filter(w => w.category === weaponCategory);
                        return WEAPON_TREE_CONNECTIONS.map(([parentIdx, childIdx], index) => {
                          const pNode = catWeapons[parentIdx];
                          const cNode = catWeapons[childIdx];
                          if (!pNode || !cNode) return null;
                          
                          const pPos = WEAPON_TREE_POSITIONS[parentIdx];
                          const cPos = WEAPON_TREE_POSITIONS[childIdx];
                          if (!pPos || !cPos) return null;

                          const isParentOwned = ownedWeapons.includes(pNode.id);
                          const isChildOwned = ownedWeapons.includes(cNode.id);
                          const isLineActive = isParentOwned || isChildOwned;

                          return (
                            <path 
                              key={index}
                              d={getSymmetricTreePath(pPos, cPos)}
                              fill="none"
                              stroke={isLineActive ? "#fbbf24" : "#475569"}
                              vectorEffect="non-scaling-stroke"
                              style={{ strokeWidth: "3px" }}
                              strokeOpacity={isLineActive ? "0.95" : "0.75"}
                              strokeDasharray={!isParentOwned ? "1 1.2" : undefined}
                              className={isLineActive ? "animate-[pulse_2.5s_infinite]" : ""}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Nodes absolute positioned */}
                    {(() => {
                      const catWeapons = WEAPONS_CATALOG.filter(w => w.category === weaponCategory);
                      const activeWeaponId = selectedWeaponId;
                      
                      return catWeapons.map((item, index) => {
                        const pos = WEAPON_TREE_POSITIONS[index];
                        if (!pos) return null;

                        const isOwned = ownedWeapons.includes(item.id);
                        const isSelected = item.id === activeWeaponId;
                        const parent = getWeaponParent(item);
                        const isParentOwned = !parent || ownedWeapons.includes(parent.id);

                        const meetCredits = credits >= item.creditCost;
                        const meetMaterials = Object.entries(item.materialsCost).every(([matKey, amount]) => (materials[matKey] || 0) >= amount);

                        const design = getNodeBorderAndGlow(item.rank, isOwned, isParentOwned, isSelected);
                        const isBottomHalf = pos.y > 50;

                        return (
                          <div 
                            key={item.id} 
                            style={{ 
                              position: "absolute", 
                              left: `${pos.x}%`, 
                              top: `${pos.y}%`,
                              transform: "translate(-50%, -50%)",
                              zIndex: isSelected ? 150 : 10
                            }}
                            className={`flex flex-col items-center group ${isSelected ? "z-[150]" : "z-10"}`}
                          >
                            <button
                              id={`node-weapon-${item.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWeaponId(isSelected ? null : item.id);
                                cyberAudio.playHack();
                              }}
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded flex flex-col items-center justify-center border transition-all cursor-pointer select-none relative ${design.nodeClass}`}
                              style={design.style || {}}
                              title={item.name}
                            >
                              {getWeaponIcon(item)}
                              
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                                {isOwned ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                                ) : isParentOwned ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse block" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800 block" />
                                )}
                              </div>
                            </button>

                            {/* Floating details shown beside the icon when selected */}
                            {isSelected && (
                              <div 
                                className={`absolute z-[200] w-64 sm:w-72 p-3 bg-[#030712]/98 border rounded-md text-left text-[10px] font-mono leading-relaxed transition-all duration-200 pointer-events-auto flex flex-col gap-1.5 ${
                                  isBottomHalf
                                    ? (pos.x < 50 ? "left-full ml-3 bottom-[-16px]" : "right-full mr-3 bottom-[-16px]")
                                    : (pos.x < 50 ? "left-full ml-3 top-1/2 -translate-y-1/2" : "right-full mr-3 top-1/2 -translate-y-1/2")
                                } shadow-[0_8px_32px_rgba(0,0,0,0.85)]`}
                                style={{
                                  borderColor: design.color,
                                  boxShadow: `0 0 25px ${design.color}45`
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Floating Arrow indicators */}
                                <div className={`absolute w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ${
                                  isBottomHalf ? "bottom-[18px]" : "top-1/2 -translate-y-1/2"
                                } ${
                                  pos.x < 50 ? "right-full border-r-[6px]" : "left-full border-l-[6px]"
                                }`} 
                                  style={pos.x < 50 ? { borderRightColor: design.color } : { borderLeftColor: design.color }}
                                />

                                <div className="flex items-center justify-between gap-2 border-b pb-1.5" style={{ borderBottomColor: `${design.color}25` }}>
                                  <span className="font-extrabold text-[#f1f1f1] uppercase text-[9.5px]/none tracking-wider truncate max-w-[195px]">
                                    {item.name}
                                  </span>
                                </div>

                                <p className="text-slate-400 italic text-[9px]/relaxed font-sans font-medium pl-0.5">
                                  "{item.desc}"
                                </p>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-slate-900/50 pt-1.5 text-[8px] text-slate-500 font-mono">
                                  <div>
                                    <span>DMG: </span>
                                    <span className="font-extrabold text-rose-450">{item.damage}</span>
                                  </div>
                                  <div>
                                    <span>RANGE: </span>
                                    <span className="font-extrabold text-blue-400">{item.range}PX</span>
                                  </div>
                                  <div>
                                    <span>RATE: </span>
                                    <span className="font-extrabold text-[#c084fc]">{item.fireRate}MS</span>
                                  </div>
                                  <div>
                                    <span>QUANT: </span>
                                    <span className="font-extrabold text-amber-500">{item.ammo === 999 ? "∞" : item.ammo}</span>
                                  </div>
                                </div>

                                <div className="mt-1 border-t border-slate-900/50 pt-1.5 flex flex-col gap-1">
                                  {isOwned ? (
                                    <div className="flex flex-col gap-1 bg-slate-950 p-1.5 rounded border border-slate-900/60">
                                      <div className="flex items-center gap-1 text-[8px] text-emerald-400 font-extrabold uppercase justify-center bg-emerald-950/20 py-0.5 rounded border border-emerald-900/35">
                                        <Check size={10} className="stroke-[3px]" /> FABRICATED LICENSE ACTIVE
                                      </div>
                                      {item.category === "melee" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEquipWeapon(0, item.id);
                                          }}
                                          className={`w-full py-1 text-[8px] font-bold rounded cursor-pointer transition-all ${
                                            equippedWeapons[0] === item.id
                                              ? "bg-[#10b981] text-black font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse"
                                              : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                                          }`}
                                        >
                                          {equippedWeapons[0] === item.id ? "✓ EQUIPPED SLOT 1" : "EQUIP SLOT 1 [MELEE]"}
                                        </button>
                                      )}
                                      {item.category === "primary" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEquipWeapon(1, item.id);
                                          }}
                                          className={`w-full py-1 text-[8px] font-bold rounded cursor-pointer transition-all ${
                                            equippedWeapons[1] === item.id
                                              ? "bg-[#10b981] text-black font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse"
                                              : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                                          }`}
                                        >
                                          {equippedWeapons[1] === item.id ? "✓ EQUIPPED SLOT 2" : "EQUIP SLOT 2 [PRIMARY]"}
                                        </button>
                                      )}
                                      {item.category === "secondary" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEquipWeapon(2, item.id);
                                          }}
                                          className={`w-full py-1 text-[8px] font-bold rounded cursor-pointer transition-all ${
                                            equippedWeapons[2] === item.id
                                              ? "bg-[#10b981] text-black font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse"
                                              : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                                          }`}
                                        >
                                          {equippedWeapons[2] === item.id ? "✓ EQUIPPED SLOT 3" : "EQUIP SLOT 3 [SECONDARY]"}
                                        </button>
                                      )}
                                    </div>
                                  ) : isParentOwned ? (
                                    <div className="bg-slate-950 p-1.5 rounded border border-slate-900 flex flex-col gap-1">
                                      <div className="flex flex-wrap gap-1 text-[7.5px] uppercase text-slate-400">
                                        {Object.entries(item.materialsCost).map(([matKey, amount]) => {
                                          const info = MATERIAL_INFO[matKey] || { name: matKey.toUpperCase(), icon: "📦" };
                                          const playerQty = materials[matKey] || 0;
                                          const meet = playerQty >= amount;
                                          return (
                                            <span
                                              key={matKey}
                                              className={`flex items-center gap-0.5 font-bold ${meet ? "text-emerald-400" : "text-rose-500 line-through opacity-70"}`}
                                            >
                                              {info.icon} {playerQty}/{amount}
                                            </span>
                                          );
                                        })}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCraftWeapon(item);
                                        }}
                                        disabled={!meetCredits || !meetMaterials}
                                        className={`w-full py-1 rounded text-[8.5px] font-black uppercase text-center transition-all ${
                                          meetCredits && meetMaterials
                                            ? "bg-amber-500 text-black hover:bg-amber-400"
                                            : "bg-slate-900/60 text-slate-650 cursor-not-allowed border border-slate-950"
                                        }`}
                                      >
                                        FABRICATE: {item.creditCost} ₩
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-[8px] text-rose-500 font-bold uppercase justify-center bg-rose-950/20 py-1 rounded border border-rose-950/35">
                                      <Lock size={10} /> SCHEMA LOCKED
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      });
                    })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WEAPONS_CATALOG
                  .filter(w => w.category === weaponCategory)
                  .sort((a, b) => {
                    if (weaponSort === "owned") {
                      const aOwned = ownedWeapons.includes(a.id);
                      const bOwned = ownedWeapons.includes(b.id);
                      if (aOwned && !bOwned) return -1;
                      if (!aOwned && bOwned) return 1;
                      return a.damage - b.damage; // Owned first, then weakest to strongest
                    } else if (weaponSort === "weakest") {
                      return a.damage - b.damage;
                    } else {
                      return b.damage - a.damage;
                    }
                  })
                  .map((w) => {
                    const isOwned = ownedWeapons.includes(w.id);
                    
                    // Recipe verification
                    const meetCredits = credits >= w.creditCost;
                    const meetMaterials = Object.entries(w.materialsCost).every(([matKey, amount]) => (materials[matKey] || 0) >= amount);
                    const canCraft = meetCredits && meetMaterials;

                    return (
                      <div
                        key={w.id}
                        className={`flex flex-col justify-between p-4 rounded border transition-all ${
                          isOwned
                            ? "bg-[#0b131a]/40 border-sky-950 text-slate-400"
                            : canCraft
                              ? "bg-[#020205] border-[#fbbf24]/20 hover:border-[#fbbf24]/60 text-slate-300 hover:shadow-[0_0_15px_rgba(251,191,36,0.05)]"
                              : "bg-[#050508]/60 border-slate-950 text-slate-500"
                        }`}
                      >
                        <div>
                          {/* Weapon header tags */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-1.5 h-6 rounded"
                                style={{ backgroundColor: w.color }}
                              />
                              <div>
                                <h4 className="font-extrabold text-[#f1f1f1] uppercase tracking-wide text-[11px] md:text-xs">
                                  {w.name}
                                </h4>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                                  RANGE CLASS: {w.type} / {w.category}
                                </span>
                              </div>
                            </div>

                            {isOwned ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/25 rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                                  ✓ LICENSED
                                </span>
                                {weaponEnchants && weaponEnchants[w.id] && (
                                  <span className="bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-widest animate-pulse flex items-center gap-0.5">
                                    🔮 {weaponEnchants[w.id]}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-2 py-0.5 text-[8px] font-bold uppercase">
                                ⚒ UNFABRICATED
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed mb-3 pl-3.5">
                            {w.desc}
                          </p>

                          {/* Weapon parameters stats */}
                          <div className="grid grid-cols-4 gap-1.5 border-y border-slate-900 py-2.5 my-2.5 text-center font-mono text-[9px] text-slate-400 pl-3.5">
                            <div className="bg-[#05050a] py-1 rounded border border-slate-900">
                              <span className="text-[7.5px] text-slate-600 font-bold block">DAMAGE:</span>
                              <span className="text-rose-500 font-black">{w.damage}</span>
                            </div>
                            <div className="bg-[#05050a] py-1 rounded border border-slate-900">
                              <span className="text-[7.5px] text-slate-600 font-bold block">RANGE:</span>
                              <span className="text-blue-400 font-black">{w.range}px</span>
                            </div>
                            <div className="bg-[#05050a] py-1 rounded border border-slate-900">
                              <span className="text-[7.5px] text-slate-600 font-bold block">COOLDOWN:</span>
                              <span className="text-violet-400 font-black">{w.fireRate}ms</span>
                            </div>
                            <div className="bg-[#05050a] py-1 rounded border border-slate-900">
                              <span className="text-[7.5px] text-slate-600 font-bold block">CAPACITY:</span>
                              <span className="text-amber-400 font-black">{w.ammo === 999 ? "∞ INF" : `${w.ammo}`}</span>
                            </div>
                          </div>
                        </div>

                        {/* Requirements / Actions row */}
                        {!isOwned ? (
                          <div className="bg-slate-950 p-2 rounded border border-slate-900 flex justify-between items-center mt-2 flex-wrap gap-2">
                            <div className="text-left leading-tight text-[8.5px] w-full sm:w-auto">
                              <span className="text-slate-550 font-black block uppercase text-[8px]">REQUIRED COMPONENT SHARDS:</span>
                              <div className="flex flex-wrap gap-2 mt-1 uppercase whitespace-nowrap">
                                {Object.entries(w.materialsCost).map(([matKey, amount]) => {
                                  const info = MATERIAL_INFO[matKey] || { name: matKey.toUpperCase(), icon: "📦", color: "text-slate-400" };
                                  const hasQty = materials[matKey] || 0;
                                  const meet = hasQty >= amount;
                                  const details = getMaterialDetails(matKey);
                                  return (
                                    <span 
                                      key={matKey} 
                                      style={meet ? { color: details.color } : { color: "#475569" }}
                                      className={`text-[8.5px] font-extrabold flex items-center gap-1 ${!meet ? "line-through opacity-70" : ""}`}
                                    >
                                      <span>{info.icon}</span>
                                      <span>{amount} {info.name}</span>
                                    </span>
                                  );
                                })}
                                {Object.keys(w.materialsCost).length === 0 && (
                                  <span className="text-slate-500 font-bold italic text-[8.5px]">- FREE PROTO -</span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleCraftWeapon(w)}
                              disabled={!canCraft}
                              className={`px-3 py-1.5 font-bold cursor-pointer rounded text-[10px] flex items-center gap-1.5 uppercase transition-all whitespace-nowrap ${
                                canCraft
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.25)] font-black"
                                  : "bg-slate-900/60 text-slate-600 border border-slate-950 cursor-not-allowed"
                              }`}
                            >
                              <Hammer size={11} /> {w.creditCost} ₩ CRAFT
                            </button>
                          </div>
                        ) : (
                          <div className="bg-slate-950/40 p-2 rounded border border-slate-900 flex justify-between items-center text-[9px] mt-2">
                            <span className="text-slate-550 flex items-center gap-1 font-semibold">
                              <Check size={12} className="text-[#fbbf24]" /> CONFIG INTEGRATED. READY FOR HOTBAR LOADOUT.
                            </span>
                            
                            {/* Instant shortcut to load in slots */}
                            <div className="flex gap-1 select-none">
                              {w.category === "melee" && (
                                <button
                                  onClick={() => handleEquipWeapon(0, w.id)}
                                  className={`px-2 py-1 text-[8.5px] font-black rounded cursor-pointer ${equippedWeapons[0] === w.id ? "bg-[#10b981] text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                                >
                                  {equippedWeapons[0] === w.id ? "✓ EQUIPPED" : "LOAD SLOT 1"}
                                </button>
                              )}
                              {w.category === "primary" && (
                                <button
                                  onClick={() => handleEquipWeapon(1, w.id)}
                                  className={`px-2 py-1 text-[8.5px] font-black rounded cursor-pointer ${equippedWeapons[1] === w.id ? "bg-[#10b981] text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                                >
                                  {equippedWeapons[1] === w.id ? "✓ EQUIPPED" : "LOAD SLOT 2"}
                                </button>
                              )}
                              {w.category === "secondary" && (
                                <button
                                  onClick={() => handleEquipWeapon(2, w.id)}
                                  className={`px-2 py-1 text-[8.5px] font-black rounded cursor-pointer ${equippedWeapons[2] === w.id ? "bg-[#10b981] text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                                >
                                  {equippedWeapons[2] === w.id ? "✓ EQUIPPED" : "LOAD SLOT 3"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: CHASSIS ARMOR PLATING */}
        {activeTab === "armor" && (
          <div className="flex flex-col gap-4">
            
            {/* CURRENT EQUIPPED GEAR */}
            <div className="bg-[#05060b] p-4 rounded border-2 border-[#ec4899]/30 flex flex-col md:flex-row items-center gap-5 justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center border-2 shadow-inner"
                  style={{ 
                    borderColor: ARMORS_CATALOG.find(a => a.id === equippedArmor)?.color || "#2d2f3f",
                    backgroundColor: "rgba(12,13,22,0.6)"
                  }}
                >
                  {(() => {
                    const aObj = ARMORS_CATALOG.find(a => a.id === equippedArmor);
                    return aObj ? getArmorIconHelper(aObj) : <Shield size={20} style={{ color: "#94a3b8" }} />;
                  })()}
                </div>
                <div>
                  <span className="text-[8px] text-pink-500 font-extrabold block tracking-widest uppercase">CURRENT ACTIVE CHASSIS PLATING</span>
                  <p className="text-sm font-black text-white uppercase tracking-wider">
                    {ARMORS_CATALOG.find(a => a.id === equippedArmor)?.name || "NO PLATING"}
                  </p>
                  <p className="text-[10px] text-slate-400 italic font-medium">
                    "Each plateset features real-time visual evolution overlays rendered on the cyber combat canvas."
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-900 text-[10px] max-w-sm w-full">
                <span className="text-pink-400 font-black text-[9px] block mb-0.5 tracking-wide">ACTIVE PROTECTION TRAIT:</span>
                <p className="text-slate-300 text-[9.5px]/relaxed leading-tight">
                  {ARMORS_CATALOG.find(a => a.id === equippedArmor)?.ability || "No active defense modifiers. Standard operation mode."}
                </p>
              </div>
            </div>

            {/* Visual Connected Tree */}
            <div className="w-full bg-slate-950/70 p-4 rounded border border-slate-900 select-none font-mono text-xs flex flex-col min-h-[600px]">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
                    <div>
                      <h4 className="text-[10px] text-pink-500 font-extrabold uppercase tracking-wider">🛠️ CHASSIS MODULAR TOPOLOGY</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Select a plate node to retrofit system specifications</p>
                    </div>
                    <span className="text-[8px] bg-[#ec4899]/10 text-[#ec4899] px-1.5 py-0.5 rounded border border-[#ec4899]/20 uppercase font-black font-mono">CHASSIS CORE</span>
                  </div>

                  <div 
                    onClick={() => setSelectedArmorId(null)}
                    className="flex-1 relative w-full h-[480px] bg-slate-950/40 border border-slate-900 rounded select-none cursor-crosshair"
                  >
                    {/* SVG Connections behind the scenes */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {(() => {
                        return ARMOR_TREE_CONNECTIONS.map(([parentId, childId], index) => {
                          const pNode = ARMORS_CATALOG.find(a => a.id === parentId);
                          const cNode = ARMORS_CATALOG.find(a => a.id === childId);
                          if (!pNode || !cNode) return null;
                          
                          const pPos = ARMOR_TREE_POSITIONS[parentId];
                          const cPos = ARMOR_TREE_POSITIONS[childId];
                          if (!pPos || !cPos) return null;

                          const isParentOwned = ownedArmors.includes(pNode.id);
                          const isChildOwned = ownedArmors.includes(cNode.id);
                          const isLineActive = isParentOwned || isChildOwned;

                          return (
                            <path 
                              key={index}
                              d={getSymmetricTreePath(pPos, cPos)}
                              fill="none"
                              stroke={isLineActive ? "#ec4899" : "#475569"}
                              vectorEffect="non-scaling-stroke"
                              style={{ strokeWidth: "3px" }}
                              strokeOpacity={isLineActive ? "0.95" : "0.75"}
                              strokeDasharray={!isParentOwned ? "1 1.2" : undefined}
                              className={isLineActive ? "animate-[pulse_2.5s_infinite]" : ""}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Nodes absolute positioned */}
                    {(() => {
                      const activeArmorId = selectedArmorId;
                      
                      return ARMORS_CATALOG.map((item) => {
                        const pos = ARMOR_TREE_POSITIONS[item.id];
                        if (!pos) return null;

                        const isOwned = ownedArmors.includes(item.id);
                        const isSelected = item.id === activeArmorId;
                        const isActive = equippedArmor === item.id;
                        const parent = getArmorParent(item);
                        const isParentOwned = !parent || ownedArmors.includes(parent.id);

                        const design = getNodeBorderAndGlow(item.rank, isOwned, isParentOwned, isSelected);
                        const isBottomHalf = pos.y > 50;

                        return (
                          <div 
                            key={item.id} 
                            className={`flex flex-col items-center group ${isSelected ? "z-[155]" : "z-10"}`}
                            style={{ 
                              position: "absolute", 
                              left: `${pos.x}%`, 
                              top: `${pos.y}%`,
                              transform: "translate(-50%, -50%)",
                              zIndex: isSelected ? 155 : 10
                            }}
                          >
                            <button
                              id={`node-armor-${item.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArmorId(isSelected ? null : item.id);
                                cyberAudio.playHack();
                              }}
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded flex flex-col items-center justify-center border transition-all cursor-pointer relative select-none ${design.nodeClass}`}
                              style={design.style || {}}
                              title={item.name}
                            >
                              {getArmorIconHelper(item)}
                              
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                                {isActive ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 block" />
                                ) : isOwned ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                                ) : isParentOwned ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse block" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800 block" />
                                )}
                              </div>
                            </button>

                            {/* Floating details shown beside the icon when selected */}
                            {isSelected && (() => {
                              const meetCredits = credits >= item.creditCost;
                              const meetMaterials = Object.entries(item.materialsCost).every(([matKey, amount]) => (materials[matKey] || 0) >= amount);
                              
                              return (
                                <div 
                                  className={`absolute z-[200] w-56 sm:w-64 p-3 bg-[#030712]/98 border rounded-md text-left text-[10px] font-mono leading-relaxed transition-all duration-200 pointer-events-auto flex flex-col gap-1.5 ${
                                    isBottomHalf
                                      ? (pos.x < 50 ? "left-full ml-3 bottom-[-16px]" : "right-full mr-3 bottom-[-16px]")
                                      : (pos.x < 50 ? "left-full ml-3 top-1/2 -translate-y-1/2" : "right-full mr-3 top-1/2 -translate-y-1/2")
                                  }`}
                                  style={{
                                    borderColor: design.color,
                                    boxShadow: `0 0 20px ${design.color}35`
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Floating Arrow indicators */}
                                  <div className={`absolute w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ${
                                    isBottomHalf ? "bottom-[18px]" : "top-1/2 -translate-y-1/2"
                                  } ${
                                    pos.x < 50 ? "right-full border-r-[6px]" : "left-full border-l-[6px]"
                                  }`} 
                                    style={pos.x < 50 ? { borderRightColor: design.color } : { borderLeftColor: design.color }}
                                  />

                                  <div className="flex items-center justify-between gap-2 border-b pb-1.5" style={{ borderBottomColor: `${design.color}25` }}>
                                    <span className="font-extrabold text-[#f1f1f1] uppercase text-[9px]/none tracking-wider truncate max-w-[170px]">
                                      {item.name}
                                    </span>
                                  </div>

                                  <p className="text-slate-400 italic text-[9px]/relaxed font-sans font-medium pl-0.5">
                                    "{item.desc}"
                                  </p>

                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-slate-900/50 pt-1.5 text-[8px] text-slate-500">
                                    <div>
                                      <span>PLATING: </span>
                                      <span className="font-extrabold text-pink-400">LV.{item.powerLevel}</span>
                                    </div>
                                    <div>
                                      <span>CREDITS: </span>
                                      <span className="font-extrabold text-amber-500">{item.creditCost}</span>
                                    </div>
                                  </div>

                                  <div className="mt-1 border-t border-slate-900/50 pt-1.5 flex flex-col gap-1">
                                    {isActive ? (
                                      <div className="flex items-center gap-1 text-[8px] text-pink-400 font-extrabold uppercase justify-center bg-pink-950/20 py-1 rounded border border-pink-900/45">
                                        <Cpu className="w-2.5 h-2.5 animate-spin" /> ACTIVE SUIT SUITE
                                      </div>
                                    ) : isOwned ? (
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-[8px] text-emerald-400 font-extrabold uppercase justify-center bg-emerald-950/20 py-0.5 rounded border border-emerald-900/35">
                                          <Check size={10} className="stroke-[3px]" /> RETROFIT OWNED
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEquipArmor(item.id);
                                            setSelectedArmorId(null);
                                          }}
                                          className="w-full py-1 text-[8px] font-bold rounded cursor-pointer transition-all bg-slate-900 text-slate-450 hover:bg-slate-800"
                                        >
                                          EQUIP PROCESS OVERRIDE
                                        </button>
                                      </div>
                                    ) : isParentOwned ? (
                                      <div className="bg-slate-950 p-1.5 rounded border border-slate-900 flex flex-col gap-1">
                                        <div className="flex flex-wrap gap-1 text-[7.5px] uppercase text-slate-400">
                                          {Object.entries(item.materialsCost).map(([matKey, amount]) => {
                                            const info = MATERIAL_INFO[matKey] || { name: matKey.toUpperCase(), icon: "📦" };
                                            const playerQty = materials[matKey] || 0;
                                            const meet = playerQty >= amount;
                                            return (
                                              <span
                                                key={matKey}
                                                className={`flex items-center gap-0.5 font-bold ${meet ? "text-emerald-400" : "text-rose-500 line-through opacity-70"}`}
                                              >
                                                {info.icon} {playerQty}/{amount}
                                              </span>
                                            );
                                          })}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCraftArmor(item);
                                          }}
                                          disabled={!meetCredits || !meetMaterials}
                                          className={`w-full py-1 rounded text-[8.5px] font-black uppercase text-center transition-all ${
                                            meetCredits && meetMaterials
                                              ? "bg-pink-500 text-black hover:bg-pink-400"
                                              : "bg-slate-900/60 text-slate-650 cursor-not-allowed border border-slate-950"
                                          }`}
                                        >
                                          FABRICATE PLATE
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-[8px] text-rose-500 font-bold uppercase justify-center bg-rose-950/20 py-1 rounded border border-rose-950/35">
                                          <Lock size={10} /> RETROFIT LINK LOCKED
                                        </div>
                                        <div className="text-[7.5px] text-slate-500 text-center uppercase font-bold leading-tight">
                                          Requires parent plateset upgrade
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      });
                    })()}
                        </div>
                      </div>
                    </div>
                  )}
                

        {/* Tab 4: CHRONO ENCHANTMENT METRICS */}
        {activeTab === "enchants" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left Column: Inventory Bay Target Selector */}
            <div className="md:col-span-4 bg-[#040406]/95 border border-slate-900 rounded-lg p-4 flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-[11px] md:text-sm text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Package size={14} className="text-[#a78bfa]" /> 1. INTEGRATOR TARGETS
                </h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                  SELECT A FACTION DEVICE FOR CHRONO RECONSTITUTION.
                </p>
              </div>

              {/* Type Category Switcher Toggles */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 border border-slate-900 rounded-md font-mono text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    setEnchantItemType("weapon");
                    setSelectedItemId(null);
                    setRollResult(null);
                    setTerminalLogs([]);
                    cyberAudio.playHack();
                  }}
                  className={`py-1.5 px-2 font-black uppercase rounded transition-all cursor-pointer ${
                    enchantItemType === "weapon"
                      ? "bg-purple-950/40 text-[#a78bfa] border border-purple-500/20 shadow-sm"
                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                  }`}
                >
                  ⚔️ WEAPON MATRIX
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnchantItemType("armor");
                    setSelectedItemId(null);
                    setRollResult(null);
                    setTerminalLogs([]);
                    cyberAudio.playHack();
                  }}
                  className={`py-1.5 px-2 font-black uppercase rounded transition-all cursor-pointer ${
                    enchantItemType === "armor"
                      ? "bg-purple-950/40 text-[#a78bfa] border border-purple-500/20 shadow-sm"
                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                  }`}
                >
                  🛡️ ARMOR CHASSIS
                </button>
              </div>

              {/* Gear Grid list list */}
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin">
                {enchantItemType === "weapon" ? (
                  WEAPONS_CATALOG.filter((w) => ownedWeapons.includes(w.id)).map((w) => {
                    const currentEnchant = weaponEnchants[w.id];
                    const selected = activeSelectedId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setSelectedItemId(w.id);
                          setRollResult(null);
                          setTerminalLogs([]);
                          cyberAudio.playHack();
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          selected
                            ? "bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)] text-white"
                            : "bg-[#07070c]/50 hover:bg-[#0c0c14]/80 border-slate-900/80 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-6 rounded"
                            style={{ backgroundColor: w.color }}
                          />
                          <div>
                            <span className="font-extrabold text-[10px] md:text-[11px] block text-[#f1f1f1] uppercase tracking-wide">
                              {w.name}
                            </span>
                            <span className="text-[7.5px] font-mono text-slate-500 uppercase">
                              BASE DMG: {w.damage} // RATE: {w.fireRate}ms
                            </span>
                          </div>
                        </div>

                        {currentEnchant ? (
                          <span className="bg-purple-950/60 text-[#d8b4fe] border border-purple-500/40 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest animate-pulse">
                            🔮 {currentEnchant}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono font-bold text-[8px] uppercase tracking-wider">
                            CLEAN SLATE
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  ARMORS_CATALOG.filter((a) => ownedArmors.includes(a.id)).map((a) => {
                    const currentEnchant = armorEnchants[a.id];
                    const selected = activeSelectedId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelectedItemId(a.id);
                          setRollResult(null);
                          setTerminalLogs([]);
                          cyberAudio.playHack();
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          selected
                            ? "bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)] text-white"
                            : "bg-[#07070c]/50 hover:bg-[#0c0c14]/80 border-slate-900/80 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-6 rounded"
                            style={{ backgroundColor: a.color }}
                          />
                          <div>
                            <span className="font-extrabold text-[10px] md:text-[11px] block text-[#f1f1f1] uppercase tracking-wide">
                              {a.name}
                            </span>
                            <span className="text-[7.5px] font-mono text-slate-500 uppercase">
                              POWER: LV.{a.powerLevel} // PASSIVE: {a.ability.slice(0, 16)}...
                            </span>
                          </div>
                        </div>

                        {currentEnchant ? (
                          <span className="bg-purple-950/60 text-[#d8b4fe] border border-purple-500/40 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest animate-pulse">
                            🔮 {currentEnchant}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono font-bold text-[8px] uppercase tracking-wider">
                            CLEAN SLATE
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Reconstitution Workbench Bench */}
            <div className="md:col-span-8 bg-[#07070c]/90 border border-slate-900 rounded-lg p-5 flex flex-col justify-between">
              
              {!activeSelectedId ? (
                <div className="flex flex-col items-center justify-center text-center p-12 flex-1 gap-3">
                  <div className="w-12 h-12 rounded-full border border-dashed border-purple-500/30 flex items-center justify-center animate-spin text-purple-400">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold font-mono text-slate-400 text-xs uppercase uppercase select-none">
                      NO DEPLOYMENT GEAR SELECTION FOUND
                    </h4>
                    <p className="text-[10px] text-slate-600 font-mono mt-1 w-64 leading-relaxed uppercase">
                      Please interact with the leftmost array registry index to initialize nuclear overclock matrices.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 flex-1 justify-between">
                  {/* Item Selected Active Blueprint Header Banner */}
                  <div className="flex flex-wrap items-center justify-between bg-purple-950/20 border border-purple-900/30 p-3.5 rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border border-purple-500/30 rounded-md bg-black/40 text-[#a78bfa] font-black tracking-widest text-[16px] animate-pulse">
                        🔮
                      </div>
                      <div>
                        <span className="text-[8px] font-mono text-purple-400 font-black block uppercase tracking-widest">
                          CHRONO OVERINTEGRATOR LINK STABLE
                        </span>
                        <h4 className="font-extrabold text-xs md:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                          {enchantItemType === "weapon" ? (
                            <>
                              <span className="text-purple-400">⚔️</span> {WEAPONS_CATALOG.find(w => w.id === activeSelectedId)?.name || activeSelectedId}
                            </>
                          ) : (
                            <>
                              <span className="text-[#ec4899]">🛡️</span> {ARMORS_CATALOG.find(a => a.id === activeSelectedId)?.name || activeSelectedId}
                            </>
                          )}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[7.5px] font-mono text-slate-500 block uppercase">
                        ACTIVE ALIGNMENTS
                      </span>
                      <span className="bg-purple-900/25 text-[#c084fc] border border-purple-500/20 rounded px-2.5 py-1 text-[10px] font-extrabold tracking-widest inline-block text-center shadow-inner mt-1">
                        {enchantItemType === "weapon"
                          ? (weaponEnchants[activeSelectedId] || "UNENCHANTED").toUpperCase()
                          : (armorEnchants[activeSelectedId] || "UNENCHANTED").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Level Option Selection Interface Cards */}
                  <div>
                    <h3 className="font-extrabold text-[10px] md:text-xs text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                      <Zap size={11} className="text-[#a78bfa]" /> SELECT ENCHANTMENT RATIO LEVEL:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {[1, 2, 3].map((level) => {
                        const active = enchantIntensity === level;
                        const qtyNeeded = level; // 1 for 1, 2 for 2, 3 for 3
                        const ownedQty = materials.chrono_reagent || 0;
                        const affordable = ownedQty >= qtyNeeded;

                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => {
                              setEnchantIntensity(level as 1 | 2 | 3);
                              cyberAudio.playHack();
                            }}
                            className={`p-3.5 rounded-lg border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
                              active
                                ? "bg-purple-950/25 border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.15)] text-white"
                                : "bg-black/60 hover:bg-[#09090f] border-slate-900 text-slate-400"
                            }`}
                          >
                            <div className="w-full">
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className={`font-black text-[13px] tracking-wide ${active ? "text-[#a78bfa]" : "text-slate-400"}`}>
                                  LEVEL {level}
                                </span>
                                <span className="text-[12px]">
                                  {level === 1 ? "🔘" : level === 2 ? "💠" : "🌀"}
                                </span>
                              </div>
                              <p className="text-[8px] md:text-[9px] text-slate-500 leading-tight">
                                {level === 1 && "Aligns Tier I-II standard combat codes logic."}
                                {level === 2 && "Generates Tier II-III enhanced alignment matrices."}
                                {level === 3 && "Hyper overclock limit. Spawns ultimate Tier III-V matrices!"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between w-full border-t border-slate-900/60 pt-2 text-[8px] font-mono">
                              <span className="text-slate-500 uppercase">CODES INGESTED:</span>
                              <span className={`font-extrabold ${affordable ? "text-purple-400" : "text-rose-500 font-extrabold animate-pulse"}`}>
                                {qtyNeeded} CHRONO REAGENTS
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Materials verification bar & Core Action Button */}
                  <div className="bg-[#040407]/90 border border-slate-900/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-[10px] my-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px]">🔮</span>
                      <div>
                        <span className="text-slate-500 text-[8.5px] font-mono uppercase block leading-tight">
                          CHRONO REAGENTS MATRIX ACCOUNT
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-extrabold uppercase text-[#a78bfa] font-mono">
                            Chrono Codes:
                          </span>
                          <span className="bg-slate-950 border border-slate-900 px-2 py-0.5 text-white font-black rounded-md text-[9px] font-mono">
                            {materials.chrono_reagent || 0} CODES
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEnchant(activeSelectedId)}
                      disabled={isEnchanting}
                      className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-white font-black text-[11px] tracking-widest cursor-pointer hover:shadow-lg transition-all uppercase flex items-center justify-center gap-2 ${
                        isEnchanting
                          ? "bg-slate-800 text-slate-500 border border-slate-950 cursor-not-allowed"
                          : (materials.chrono_reagent || 0) >= enchantIntensity
                            ? "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 border border-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse"
                            : "bg-slate-950 border border-slate-900/40 text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      {isEnchanting ? (
                        <>
                          <RefreshCw className="animate-spin text-purple-400" size={13} />
                          OVERCLOCK MATRIX ALIGNING...
                        </>
                      ) : (
                        <>
                          <Sparkles className="text-purple-300 animate-spin" size={13} style={{ animationDuration: "3s" }} />
                          RE-INTEGRATE BLUEPRINT ({enchantIntensity})
                        </>
                      )}
                    </button>
                  </div>

                  {/* Retro Scifi Cyber Terminal Console Trace Monitor logs */}
                  <div className="bg-[#030306] rounded-lg border border-slate-900/80 p-4 h-64 flex flex-col font-mono text-xs md:text-[13px] leading-relaxed relative overflow-hidden select-none">
                    <div className="absolute top-2 right-3 opacity-50 text-[9px] md:text-[10px] text-[#a78bfa] font-bold uppercase select-none flex items-center gap-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> REAL-TIME COGNITIVE MONITOR
                    </div>

                    <span className="text-slate-500 border-b border-slate-950 pb-1 mb-2 block uppercase tracking-wider text-[9px] md:text-[10px] font-black">
                      🖥️ CONSOLE PORT STACK VERBOSE:
                    </span>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 text-slate-500 scrollbar-none">
                      {terminalLogs.length === 0 ? (
                        <span className="text-slate-700 italic">SYSTEM IDLE. AWAITING INPUT CYCLES...</span>
                      ) : (
                        terminalLogs.map((log, index) => {
                          const isSuccess = log.includes("SUCCESS") || log.includes("👉");
                          const isErr = log.includes("ERROR") || log.includes("⚠️");
                          return (
                            <span
                              key={index}
                              className={isSuccess ? "text-purple-300 font-extrabold flex items-center gap-1" : isErr ? "text-rose-500 font-extrabold" : "text-slate-400"}
                            >
                              {log}
                            </span>
                          );
                        })
                      )}
                      
                      {rollResult && (
                        <div className="mt-1 bg-purple-950/20 border border-purple-500/20 p-2 rounded-md flex items-center justify-between text-[#d8b4fe] font-black tracking-widest text-[10px] md:text-sm animate-bounce text-center uppercase">
                          ⚡ ESTABLISHED CONFIG: [{rollResult.toUpperCase()}]! ⚡
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* Tab 5: PROFILE INVENTORY */}
        {activeTab === "inventory" && (
          <div className="flex flex-col gap-5">
            
            {/* Header / Sub-Switcher */}
            <div className="bg-[#05060b]/90 p-4 border border-slate-900 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-[12px] md:text-sm text-white flex items-center gap-2 uppercase tracking-wider">
                  <Package size={16} className="text-[#10b981]" /> PROFILE SYSTEM INVENTORY
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  QUERY REGISTERED AND COILED ASSETS WITHIN THE CYBERNETIC GRID.
                </p>
              </div>

              {/* Sub-tab selection */}
              <div className="flex bg-black p-1 rounded border border-slate-800 gap-1.5 font-mono text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    setInventorySubTab("cargo");
                    cyberAudio.playHack();
                  }}
                  className={`py-1.5 px-3 font-black uppercase rounded transition-all cursor-pointer ${
                    inventorySubTab === "cargo"
                      ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/35 shadow-sm font-black"
                      : "text-slate-500 hover:text-slate-300 border border-transparent font-medium"
                  }`}
                >
                  📦 SALVAGED CARGO ({Object.values(materials).reduce((acc, c) => acc + (c || 0), 0)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInventorySubTab("chrono");
                    cyberAudio.playHack();
                  }}
                  className={`py-1.5 px-3 font-black uppercase rounded transition-all cursor-pointer ${
                    inventorySubTab === "chrono"
                      ? "bg-purple-950/40 text-[#a78bfa] border border-[#a78bfa]/35 shadow-sm font-black"
                      : "text-slate-500 hover:text-slate-300 border border-transparent font-medium"
                  }`}
                >
                  🔮 CHRONO ENCHANTS ({Object.keys(weaponEnchants).length + Object.keys(armorEnchants).length + (materials.chrono_reagent ? 1 : 0)})
                </button>
              </div>
            </div>

            {/* Subtab Contents CASE A: SALVAGED CARGO */}
            {inventorySubTab === "cargo" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[#040407]/95 border border-slate-900/80 rounded-lg p-4">
                  <div className="mb-3 flex justify-between items-center border-b border-slate-900/60 pb-2">
                    <h4 className="text-white font-extrabold text-xs tracking-wider flex items-center gap-1.5 uppercase">
                      <span className="text-[#10b981]">📦</span> SECURED SALVAGED CARGO MANIFEST
                    </h4>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">
                      SECURED CYBERNETIC SUBSTANCES
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-900/80 scrollbar-thin">
                    <table className="w-full text-left font-mono text-[10px] border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-950 text-slate-500 border-b border-slate-950 text-[8.5px] tracking-wider uppercase font-black font-semibold">
                          <th className="p-3 w-[40px] text-center">Sigil</th>
                          <th className="p-3">Cargo Designation</th>
                          <th className="p-3">Rarity Class</th>
                          <th className="p-3 text-center">Units Secured</th>
                          <th className="p-3 max-w-[400px]">Technical Specifications & Cybernetic Utility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-950 bg-black/40">
                        {Object.entries(MATERIAL_INFO).map(([key, info]) => {
                          const count = materials[key] || 0;
                          const details = getMaterialDetails(key);
                          return (
                            <tr key={key} className="hover:bg-slate-950/40 transition-colors">
                              {/* Icon Column */}
                              <td className="p-3 text-center text-base">
                                <span className="inline-block animate-pulse">{info.icon}</span>
                              </td>
                              {/* Item Name */}
                              <td className="p-3 font-extrabold">
                                <span 
                                  style={{ color: details.color }} 
                                  className="tracking-wide font-black uppercase text-[11px]"
                                >
                                  {info.name}
                                </span>
                              </td>
                              {/* Rarity */}
                              <td className="p-3">
                                <span
                                  className="border rounded px-2.5 py-0.5 text-[8px] font-black tracking-widest uppercase"
                                  style={{ color: details.color, borderColor: `${details.color}25`, backgroundColor: `${details.color}05` }}
                                >
                                  {details.rarity}
                                </span>
                              </td>
                              {/* Units Count */}
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded font-black text-xs ${count > 0 ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' : 'bg-slate-900/50 text-slate-600'}`}>
                                  {count} SECURED
                                </span>
                              </td>
                              {/* Specifications */}
                              <td className="p-3 text-slate-400 max-w-[400px] leading-relaxed text-[9.5px]">
                                {details.desc}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab Contents CASE B: CHRONO REGISTRIES */}
            {inventorySubTab === "chrono" && (
              <div className="flex flex-col gap-6">
                
                {/* CHRONO MATERIALS ASSETS OVERVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-5 bg-[#030306]/95 border border-slate-900 rounded-lg p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] tracking-widest text-[#a78bfa] uppercase font-black font-mono">
                        CRYSTALLIZED QUANTUM CODES
                      </span>
                      <h4 className="font-extrabold text-white text-base mt-1 uppercase">
                        🔮 CHRONO REAGENTS INVENTORY
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-2.5 leading-relaxed uppercase">
                        These volatile memory modules are salvaged from high-threat cyborg drones. Feeding them into the Quantum Reconstitution Workbench re-syncs neural algorithms to construct legendary custom stats on weapons and chassis.
                      </p>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-4 flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[28px] animate-spin" style={{ animationDuration: "5s" }}>🔮</span>
                        <div>
                          <span className="text-[8px] text-slate-500 font-mono block">CHRONO CODE ACCOUNT</span>
                          <span className="text-white font-extrabold text-[12px] uppercase">RECONSTITUTE CODES</span>
                        </div>
                      </div>
                      <span className="bg-purple-950/60 border border-purple-500 text-[#a78bfa] rounded-lg px-4 py-2 font-black text-xl font-mono shadow-[0_0_15px_rgba(167,139,250,0.2)] animate-pulse">
                        {materials.chrono_reagent || 0}
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE CODES MATRIX BOARD TABLE */}
                  <div className="md:col-span-7 bg-[#040407]/95 border border-slate-900 rounded-lg p-5">
                    <h4 className="text-white font-extrabold text-xs tracking-wider flex items-center gap-2 mb-3 uppercase">
                      <span>✨</span> ACTIVE RECONSTITUTED ENCHANTMENTS TABLE
                    </h4>
                    
                    <div className="overflow-x-auto rounded-lg border border-slate-900/80 scrollbar-thin">
                      <table className="w-full text-left font-mono text-[9.5px] border-collapse min-w-[450px]">
                        <thead>
                          <tr className="bg-slate-950 text-slate-500 border-b border-[#030306] text-[8.5px] tracking-wider uppercase font-black">
                            <th className="p-3">Target Gear</th>
                            <th className="p-3">Class</th>
                            <th className="p-3">Active Enchantment</th>
                            <th className="p-3 text-right">Stat Multiplier Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950 bg-black/40 text-slate-300">
                          {/* Weapons Enchants */}
                          {Object.entries(weaponEnchants).map(([itemId, outcome]) => {
                            const item = WEAPONS_CATALOG.find(w => w.id === itemId);
                            const tier = outcome.split(" ").slice(-1)[0] || "I";
                            let powerDesc = "+10% Alignment Boost";
                            if (tier === "II") powerDesc = "+20% Overdrive Sync";
                            else if (tier === "III") powerDesc = "+35% Quantum Surge";
                            else if (tier === "IV") powerDesc = "+55% Infinite Singularity";
                            else if (tier === "V") powerDesc = "+80% Temporal Overlord Superflux";

                            return (
                              <tr key={itemId} className="hover:bg-slate-950/40 transition-colors">
                                <td className="p-3 font-extrabold" style={{ color: item?.color || "#ffffff" }}>
                                  {item?.name || itemId.toUpperCase()}
                                </td>
                                <td className="p-3 text-slate-400 text-[8.5px] uppercase">
                                  {item?.category || "melee"} weapon
                                </td>
                                <td className="p-3 font-black text-[#a78bfa] animate-pulse tracking-wide">
                                  🔮 {outcome.toUpperCase()}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-500">
                                  {powerDesc}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Armor Enchants */}
                          {Object.entries(armorEnchants).map(([itemId, outcome]) => {
                            const item = ARMORS_CATALOG.find(a => a.id === itemId);
                            const tier = outcome.split(" ").slice(-1)[0] || "I";
                            let powerDesc = "+10% Alignment Boost";
                            if (tier === "II") powerDesc = "+20% Overdrive Sync";
                            else if (tier === "III") powerDesc = "+35% Quantum Surge";
                            else if (tier === "IV") powerDesc = "+55% Infinite Singularity";
                            else if (tier === "V") powerDesc = "+80% Temporal Overlord Superflux";

                            return (
                              <tr key={itemId} className="hover:bg-slate-950/40 transition-colors">
                                <td className="p-3 font-extrabold" style={{ color: item?.color || "#ffffff" }}>
                                  {item?.name || itemId.toUpperCase()}
                                </td>
                                <td className="p-3 text-slate-400 text-[8.5px] uppercase">
                                  Chassis Armor Plating
                                </td>
                                <td className="p-3 font-black text-[#a78bfa] animate-pulse tracking-wide">
                                  🔮 {outcome.toUpperCase()}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-500">
                                  {powerDesc}
                                </td>
                              </tr>
                            );
                          })}

                          {Object.keys(weaponEnchants).length === 0 && Object.keys(armorEnchants).length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-600 italic uppercase">
                                NO SYSTEMS LICENSED FOR CHRONO ALIGNMENTS YET. VISIT BENCH (TAB 4) TO BIND!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Tab 6: TIMELINE ASCENSION / PRESTIGE */}
        {activeTab === "prestige" && (
          <div className="flex flex-col gap-6 font-mono text-slate-400">
            <div className="bg-[#05060b]/90 p-6 border border-amber-900/40 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <span className="text-[9px] text-amber-500 font-extrabold tracking-widest uppercase block animate-pulse">
                  ⚡ QUANTUM MEMULATORY DEITY GATEWAY ⚡
                </span>
                <h3 className="font-extrabold text-lg text-white mt-1 uppercase tracking-wider flex items-center gap-2">
                  🔮 TIMELINE ASCENSION & CHRONO PRESTIGE
                </h3>
                <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed uppercase">
                  Ascend past the physical constraints of this timeline. Triggering Chrono Prestige completely resets all weapon inventory, titanium/plasma alloys, and system augments back to a clean state. In return, your core consciousness is injected into a Transcendent clone model.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-5 flex flex-col items-center justify-center shrink-0 min-w-[200px] shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-bold">CURRENT ASCENT</span>
                <span className="text-4xl text-amber-500 font-black tracking-widest mt-1.5 animate-bounce">
                  LVL {prestigeLevel}
                </span>
                <span className="text-[8px] text-[#00f3ff] uppercase block mt-2 font-black tracking-widest text-center">
                  {unlockedPrestigePerks.length} PERK{unlockedPrestigePerks.length === 1 ? "" : "S"} INSTALLED
                </span>
              </div>
            </div>

            {isSelectingAscension ? (
              <div className="bg-slate-950/85 border-2 border-amber-500/30 p-6 rounded-lg shadow-2xl flex flex-col gap-5">
                <div className="text-center">
                  <span className="text-[10px] text-amber-500 font-black tracking-widest block animate-pulse uppercase">
                    🔮 CONSCIOUSNESS SHAFTS ALIGNED // CHOOSE 1 ASCENSION VECTOR 🔮
                  </span>
                  <h4 className="text-sm text-white font-extrabold uppercase mt-1">AVAILABLE EVOLUTION ARRAYS</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ascensionChoices.map((choice) => {
                    const isSelected = selectedAscensionId === choice.id;
                    const alreadyHas = unlockedPrestigePerks.includes(choice.id);
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => { setSelectedAscensionId(choice.id); cyberAudio.playHack(); }}
                        className={`text-left p-4 rounded-lg border transition-all relative flex flex-col justify-between h-48 cursor-pointer ${
                          isSelected
                            ? "bg-slate-900/90 border-[2px]"
                            : "bg-black/60 border-slate-900/80 hover:border-slate-800"
                        }`}
                        style={{
                          borderColor: isSelected ? choice.color : undefined,
                          boxShadow: isSelected ? `0 0 20px ${choice.color}25` : undefined
                        }}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xl">
                              {choice.id === "hyper_drive_weapons" ? "⚡" : 
                               choice.id === "nano_reinforced_plating" ? "🛡️" : 
                               choice.id === "reagent_surplus" ? "🧪" : 
                               choice.id === "overcharged_core" ? "🔥" : 
                               choice.id === "tactical_tactician" ? "🔮" : 
                               choice.id === "deity_scavenger" ? "✨" : "🚀"}
                            </span>
                            {isSelected && (
                              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded text-black animate-pulse" style={{ backgroundColor: choice.color }}>
                                SELECTED
                              </span>
                            )}
                          </div>
                          <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-white" style={{ color: isSelected ? choice.color : undefined }}>
                            {choice.name}
                          </h5>
                          <p className="text-[9.5px] text-slate-400 mt-2 uppercase leading-relaxed">
                            {choice.desc}
                          </p>
                        </div>
                        {alreadyHas && (
                          <span className="text-[8px] text-amber-500 uppercase font-bold tracking-widest mt-2 block">
                            ★ ALREADY ACQUIRED
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col md:flex-row gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsSelectingAscension(false); cyberAudio.playHack(); }}
                    className="w-full md:w-1/3 bg-slate-900 hover:bg-slate-800 border border-slate-700/30 text-slate-400 font-bold uppercase text-[10px] tracking-widest py-3 rounded-lg cursor-pointer text-center"
                  >
                    ⬅ CANCEL RECONSTRUCTION
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onTimelineAscend && selectedAscensionId) {
                        onTimelineAscend(selectedAscensionId);
                        setIsSelectingAscension(false);
                      }
                    }}
                    disabled={!selectedAscensionId}
                    className="w-full md:w-2/3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-black uppercase text-[10px] tracking-[0.15em] py-3 rounded-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse text-center"
                  >
                    🔮 SYNC SPECIFIC EVOLUTION & DETACH CHRONOMETER
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box A: Benefits */}
                <div className="bg-black/40 p-5 rounded-lg border border-slate-900/85 flex flex-col justify-between">
                  <div>
                    <h4 className="text-white font-extrabold text-xs tracking-wider flex items-center gap-2 mb-3 uppercase">
                      <Check size={14} className="text-amber-500" /> TRANSCENDENT INJECTOR BENEFITS
                    </h4>
                    
                    <ul className="flex flex-col gap-3 text-[10px] uppercase">
                      <li className="flex items-start gap-2.5 border-b border-slate-900/60 pb-2">
                        <span className="text-amber-500">⚜️</span>
                        <div>
                          <span className="text-slate-200 font-bold block">Consciousness Damage Surge</span>
                          <span className="text-slate-500 text-[9px] mt-0.5 block">Permanent +15% raw damage output across ALL weapons per Prestige Level. (Current: +{prestigeLevel * 15}%)</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5 border-b border-slate-900/60 pb-2">
                        <span className="text-amber-500">⚜️</span>
                        <div>
                          <span className="text-slate-200 font-bold block">Temporal Credit Conversion</span>
                          <span className="text-slate-500 text-[9px] mt-0.5 block">Every endgame style run grants a permanent +30% extra credits per Prestige Level. (Current: +{prestigeLevel * 30}%)</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-amber-500">⚜️</span>
                        <div className="w-full">
                          <span className="text-slate-200 font-bold block">ACTIVE EVOLUTION PERKS ({unlockedPrestigePerks.length})</span>
                          {unlockedPrestigePerks.length === 0 ? (
                            <span className="text-slate-500 text-[9px] mt-0.5 block">None. Choose your first perk upon next Timeline Ascension!</span>
                          ) : (
                            <div className="flex flex-col gap-1.5 mt-1.5 w-full">
                              {unlockedPrestigePerks.map((pId) => {
                                const matched = ALL_ASCENSIONS.find(a => a.id === pId);
                                if (!matched) return null;
                                return (
                                  <div key={pId} className="flex items-center gap-1.5 bg-[#00f3ff]/5 border border-[#00f3ff]/10 px-2.5 py-1 rounded text-[#00f3ff] text-[8.5px] w-full">
                                    <span style={{ color: matched.color }} className="mr-1">●</span>
                                    <span className="font-bold flex-1">{matched.name}</span>
                                    <span className="text-slate-500">INSTALLED</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Box B: Action portal or Lock Status */}
                {!hasUnlockedPrestige ? (
                  <div className="bg-[#0f0a0a]/90 border border-rose-500/20 rounded-lg p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-rose-500 font-extrabold text-[#f43f5e] text-xs tracking-wider flex items-center gap-2 mb-2 uppercase">
                        🔒 GATEWAY LOCKED (REQUIREMENT UNMET)
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase leading-relaxed mb-4">
                        The Quantum Deity Gateway is inactive. Your active clone has not achieved the required combat synchronization threshold in this universe timeline.
                      </p>

                      <div className="bg-rose-950/10 border border-rose-500/15 rounded-lg p-4 flex flex-col gap-3 font-mono text-[9px] uppercase">
                        <div className="flex justify-between items-center text-slate-400 font-bold border-b border-rose-950/20 pb-2 mb-1">
                          <span>SYNCHRONIZATION METRIC</span>
                          <span>THRESHOLD</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>REQUIRED BOSS DEFEATS (1 RD)</span>
                          <span className="text-rose-400 font-extrabold">{requiredBossesKilled} KILLS</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>CURRENT ACTIVE RECORD</span>
                          <span className="text-amber-500 font-extrabold">{maxBossesKilledSingleRound} KILLS</span>
                        </div>

                        {/* Progress slider bar */}
                        <div className="mt-2 text-[8px] text-slate-500 flex justify-between items-center">
                          <span>SYNC: UNSAFE CORE MATRIX OVERLOAD</span>
                          <span>{Math.min(100, Math.round((maxBossesKilledSingleRound / requiredBossesKilled) * 100))}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-500" 
                            style={{ width: `${Math.min(100, (maxBossesKilledSingleRound / requiredBossesKilled) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="w-full bg-slate-950 border border-rose-950/30 text-rose-500/80 font-black uppercase text-[10px] tracking-wider py-4 rounded-lg text-center select-none">
                        ❌ REQUIRE {requiredBossesKilled - maxBossesKilledSingleRound} MORE BOSSES THIS LIFE
                      </div>
                      <span className="text-[8px] text-slate-600 block text-center mt-2.5 uppercase tracking-wide">
                        ⚠️ DEFEAT SURPASSING BOSS TARGETS IN A SINGLE LIFE UNLOCKS TIMELINE COMPILATION.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#05060b]/95 border border-slate-900/80 rounded-lg p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-white font-extrabold text-xs tracking-wider flex items-center gap-2 mb-2 uppercase">
                        🔮 CONSCIOUSNESS TRIGGER MATRIX
                      </h4>
                      <p className="text-[9.5px] text-slate-500 uppercase leading-relaxed mb-4">
                        Triggering reset clears standard hardware configurations. Check state values before syncing!
                      </p>

                      <div className="bg-amber-950/10 border border-amber-500/20 rounded-lg p-3.5 flex flex-col gap-2 font-mono text-[9px] text-amber-400 uppercase leading-relaxed">
                        <div className="flex justify-between font-bold border-b border-amber-900/30 pb-1.5 mb-1 text-slate-400">
                          <span>Sync Target</span>
                          <span>Reset Penalty State</span>
                        </div>
                        <div className="flex justify-between">
                          <span>1. System Augments (Levels 1-20)</span>
                          <span className="text-rose-500 font-extrabold">WILL RESET TO LEVEL 0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2. Custom Weapon Customization</span>
                          <span className="text-rose-500 font-extrabold">WILL BE RE-LOCKED</span>
                        </div>
                        <div className="flex justify-between">
                          <span>3. Custom Enchants & Cargo Sets</span>
                          <span className="text-rose-500 font-extrabold">WILL BE FLUSHED ENTIRELY</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={handleStartAscensionSelection}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] py-3.5 rounded-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse"
                      >
                        🔮 RE-INSPECT & SHED VESSEL // ASCEND TO TIMELINE {prestigeLevel + 1}
                      </button>
                      <span className="text-[8px] text-slate-600 block text-center mt-2.5 uppercase tracking-wide">
                        ⚠️ PROCEEDING IRREVERSIBLY RECOILS HARDWARE DRIVERS FOR TIMELINE ACCUMULATION.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Advisory warnings */}
      <footer className="relative z-20 border-t border-[#00f3ff]/10 pt-3 text-center font-mono text-[8px] md:text-[9px] text-[#00f3ff]/60 max-w-6xl w-full self-center uppercase tracking-wider">
        "Local matrix configurations are secure from tactical network analysis. Equipping armor alters the android mecha chassis visual matrix."
      </footer>

      {/* Aesthetic accents */}
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-[#00f3ff22] rounded-bl-md pointer-events-none z-10 hidden md:block" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-[#00f3ff22] rounded-br-md pointer-events-none z-10 hidden md:block" />
    </div>
  );
}
