import React, { useEffect, useRef, useState } from "react";
import { Player, Enemy, Projectile, Particle, WorldGridSegment, Weapon, WeaponType } from "../types";
import { cyberAudio } from "../sound";
import { Gauge, Shield, Zap, Sparkles, ChevronRight, Swords, HelpCircle, ShieldAlert } from "lucide-react";
import ControlsManual from "./ControlsManual";
import { MATERIAL_INFO, WEAPONS_CATALOG, getMaterialDetails } from "../data";

// Full dictionary of all craftable and default weapons
export const ALL_WEAPONS: { [key: string]: any } = {
  katana: { id: "katana", name: "ENERGY KATANA", type: "katana", ammo: 999, maxAmmo: 999, fireRate: 250, damage: 45, lastFired: 0, range: 75, desc: "Slices through metal and bullet-streams", color: "#10b981", soundPitch: 1 },
  claw: { id: "claw", name: "THERMAL COMBAT CLAW", type: "katana", ammo: 999, maxAmmo: 999, fireRate: 350, damage: 75, lastFired: 0, range: 55, desc: "Superheated blades delivering heavy localized thermal damage", color: "#f97316", soundPitch: 2 },
  monowire: { id: "monowire", name: "MONO-MOLECULAR WHIP", type: "katana", ammo: 999, maxAmmo: 999, fireRate: 180, damage: 38, lastFired: 0, range: 110, desc: "High velocity electric sub-atomic filament", color: "#ec4899", soundPitch: 3 },
  pistol: { id: "pistol", name: "SMART PISTOL", type: "pistol", ammo: 120, maxAmmo: 120, fireRate: 150, damage: 12, lastFired: 0, range: 350, desc: "Holographic seeking tracer ammunition", color: "#06b6d4", soundPitch: 600 },
  shotgun: { id: "shotgun", name: "PLASMA SHOTGUN", type: "shotgun", ammo: 24, maxAmmo: 24, fireRate: 650, damage: 8, lastFired: 0, range: 180, desc: "Heavy pulse cone dispersion of plasma", color: "#f43f5e", soundPitch: 220 },
  railgun: { id: "railgun", name: "COOLDOWN RAILGUN", type: "railgun", ammo: 8, maxAmmo: 8, fireRate: 1200, damage: 120, lastFired: 0, range: 600, desc: "Pierces terrain blocks and shield barriers", color: "#a855f7", soundPitch: 100 },
  trident: { id: "trident", name: "TRIDENT BURST SMG", type: "pistol", ammo: 180, maxAmmo: 180, fireRate: 80, damage: 11, lastFired: 0, range: 280, desc: "Ultra-fast energy streams in tight bursts", color: "#22c55e", soundPitch: 800 },
  gravity: { id: "gravity", name: "GRAV GRENADE", type: "gravity", ammo: 4, maxAmmo: 4, fireRate: 1500, damage: 25, lastFired: 0, range: 400, desc: "Creates spatial temporal micro black holes", color: "#eab308", soundPitch: 150 },
  nano_blaster: { id: "nano_blaster", name: "NANO SEEKER BLASTER", type: "pistol", ammo: 30, maxAmmo: 30, fireRate: 400, damage: 18, lastFired: 0, range: 320, desc: "Fires self-directing thermite micro-sparks", color: "#fdba74", soundPitch: 450 },
  stinger: { id: "stinger", name: "MICRO-STINGER REEFER", type: "pistol", ammo: 80, maxAmmo: 80, fireRate: 120, damage: 6, lastFired: 0, range: 220, desc: "Acidic corrosive liquid rounds slowing on hit", color: "#a3e635", soundPitch: 700 }
};

// Dynamically augment ALL_WEAPONS with entries from the craftable catalogs
try {
  WEAPONS_CATALOG.forEach((w) => {
    if (!ALL_WEAPONS[w.id]) {
      ALL_WEAPONS[w.id] = {
        id: w.id,
        name: w.name,
        type: w.type,
        ammo: w.ammo,
        maxAmmo: w.ammo,
        fireRate: w.fireRate,
        damage: w.damage,
        lastFired: 0,
        range: w.range,
        desc: w.desc,
        color: w.color,
        soundPitch: w.type === "katana" ? 2 : (w.type === "shotgun" ? 220 : w.type === "railgun" ? 100 : w.type === "gravity" ? 150 : 500)
      };
    }
  });
} catch (err) {
  console.error("Error populating ALL_WEAPONS dynamically from catalog:", err);
}

export const getMatHexColor = (matKey: string): string => {
  try {
    return getMaterialDetails(matKey).color;
  } catch {
    return "#00f3ff";
  }
};

const getEnchantLevel = (enchantStr: string | null | undefined): number => {
  if (!enchantStr) return 0;
  const parts = enchantStr.split(" ");
  if (parts.length < 2) return 0;
  const roman = parts[1];
  switch (roman) {
    case "I": return 1;
    case "II": return 2;
    case "III": return 3;
    case "IV": return 4;
    case "V": return 5;
    default: return 0;
  }
};

const getEnchantType = (enchantStr: string | null | undefined): string => {
  if (!enchantStr) return "";
  const parts = enchantStr.split(" ");
  return parts[0].toLowerCase(); // "damage", "critical", "cooldown", "capacity", "protection", "barrier", "vitality"
};

let globalIdCounter = 0;
const generateFastId = (prefix: string): string => `${prefix}_${++globalIdCounter}`;

interface GameCanvasProps {
  onGameOver: (score: number, styleScore: number, weaponUsed: string, bossesKilled: number) => void;
  unlockedUpgrades: { [key: string]: number };
  onTriggerWhisper: (whisper: string) => void;
  onHomePress?: () => void;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;

  // Custom loadouts
  materials: { [key: string]: number };
  setMaterials: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  equippedWeapons: (string | null)[];
  equippedArmor: string;
  weaponEnchants: { [key: string]: string };
  armorEnchants: { [key: string]: string };
  prestigeLevel?: number;
  activeMutators?: string[];
  unlockedPrestigePerks?: string[];
}

export default function GameCanvas({ 
  onGameOver, 
  unlockedUpgrades, 
  onTriggerWhisper, 
  onHomePress, 
  credits, 
  setCredits,
  materials,
  setMaterials,
  equippedWeapons,
  equippedArmor,
  weaponEnchants,
  armorEnchants,
  prestigeLevel = 0,
  activeMutators = [],
  unlockedPrestigePerks = []
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenMouseRef = useRef({ x: 300, y: 400 });

  // Core Game State
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [playerLoc, setPlayerLoc] = useState({ x: 300, y: 400, vx: 0, vy: 0 });
  const [stylePoints, setStylePoints] = useState(0);
  const [styleRank, setStyleRank] = useState("E");
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [slowMoEnergy, setSlowMoEnergy] = useState(100);
  const [activeWeapon, setActiveWeapon] = useState<Weapon | null>(null);
  const [bossActive, setBossActive] = useState(false);
  const [bossHealth, setBossHealth] = useState(0);
  const [bossMaxHealth, setBossMaxHealth] = useState(1000);
  const [bossName, setBossName] = useState("");
  const [chassisHealth, setChassisHealth] = useState(100);
  const [chassisMaxHealth, setChassisMaxHealth] = useState(100);
  const [chassisShield, setChassisShield] = useState(50);
  const [chassisMaxShield, setChassisMaxShield] = useState(50);
  const [nanoInjectors, setNanoInjectors] = useState(3);
  const slowMoEnergyRef = useRef(100);
  const setPlayerSkin = (skin: string, save: boolean = true) => {};
  const [bossesKilled, setBossesKilled] = useState(0);
  const bossesKilledRef = useRef(0);
  const tempDamageMultiplierRef = useRef(1.0);
  const [shopOpen, setShopOpenState] = useState(false);
  const shopOpenRef = useRef(false);
  const setShopOpen = (val: boolean | ((p: boolean) => boolean)) => {
    setShopOpenState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      shopOpenRef.current = next;
      return next;
    });
  };

  const [isPaused, setIsPausedState] = useState(false);
  const isPausedRef = useRef(false);
  const setIsPaused = (val: boolean | ((p: boolean) => boolean)) => {
    setIsPausedState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      isPausedRef.current = next;
      if (next) {
        cyberAudio.stopGameplayMusic();
      } else {
        cyberAudio.startGameplayMusic();
      }
      return next;
    });
  };

  // Audio mute helper state
  const [muted, setMuted] = useState(false);

  // Toggle Controls Manual screen overlay modal
  const [showControls, setShowControls] = useState(false);

  // Compass Heading Name Generator based on vector angles
  const getHeadingName = (vx: number, vy: number) => {
    if (Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2) return "STATIONARY";
    const angle = Math.atan2(vy, vx) * (180 / Math.PI);
    if (angle >= -22.5 && angle < 22.5) return "EAST";
    if (angle >= 22.5 && angle < 67.5) return "SOUTH-EAST";
    if (angle >= 67.5 && angle < 112.5) return "SOUTH";
    if (angle >= 112.5 && angle < 157.5) return "SOUTH-WEST";
    if (angle >= 157.5 || angle < -157.5) return "WEST";
    if (angle >= -157.5 && angle < -112.5) return "NORTH-WEST";
    if (angle >= -112.5 && angle < -67.5) return "NORTH";
    return "NORTH-EAST";
  };

  // Local engine matrices (running outside state to avoid frame drops)
  const engineRef = useRef<{
    player: Player;
    enemies: Enemy[];
    projectiles: Projectile[];
    particles: Particle[];
    grid: WorldGridSegment[];
    wallsOnly?: WorldGridSegment[];
    camera: { x: number; y: number; shake: number };
    keys: { [key: string]: boolean };
    mouse: { x: number; y: number };
    wave: number;
    gameTime: number;
    bossFight: {
      active: boolean;
      phase: number;
      attackTimer: number;
      actionState: string;
    };
    unlockedUpgrades: { [key: string]: number };
    pickups: Array<{ id: string; type: string; x: number; y: number; size: number; amount: number }>;
  }>({
    player: {
      x: 300,
      y: 400,
      vx: 0,
      vy: 0,
      width: 25,
      height: 40,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      energy: 100,
      maxEnergy: 100,
      activeWeaponIndex: 0,
      weapons: [
        { id: "katana", name: "ENERGY KATANA", type: "katana", ammo: 999, maxAmmo: 999, fireRate: 250, damage: 45, lastFired: 0, range: 75, desc: "Slices through metal and bullet-streams", color: "#10b981", soundPitch: 1 },
        { id: "pistol", name: "SMART PISTOL", type: "pistol", ammo: 120, maxAmmo: 120, fireRate: 150, damage: 12, lastFired: 0, range: 350, desc: "Holographic seeking tracer ammunition", color: "#06b6d4", soundPitch: 600 }
      ],
      movementState: "normal",
      dashCooldown: 0,
      dashTimer: 0,
      slideTimer: 0,
      wallRunSide: null,
      wallRunAngle: 0,
      grapplePoint: null,
      grappleT: 0,
      slowMoTimer: 0,
      slowMoActive: false,
      slowMoEnergy: 100,
      nanoInjectors: 3,
      stylePoints: 0,
      comboMultiplier: 1,
      comboTimer: 0,
      facingAngle: 0
    },
    enemies: [],
    projectiles: [],
    particles: [],
    grid: [],
    camera: { x: 0, y: 0, shake: 0 },
    keys: {},
    mouse: { x: 300, y: 400 },
    wave: 1,
    gameTime: 0,
    bossFight: {
      active: false,
      phase: 1,
      attackTimer: 0,
      actionState: "intro"
    },
    unlockedUpgrades: {},
    pickups: []
  });

  // Apply persistent upgrades to player stats on load
  useEffect(() => {
    engineRef.current.unlockedUpgrades = unlockedUpgrades;
    const player = engineRef.current.player;

    // HP modification with armor passive enhancement
    const hpUp = unlockedUpgrades["cyber_core"] || 0;
    let extraHP = 0;
    if (equippedArmor === "titan_set") extraHP += 100;
    if (equippedArmor === "celestial_set") extraHP += 50;

    // Armor Enchant HP
    let enchantHP = 0;
    const activeArmorEnchant = armorEnchants ? armorEnchants[equippedArmor] : null;
    if (activeArmorEnchant) {
      const type = getEnchantType(activeArmorEnchant);
      const lvl = getEnchantLevel(activeArmorEnchant);
      if (type === "vitality") enchantHP = lvl * 15;
    }
    let perkHP = 0;
    if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("overcharged_core")) {
      perkHP = 50; // +50 HP max chassis boost
    }
    player.maxHealth = 100 + hpUp * 25 + extraHP + enchantHP + (prestigeLevel * 10) + perkHP;
    if (Array.isArray(activeMutators) && activeMutators.includes("hollow_hull")) {
      player.maxHealth = Math.round(player.maxHealth * 0.5);
    }
    player.health = player.maxHealth;

    // Shield modification with armor passive enhancement
    const shUp = unlockedUpgrades["nano_skin"] || 0;
    let extraShield = 0;
    if (equippedArmor === "shadow_set") extraShield += 25;
    if (equippedArmor === "crystal_set") extraShield += 35;
    if (equippedArmor === "storm_set") extraShield += 40;

    // Armor Enchant Shield
    let enchantShield = 0;
    if (activeArmorEnchant) {
      const type = getEnchantType(activeArmorEnchant);
      const lvl = getEnchantLevel(activeArmorEnchant);
      if (type === "barrier") enchantShield = lvl * 15;
    }
    
    let perkShield = 0;
    if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("nano_reinforced_plating")) {
      perkShield = 50; // +50 Shield limit
    }
    player.maxShield = 50 + shUp * 25 + extraShield + enchantShield + (prestigeLevel * 5) + perkShield;
    if (Array.isArray(activeMutators) && activeMutators.includes("shield_depletion")) {
      player.maxShield = 0;
    }
    player.shield = player.maxShield;

    // Nano-Core Stim repair injectors (Enhanced by stim_overdrive upgrade up to 3 extra charges)
    const stimLevel = unlockedUpgrades["stim_overdrive"] || 0;
    const maxStims = 3 + stimLevel;
    player.nanoInjectors = maxStims;
    setNanoInjectors(maxStims);

    player.skinId = equippedArmor;

    setChassisMaxHealth(player.maxHealth);
    setChassisHealth(player.health);
    setChassisMaxShield(player.maxShield);
    setChassisShield(player.shield);

    // Populate active weapons dynamically from custom hotbar loadout
    const resolvedWeapons: any[] = [];
    if (Array.isArray(equippedWeapons)) {
      // Ensure ALL_WEAPONS is fully augmented with WEAPONS_CATALOG dynamically at load time
      try {
        WEAPONS_CATALOG.forEach((w) => {
          if (!ALL_WEAPONS[w.id]) {
            ALL_WEAPONS[w.id] = {
              id: w.id,
              name: w.name,
              type: w.type,
              ammo: w.ammo,
              maxAmmo: w.ammo,
              fireRate: w.fireRate,
              damage: w.damage,
              lastFired: 0,
              range: w.range,
              desc: w.desc,
              color: w.color,
              soundPitch: w.type === "katana" ? 2 : (w.type === "shotgun" ? 220 : w.type === "railgun" ? 100 : w.type === "gravity" ? 150 : 500)
            };
          }
        });
      } catch (err) {
        console.error("Dynamic loading error in GameCanvas setup:", err);
      }

      equippedWeapons.forEach((id) => {
        if (id && ALL_WEAPONS[id]) {
          const baseWp = ALL_WEAPONS[id];
          const activeWpEnchant = weaponEnchants ? weaponEnchants[baseWp.id] : null;
          
          let bonusDamage = 0;
          let fireRateMultiplier = 1;
          let ammoMultiplier = 1;

          if (activeWpEnchant) {
            const type = getEnchantType(activeWpEnchant);
            const lvl = getEnchantLevel(activeWpEnchant);
            if (type === "damage") {
              bonusDamage = Math.round(baseWp.damage * (lvl * 0.12)); // +12% damage per level
            } else if (type === "cooldown") {
              fireRateMultiplier = Math.max(0.5, 1 - (lvl * 0.08)); // -8% fireRate per level (faster firing)
            } else if (type === "capacity") {
              ammoMultiplier = 1 + (lvl * 0.2); // +20% capacity per level
            }
          }

          const maxAmmoCalculated = Math.round(baseWp.maxAmmo * ammoMultiplier);
          const prestigeDmgMult = 1 + (prestigeLevel || 0) * 0.15;
          let mutatorFireRateMult = 1;
          if (Array.isArray(activeMutators) && activeMutators.includes("chrono_drag")) {
            mutatorFireRateMult = 1.30; // 30% slower fire cycles (higher cooldown millisecond value)
          }

          let perkFireRateMult = 1;
          if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("hyper_drive_weapons")) {
            perkFireRateMult = 0.70; // 30% faster firing rate (less cooldown time)
          }

          resolvedWeapons.push({
            ...baseWp,
            damage: Math.round((baseWp.damage + bonusDamage) * prestigeDmgMult),
            fireRate: Math.max(50, Math.round(baseWp.fireRate * fireRateMultiplier * mutatorFireRateMult * perkFireRateMult)),
            maxAmmo: maxAmmoCalculated,
            ammo: maxAmmoCalculated
          });
        }
      });
    }
    if (resolvedWeapons.length === 0) {
      resolvedWeapons.push({ ...ALL_WEAPONS["katana"], ammo: ALL_WEAPONS["katana"].maxAmmo });
      resolvedWeapons.push({ ...ALL_WEAPONS["pistol"], ammo: ALL_WEAPONS["pistol"].maxAmmo });
    }
    player.weapons = resolvedWeapons;
    
    // Safety check for active weapon index bounds
    if (player.activeWeaponIndex >= resolvedWeapons.length) {
      player.activeWeaponIndex = 0;
    }
    setActiveWeapon({ ...resolvedWeapons[player.activeWeaponIndex] });

    // Initial message trigger
    onTriggerWhisper("CHASSIS RE-LINKS. WELCOME BACK, MERCENARY. CLEAR DISTRICT 09.");
  }, [unlockedUpgrades, equippedWeapons, equippedArmor, weaponEnchants, armorEnchants]);

  // Handle Resize dynamics (with robust ResizeObserver setup)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rAFId: number;

    const resizeObserver = new ResizeObserver((entries) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      rAFId = window.requestAnimationFrame(() => {
        for (let entry of entries) {
          canvas.width = entry.contentRect.width || 800;
          canvas.height = entry.contentRect.height || 500;
        }
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (rAFId) {
        window.cancelAnimationFrame(rAFId);
      }
    };
  }, []);

  // Set up local map segments & buildings
  const buildWorldGrid = () => {
    const segments: WorldGridSegment[] = [];

    // Giant bounding outer border
    segments.push({ x: -1000, y: -1000, width: 2500, height: 40, type: "wall", neonColor: "#1e1b4b" });
    segments.push({ x: -1000, y: 1500, width: 2500, height: 40, type: "wall", neonColor: "#1e1b4b" });
    segments.push({ x: -1000, y: -1000, width: 40, height: 2500, type: "wall", neonColor: "#1e1b4b" });
    segments.push({ x: 1500, y: -1000, width: 40, height: 2500, type: "wall", neonColor: "#1e1b4b" });

    // Inner architecture bento slabs
    segments.push({ x: -100, y: -200, width: 350, height: 80, type: "wall", neonColor: "#059669" });
    segments.push({ x: 400, y: -200, width: 350, height: 80, type: "wall", neonColor: "#06b6d4" });

    // Middle core platform
    segments.push({ x: 100, y: 250, width: 120, height: 120, type: "neon_billboard", neonColor: "#f43f5e", flicker: true });
    segments.push({ x: 550, y: 250, width: 125, height: 120, type: "hologram", neonColor: "#38bdf8" });

    // Left outer cover slabs
    segments.push({ x: -400, y: 500, width: 60, height: 350, type: "wall", neonColor: "#a855f7" });
    segments.push({ x: -200, y: 800, width: 200, height: 60, type: "wall", neonColor: "#4f46e5" });

    // Right outer platforms
    segments.push({ x: 900, y: 500, width: 60, height: 350, type: "wall", neonColor: "#db2777" });
    segments.push({ x: 800, y: 800, width: 200, height: 60, type: "wall", neonColor: "#fbbf24" });

    // Bottom structural complex
    segments.push({ x: 150, y: 1100, width: 500, height: 70, type: "wall", neonColor: "#059669" });

    // Floating latch grapple anchors (green tiny squares)
    segments.push({ x: 0, y: 150, width: 16, height: 16, type: "grapple_anchor", neonColor: "#34d399" });
    segments.push({ x: 750, y: 150, width: 16, height: 16, type: "grapple_anchor", neonColor: "#34d399" });
    segments.push({ x: -300, y: 400, width: 16, height: 16, type: "grapple_anchor", neonColor: "#34d399" });
    segments.push({ x: 1100, y: 400, width: 16, height: 16, type: "grapple_anchor", neonColor: "#34d399" });
    segments.push({ x: 400, y: 650, width: 16, height: 16, type: "grapple_anchor", neonColor: "#34d399" });

    engineRef.current.grid = segments;
    engineRef.current.wallsOnly = segments.filter((segment) => segment.type === "wall" || segment.type === "neon_billboard");
  };

  // Wave Manager
  const triggerNextWave = () => {
    const engine = engineRef.current;
    engine.wave += 1;
    cyberAudio.playHack();

    const whispers = [
      `THREAT RISING. SECTOR WAVE ${engine.wave} TRIGGERED. ELIMINATE ENEMY SQUADRON.`,
      `TACTICAL ALERT: DETECTOR SENSORS UNCOVERED HOSTILE UNITS. BEWARE OF Cyberninjas!`,
      `MACHINE RECKONING. THE GOD MALPHAS HAS DISPATCHED HUNTING VECTORS.`
    ];
    onTriggerWhisper(whispers[Math.floor(Math.random() * whispers.length)]);

    // Generate enemies based on wave number (limited dynamically to prevent heavy lag from overcrowding)
    const currentEnemiesCount = engine.enemies.length;
    const maxActiveCap = 18; // optimal count to prevent cluster lag spikes while keeping wave intensity high
    const baseCount = 4 + engine.wave * 2;
    const count = Math.max(2, Math.min(baseCount, maxActiveCap - currentEnemiesCount));
    
    for (let i = 0; i < count; i++) {
      const isNinja = i > 0 && i % 3 === 0;
      const isAndroid = i > 0 && i % 5 === 0;

      const scaleMultiplier = 1 + (engine.gameTime / 10800) * 0.18; // +18% damage/health every 3 minutes
      let mutatorHpMult = 1;
      let mutatorSpeedMult = 1;
      if (Array.isArray(activeMutators) && activeMutators.includes("nightmare_splicers")) {
        mutatorHpMult = 1.50; // +50% enemy raw HP
        mutatorSpeedMult = 1.40; // +40% enemy raw movement speed
      }

      const baseHp = isAndroid ? 110 : isNinja ? 60 : 35;
      const finalHp = Math.round(baseHp * scaleMultiplier * mutatorHpMult);

      engine.enemies.push({
        id: `enemy_${Date.now()}_${i}`,
        type: isNinja ? "ninja" : isAndroid ? "android" : "drone",
        name: isNinja ? "CYBER_NINJA" : isAndroid ? "FAILED_PROTOTYPE_MK3" : "SENTINEL_SWARM",
        x: Math.random() < 0.5 ? -300 : 1100,
        y: Math.random() * 1200,
        vx: 0,
        vy: 0,
        width: isAndroid ? 34 : 20,
        height: isAndroid ? 48 : 20,
        health: finalHp,
        maxHealth: finalHp,
        shield: isNinja ? 20 : 0,
        maxShield: isNinja ? 20 : 0,
        speed: (isNinja ? 3.8 : isAndroid ? 1.5 : 2.6) * mutatorSpeedMult,
        state: "chase",
        shootCooldown: Math.random() * 1000 + 400,
        movementTimer: 0,
        targetX: 0,
        targetY: 0,
        angle: 0,
        color: isNinja ? "#ec4899" : isAndroid ? "#f43f5e" : "#06b6d4",
        aiStateTimer: 0,
        value: isAndroid ? 200 : isNinja ? 150 : 80,
        isStunned: false,
        stunTimer: 0
      });
    }

    // Trigger Boss Fight on wave 3!
    if (engine.wave === 3) {
      spawnBossSaintMalphas();
    }
  };

  // Boss Spawn details
  const spawnBossSaintMalphas = () => {
    const engine = engineRef.current;
    setBossActive(true);
    setBossName("AI SAINT MALPHAS (SKYSCRAPER TELEPRESENCE MATRICES)");
    setBossMaxHealth(1000);
    setBossHealth(1000);

    engine.enemies.push({
      id: "boss_saint_malphas",
      type: "boss",
      name: "AI SAINT MALPHAS",
      x: 380,
      y: 100,
      vx: 0,
      vy: 0,
      width: 70,
      height: 90,
      health: 1000,
      maxHealth: 1000,
      shield: 300,
      maxShield: 300,
      speed: 1,
      state: "idle",
      shootCooldown: 0,
      movementTimer: 0,
      targetX: 380,
      targetY: 100,
      angle: 0,
      color: "#f43f5e",
      aiStateTimer: 0,
      value: 1000,
      isStunned: false,
      stunTimer: 0
    });

    onTriggerWhisper("ALERT: AI SAINT MALPHAS HAS ENTERED THE RUN. PAUSE TIME EMERGES.");
  };

  // Spawns consecutive unique bosses, each with distinctive skins, weapons, and higher stats!
  const spawnSequentialBoss = (count: number) => {
    const engine = engineRef.current;
    
    // Detailed list of 10 designed bosses
    const bossPool = [
      { name: "BEHEMOTH TITAN V9 [HAZARD_UNIT]", subType: "behemoth", color: "#f97316", width: 85, height: 85, speed: 0.8, health: 1800, shield: 500 },
      { name: "LILITH RED QUEEN [TELEPORT_CHASSIS]", subType: "lilith", color: "#ec4899", width: 55, height: 75, speed: 1.6, health: 2600, shield: 600 },
      { name: "ORION HIGH OVERSEER [SATELLITE INTERCEPT]", subType: "orion", color: "#f9ec2c", width: 80, height: 84, speed: 1.1, health: 3400, shield: 800 },
      { name: "XENON SYNERGETIC APEX OVERLORD", subType: "xenon", color: "#a855f7", width: 90, height: 90, speed: 1.0, health: 4200, shield: 1000 },
      { name: "NEMESIS DUAL SLASHER SQUADRON", subType: "nemesis", color: "#00f3ff", width: 62, height: 82, speed: 1.8, health: 5000, shield: 1200 },
      { name: "ASTRAEA DEFENDER INTEGRAL", subType: "astraea", color: "#06b6d4", width: 75, height: 75, speed: 1.3, health: 5800, shield: 1400 },
      { name: "KRONOS CHRONO DEVOURER", subType: "kronos", color: "#10b981", width: 90, height: 90, speed: 1.25, health: 6600, shield: 1600 },
      { name: "ASMODEUS ANNIHILATOR APEX CONSTRUCT", subType: "asmodeus", color: "#f43f5e", width: 100, height: 100, speed: 0.9, health: 7400, shield: 1800 },
      { name: "VALKYRIE BLADE MATRIX EXTREME", subType: "valkyrie", color: "#fbbf24", width: 50, height: 70, speed: 1.9, health: 8200, shield: 2000 },
      { name: "ZEUS COBALT SUPERCONDUCTOR", subType: "zeus", color: "#3b82f6", width: 82, height: 82, speed: 1.4, health: 9000, shield: 2200 }
    ];

    let bName = "";
    let bMaxHealth = 1000;
    let bShield = 300;
    let bColor = "#ff0055";
    let bSubType = "behemoth";
    let bSpeed = 1.0;
    let bWidth = 80;
    let bHeight = 80;

    // We decrement/offset count because Malphas is the 1st boss (count = 0 in terms of consecutive pool checks indices)
    const poolIdx = count - 1;

    if (poolIdx >= 0 && poolIdx < bossPool.length) {
      const bData = bossPool[poolIdx];
      bName = bData.name;
      bMaxHealth = bData.health;
      bShield = bData.shield;
      bColor = bData.color;
      bSubType = bData.subType;
      bSpeed = bData.speed;
      bWidth = bData.width;
      bHeight = bData.height;
    } else {
      // Procedurally generated completely endless boss configurations representing deep infinite realms!
      const prefix = ["APOLLO", "ATHENA", "NEMESIS", "OSIRIS", "PROMETHEUS", "VULCAN", "NEPTUNE", "SHIVA", "HERMES", "CYBERIUS", "KRONOFF", "TYPHOON", "HYPERION", "OBLIVION"];
      const suffix = ["QUANTUM CORE", "STAR DESTROYER", "SINGULARITY MATRIX", "SENTINEL CONSTRUCT", "LEVEL OVERLORD", "SPLICER REAPER", "NANO DOOMSDAY", "VECTOR COLOSSUS"];
      const subTypes = ["behemoth", "lilith", "orion", "kronos", "nemesis", "apex"];
      const colors = ["#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#ec4899", "#2dd4bf", "#f97316"];
      
      const seed = count + 7;
      const rndPrefix = prefix[seed % prefix.length];
      const rndSuffix = suffix[(seed * 3) % suffix.length];
      
      bName = `${rndPrefix} ${rndSuffix} [LVL ${count}]`;
      bSubType = subTypes[seed % subTypes.length];
      bColor = colors[seed % colors.length];
      bWidth = 65 + (seed % 5) * 8;
      bHeight = 75 + (seed % 4) * 8;
      bSpeed = 0.95 + (seed % 3) * 0.25;
      bMaxHealth = 9000 + (count - 10) * 1200; // infinitely scaling
      bShield = 2200 + (count - 10) * 400; // infinitely scaling
    }

    setBossMaxHealth(bMaxHealth);
    setBossHealth(bMaxHealth);
    setBossName(`${bName} (${bMaxHealth} AP // PHASED)`);
    setBossActive(true);

    engine.enemies.push({
      id: `boss_sequential_${Date.now()}`,
      type: "boss",
      bossSubType: bSubType,
      name: bName,
      x: 380,
      y: 100,
      vx: 0,
      vy: 0,
      width: bWidth,
      height: bHeight,
      health: bMaxHealth,
      maxHealth: bMaxHealth,
      decay: 0.05,
      shield: bShield,
      maxShield: bShield,
      speed: bSpeed,
      state: "idle",
      shootCooldown: 0,
      movementTimer: 0,
      targetX: 380,
      targetY: 100,
      angle: 0,
      color: bColor,
      aiStateTimer: 0,
      value: 1000 + count * 600,
      isStunned: false,
      stunTimer: 0
    });

    onTriggerWhisper(`TACTICAL DETECTOR: ${bName} HAS MATERIALIZED IN CHASSIS DISTRICT.`);
    cyberAudio.playExplosion();
  };

  // Keyboard and dynamic mouse state triggers
  useEffect(() => {
    const engine = engineRef.current;
    
    // Build initial layout
    buildWorldGrid();

    // Spawn first enemies
    triggerNextWave();

    // Capture muted state
    setMuted(cyberAudio.getMuteState());

    // Stop menu ambient and start energetic gameplay music!
    cyberAudio.stopAmbient();
    cyberAudio.startGameplayMusic();

    const handleKeyDown = (e: KeyboardEvent) => {
      engine.keys[e.key.toLowerCase()] = true;

      // Handle Weapon selecting keys (1-5)
      if (e.key === "1") changeWeapon(0);
      if (e.key === "2") changeWeapon(1);
      if (e.key === "3") changeWeapon(2);
      if (e.key === "4") changeWeapon(3);
      if (e.key === "5") changeWeapon(4);

      // Dash Slide trigger
      if (e.key === " " || e.code === "Space") {
        triggerDash();
      }

      // Enter Bullet-Time Slow motion
      if (e.key === "Shift") {
        engine.player.slowMoActive = !engine.player.slowMoActive;
        cyberAudio.playBulletTime(engine.player.slowMoActive);
      }

      // Tab, t, or b key toggles shop open
      if (e.key === "Tab" || e.key === "b" || e.key === "B" || e.key === "t" || e.key === "T") {
        e.preventDefault();
        setShopOpen((prev) => {
          const next = !prev;
          if (next) {
            cyberAudio.playHack();
          } else {
            cyberAudio.playLaser(400, "sine");
          }
          return next;
        });
      }

      // Q for active Nano Stimpack Repair
      if (e.key === "q" || e.key === "Q") {
        triggerCoreRepair();
      }

      // Escape, p, or P keys toggles game pause states
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        setIsPaused((prev) => {
          const next = !prev;
          cyberAudio.playLaser(next ? 300 : 500, "triangle");
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;

      screenMouseRef.current = { x: screenX, y: screenY };

      // Translate context relative coordinates
      engine.mouse.x = screenX + engine.camera.x;
      engine.mouse.y = screenY + engine.camera.y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isPausedRef.current) return; // Prevent fire while paused
      if (e.button === 0) {
        // Left click: Fire primary
        triggerFire();
      } else if (e.button === 2) {
        // Right click: Trigger grappling hook latch
        e.preventDefault();
        triggerGrapplingHook();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("contextmenu", handleContextMenu);

    // Active Engine Render Loop
    let animId: number;

    const gameLoop = () => {
      const engine = engineRef.current;
      // Re-align mouse world coordinates to current camera coordinates to prevent drift
      engine.mouse.x = screenMouseRef.current.x + engine.camera.x;
      engine.mouse.y = screenMouseRef.current.y + engine.camera.y;

      if (!shopOpenRef.current && !isPausedRef.current) {
        updateEngine();
      }
      drawEngine();
      animId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      cancelAnimationFrame(animId);

      // Stop gameplay sequencer and return to low synth-wave title ambient!
      cyberAudio.stopGameplayMusic();
      cyberAudio.startAmbient();
    };
  }, []);

  // Set weapon index safely
  const changeWeapon = (index: number) => {
    const engine = engineRef.current;
    if (index >= 0 && index < engine.player.weapons.length) {
      engine.player.activeWeaponIndex = index;
      setActiveWeapon({ ...engine.player.weapons[index] });
      cyberAudio.playHack();
    }
  };

  // Trigger dashing / sliding
  const triggerDash = () => {
    const engine = engineRef.current;
    const player = engine.player;
    if (player.dashCooldown > 0) return;

    // Movement angle
    let dx = 0;
    let dy = 0;
    if (engine.keys["w"]) dy = -1;
    if (engine.keys["s"]) dy = 1;
    if (engine.keys["a"]) dx = -1;
    if (engine.keys["d"]) dx = 1;

    // Default direction is facing forward mouse
    if (dx === 0 && dy === 0) {
      const angle = Math.atan2(engine.mouse.y - player.y, engine.mouse.x - player.x);
      dx = Math.cos(angle);
      dy = Math.sin(angle);
    }

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;

    // Slash push speed
    player.movementState = "dashing";
    player.dashTimer = 10; // frames

    // Nano-reinforced plating perk -> Instant shield recharge to maximum on dash!
    if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("nano_reinforced_plating")) {
      player.shield = player.maxShield;
      for (let i = 0; i < 8; i++) {
        engine.particles.push({
          id: generateFastId("p_dash_shield"),
          x: player.x + player.width / 2,
          y: player.y + player.height / 2,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 - 2,
          color: "#3b82f6",
          size: Math.random() * 2 + 1,
          alpha: 1,
          decay: 0.05,
          type: "glow"
        });
      }
    }

    const hyperLvl = engine.unlockedUpgrades["hyper_thrusters"] || 0;
    player.dashCooldown = Math.max(10, 32 - hyperLvl * 5); // Reduce cooldown frame length per upgrade!
    player.vx = dx * 16;
    player.vy = dy * 16;

    // Create stylish speed trail particles
    for (let i = 0; i < 15; i++) {
      engine.particles.push({
        id: generateFastId("p_trail"),
        x: player.x + player.width / 2 + Math.random() * 20 - 10,
        y: player.y + player.height / 2 + Math.random() * 20 - 10,
        vx: -dx * (Math.random() * 4 + 2),
        vy: -dy * (Math.random() * 4 + 2),
        color: Math.random() < 0.5 ? player.weapons[player.activeWeaponIndex].color : "#ffffff",
        size: Math.random() * 4 + 2,
        alpha: 0.8,
        decay: 0.05,
        type: "trail"
      });
    }

    cyberAudio.playDash();
    addStylePoints(25, "MOMENTUM DASH");
  };

  // Grappling Hook Action - Latch onto nearest ceiling, anchor or wall block!
  const triggerGrapplingHook = () => {
    const engine = engineRef.current;
    const player = engine.player;

    // Find nearest grapple anchor or ceiling coordinates
    let bestAnchor: WorldGridSegment | null = null;
    let bestDist = 280;
    let bestDistSq = bestDist * bestDist;

    const numG = engine.grid.length;
    for (let i = 0; i < numG; i++) {
      const segment = engine.grid[i];
      if (segment.type === "grapple_anchor" || segment.type === "wall") {
        const ax = segment.x + segment.width / 2;
        const ay = segment.y + segment.height / 2;
        const dx = ax - player.x;
        const dy = ay - player.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestAnchor = segment;
        }
      }
    }

    if (bestAnchor) {
      const seg: WorldGridSegment = bestAnchor;
      player.grapplePoint = { x: seg.x + seg.width / 2, y: seg.y + seg.height / 2 };
      player.movementState = "grappling";
      player.grappleT = 0;
      cyberAudio.playHack();
      addStylePoints(40, "GRAPPLING SWING");
    } else {
      // Draw failed sparkle
      engine.particles.push({
        id: `fail_latch_${Date.now()}`,
        x: engine.mouse.x,
        y: engine.mouse.y,
        vx: 0,
        vy: -0.5,
        color: "#f43f5e",
        size: 15,
        alpha: 0.9,
        decay: 0.04,
        type: "text",
        text: "OUT OF RANGE"
      });
    }
  };

  // Trigger Q Core Nano Stimpack Repair
  const triggerCoreRepair = () => {
    const engine = engineRef.current;
    const player = engine.player;

    if (player.health <= 0) return; // Can't heal in death
    
    // Check if player has nanoInjectors left
    if (!player.nanoInjectors || player.nanoInjectors <= 0) {
      cyberAudio.playGlitch();
      onTriggerWhisper("REPAIR FAULT: NANO REPAIRS EXHAUSTED.");
      return;
    }

    if (player.health >= player.maxHealth && player.shield >= player.maxShield) {
      onTriggerWhisper("SYSTEM NORMAL: CHASSIS STABLE.");
      return;
    }

    // Decrement charge
    player.nanoInjectors--;
    setNanoInjectors(player.nanoInjectors);

    // Apply repair heal & shield values (Enchanced by stim_overdrive microchips)
    const stimLevel = engine.unlockedUpgrades["stim_overdrive"] || 0;
    const healHpBonus = 40 + stimLevel * 10;
    const healShieldBonus = 25 + stimLevel * 5;

    const healedHp = Math.min(player.maxHealth, player.health + healHpBonus);
    const addedShield = Math.min(player.maxShield, player.shield + healShieldBonus);
    
    player.health = healedHp;
    player.shield = addedShield;
    setChassisHealth(healedHp);
    setChassisShield(addedShield);

    // Sound alert & styling
    cyberAudio.playHack();
    onTriggerWhisper(`NANO-CORE INJECTOR ACTIVE: +${healHpBonus} HP, +${healShieldBonus} SHIELD. (REMAINING: ${player.nanoInjectors})`);
    
    // Spawn gorgeous healing visual ring particle
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      engine.particles.push({
        id: `heal_p_${Date.now()}_${angle}`,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: "#10b981",
        size: 4,
        alpha: 1,
        decay: 0.03
      });
    }

    // Spawn green "RECOVERED" text
    engine.particles.push({
      id: `text_heal_${Date.now()}`,
      x: player.x,
      y: player.y - 15,
      vx: 0,
      vy: -0.8,
      color: "#10b981",
      size: 15,
      alpha: 1,
      decay: 0.015,
      type: "text",
      text: "NANO-CORE RESTORE"
    });
  };

  // Fire currently active weapon
  const triggerFire = () => {
    const engine = engineRef.current;
    const player = engine.player;
    const weapon = player.weapons[player.activeWeaponIndex];
    const now = Date.now();

    if (now - weapon.lastFired < weapon.fireRate) return;
    if (weapon.ammo <= 0) {
      cyberAudio.playGlitch();
      return;
    }

    weapon.lastFired = now;
    if (weapon.type !== "katana") {
      weapon.ammo = Math.max(0, weapon.ammo - 1);
      setActiveWeapon({ ...weapon });
    }

    // Roll critical hit based on weapon enchants!
    let isCrit = false;
    let baseDamage = weapon.damage;
    const activeWpEnchant = weaponEnchants ? weaponEnchants[weapon.id] : null;
    if (activeWpEnchant) {
      const type = getEnchantType(activeWpEnchant);
      const lvl = getEnchantLevel(activeWpEnchant);
      if (type === "critical") {
        const critChance = lvl * 0.12; // 12% to 60%
        if (Math.random() < critChance) {
          isCrit = true;
          baseDamage *= 2; // deal double damage!
        }
      }
    }

    const finalDamage = Math.round(baseDamage * tempDamageMultiplierRef.current);

    const startX = player.x + player.width / 2;
    const startY = player.y + player.height / 2;
    const angle = Math.atan2(engine.mouse.y - startY, engine.mouse.x - startX);

    // Bullet effects depending on weapon types
    if (weapon.type === "katana") {
      // Swipe animation slash particles
      const slashAngle = angle;
      cyberAudio.playKatana();

      const katanaLevel = engine.unlockedUpgrades["plasma_katana"] || 0;
      const finalRange = weapon.range * (1 + katanaLevel * 0.12);

      // Check collision with nearby drones within range
      const triggerEnemies = engine.enemies;
      const numEnemies = triggerEnemies.length;
      const enemyThreshold = finalRange + 25;
      const enemyThresholdSq = enemyThreshold * enemyThreshold;
      for (let i = 0; i < numEnemies; i++) {
        const enemy = triggerEnemies[i];
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const dx = ex - startX;
        const dy = ey - startY;
        const distSq = dx * dx + dy * dy;
        if (distSq < enemyThresholdSq) {
          damageEnemy(enemy, finalDamage, true, isCrit);
        }
      }

      // Deflect nearby opponent bullets!
      const triggerProjs = engine.projectiles;
      const numProjs = triggerProjs.length;
      const projThreshold = finalRange + 10;
      const projThresholdSq = projThreshold * projThreshold;
      for (let i = 0; i < numProjs; i++) {
        const p = triggerProjs[i];
        if (p.owner === "enemy") {
          const dx = p.x - startX;
          const dy = p.y - startY;
          const distSq = dx * dx + dy * dy;
          if (distSq < projThresholdSq) {
            // Deflect back!
            p.owner = "player";
            p.vx = -p.vx * 1.4;
            p.vy = -p.vy * 1.4;
            p.color = "#10b981";
            addStylePoints(20, "BULLET SHRED");
          }
        }
      }

      // Spawn progressive high-fidelity crescent swipe particle
      engine.particles.push({
        id: `swipe_${Date.now()}_${Math.random()}`,
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        color: weapon.color || "#10b981",
        size: finalRange,
        alpha: 1.0,
        decay: 0.08,
        type: "swipe",
        progress: 0,
        startAngle: angle - Math.PI / 2.5,
        endAngle: angle + Math.PI / 2.5,
        thickness: 10
      });

      // Spawn slash trace particles (glowing tiny sparks) for extra impact juice
      for (let i = 0; i < 8; i++) {
        const sweep = slashAngle + (Math.random() * 1.0 - 0.5);
        const distRatio = Math.random() * 0.95; // strictly within the range of the weapon
        engine.particles.push({
          id: `p_katana_${Date.now()}_${i}_${Math.random()}`,
          x: startX + Math.cos(sweep) * (finalRange * distRatio),
          y: startY + Math.sin(sweep) * (finalRange * distRatio),
          vx: Math.cos(sweep) * (Math.random() * 4 + 2),
          vy: Math.sin(sweep) * (Math.random() * 4 + 2),
          color: weapon.color || "#10b981",
          size: Math.random() * 2.8 + 2.2,
          alpha: 1.0,
          decay: 0.06,
          type: "glow"
        });
      }
    } else if (weapon.type === "pistol") {
      // Smart targeting bullet
      cyberAudio.playLaser(weapon.soundPitch, "sine");
      engine.projectiles.push({
        id: `bullet_${Date.now()}`,
        owner: "player",
        x: startX,
        y: startY,
        vx: Math.cos(angle) * 11,
        vy: Math.sin(angle) * 11,
        damage: finalDamage,
        isCrit: isCrit,
        type: "laser",
        color: weapon.color,
        size: 5,
        age: 0,
        maxAge: 80
      });
    } else if (weapon.type === "shotgun") {
      cyberAudio.playLaser(weapon.soundPitch, "sawtooth");
      // Five shell cone displacement spreads
      for (let i = -2; i <= 2; i++) {
        const offset = i * 0.12;
        engine.projectiles.push({
          id: `slug_${Date.now()}_${i}`,
          owner: "player",
          x: startX,
          y: startY,
          vx: Math.cos(angle + offset) * 9,
          vy: Math.sin(angle + offset) * 9,
          damage: finalDamage,
          isCrit: isCrit,
          type: "slug",
          color: weapon.color,
          size: 6,
          age: 0,
          maxAge: 25
        });
      }
    } else if (weapon.type === "railgun") {
      cyberAudio.playLaser(weapon.soundPitch, "square");
      engine.camera.shake = 18;

      // Draw instant vector line that pierces everything
      engine.projectiles.push({
        id: `rail_${Date.now()}`,
        owner: "player",
        x: startX,
        y: startY,
        vx: Math.cos(angle) * 22,
        vy: Math.sin(angle) * 22,
        damage: finalDamage,
        isCrit: isCrit,
        type: "laser",
        color: weapon.color,
        size: 8,
        age: 0,
        maxAge: 40
      });

      // Spawn hyper rail burst ring particles along the laser trajectory
      for (let step = 20; step < 400; step += 40) {
        engine.particles.push({
          id: `p_rail_ring_${Date.now()}_${step}`,
          x: startX + Math.cos(angle) * step,
          y: startY + Math.sin(angle) * step,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          color: weapon.color,
          size: 14,
          alpha: 0.9,
          decay: 0.10,
          type: "grid"
        });
      }
    } else if (weapon.type === "gravity") {
      // Shoot a physical vortex capsule that sucks enemies
      cyberAudio.playLaser(weapon.soundPitch, "triangle");
      engine.projectiles.push({
        id: `gravity_${Date.now()}`,
        owner: "player",
        x: startX,
        y: startY,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        damage: finalDamage,
        isCrit: isCrit,
        type: "gravity",
        color: weapon.color,
        size: 14,
        age: 0,
        maxAge: 70
      });
    }

    // --- ABSORBED ENEMY ESSENCE EXTRA ABILITIES ---
    if (bossesKilled >= 1) {
      // Malphas Eye Orbs: Fire an extra tracking/forward-aimed seeking projectile pair
      let nearest: any = null;
      let minDistSq = 380 * 380;
      const numE = engine.enemies.length;
      for (let i = 0; i < numE; i++) {
        const e = engine.enemies[i];
        if (e.health > 0) {
          const dx = (e.x + e.width / 2) - startX;
          const dy = (e.y + e.height / 2) - startY;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistSq) {
            minDistSq = dSq;
            nearest = e;
          }
        }
      }
      const boltAngle = nearest ? Math.atan2((nearest.y + nearest.height / 2) - startY, (nearest.x + nearest.width / 2) - startX) : angle;
      
      // Spawn two light blue energy tracking bolts from the sides
      for (let offset of [-0.35, 0.35]) {
        engine.projectiles.push({
          id: `malphas_bolt_${Date.now()}_${offset}`,
          owner: "player",
          x: startX + Math.cos(angle + Math.PI / 2) * (offset * 15),
          y: startY + Math.sin(angle + Math.PI / 2) * (offset * 15),
          vx: Math.cos(boltAngle + offset * 0.2) * 11,
          vy: Math.sin(boltAngle + offset * 0.2) * 11,
          damage: 8,
          type: "laser",
          color: "#00f3ff",
          size: 4,
          age: 0,
          maxAge: 75
        });
      }
    }

    if (bossesKilled >= 2) {
      // Behemoth shockwave on heavy firing
      if (weapon.type !== "katana") {
        engine.projectiles.push({
          id: `behemoth_blast_${Date.now()}`,
          owner: "player",
          x: startX,
          y: startY,
          vx: Math.cos(angle) * 7.5,
          vy: Math.sin(angle) * 7.5,
          damage: 15,
          type: "wave",
          color: "#f97316",
          size: 14,
          age: 0,
          maxAge: 20
        });

        // Push away nearby bullets
        const numP = engine.projectiles.length;
        for (let i = 0; i < numP; i++) {
          const p = engine.projectiles[i];
          if (p.owner === "enemy") {
            const dx = p.x - startX;
            const dy = p.y - startY;
            const distSq = dx * dx + dy * dy;
            if (distSq < 5625) { // 75 * 75
              p.owner = "player";
              p.vx = -p.vx * 1.2;
              p.vy = -p.vy * 1.2;
              p.color = "#f97316";
            }
          }
        }
      }
    }

    if (bossesKilled >= 3) {
      // Lilith Plasma Blade-Wave on Katana slice
      if (weapon.type === "katana") {
        engine.projectiles.push({
          id: `lilith_blade_${Date.now()}`,
          owner: "player",
          x: startX,
          y: startY,
          vx: Math.cos(angle) * 11,
          vy: Math.sin(angle) * 11,
          damage: 32,
          type: "wave",
          color: "#ec4899",
          size: 20,
          age: 0,
          maxAge: 40
        });
        
        // Spawn aesthetic blink effects
        for (let i = 0; i < 6; i++) {
          engine.particles.push({
            id: `lilith_part_${Date.now()}_${i}`,
            x: startX,
            y: startY,
            vx: Math.cos(angle + (Math.random() * 0.6 - 0.3)) * 6,
            vy: Math.sin(angle + (Math.random() * 0.6 - 0.3)) * 6,
            color: "#ec4899",
            size: 4,
            alpha: 0.9,
            decay: 0.05,
            type: "spark"
          });
        }
      }
    }
  };

  // Perform Damage on Enemies
  const damageEnemy = (enemy: Enemy, amount: number, isMelee = false, isCrit = false) => {
    const engine = engineRef.current;
    
    // Combat Overdrive Upgrade Multiplier (Adds +15% more kinetic pulse damage per level)
    const dmgLevel = engine.unlockedUpgrades["combat_overdrive"] || 0;
    const finalAmount = amount * (1 + dmgLevel * 0.15);

    // Shield absorb
    if (enemy.shield > 0) {
      enemy.shield = Math.max(0, enemy.shield - finalAmount);
      cyberAudio.playGlitch();
    } else {
      enemy.health -= finalAmount;
    }

    // Impact effect sparkles
    const sparkCount = isCrit ? 12 : 4;
    for (let i = 0; i < sparkCount; i++) {
      engine.particles.push({
        id: generateFastId("p_dmg"),
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        vx: (Math.random() * (isCrit ? 10 : 6) - (isCrit ? 5 : 3)),
        vy: (Math.random() * (isCrit ? 10 : 6) - (isCrit ? 5 : 3)),
        color: isCrit ? "#fbbf24" : enemy.color,
        size: Math.random() * (isCrit ? 4 : 3) + 1.5,
        alpha: 0.9,
        decay: isCrit ? 0.05 : 0.08,
        type: "spark"
      });
    }

    if (isCrit) {
      engine.particles.push({
        id: generateFastId("p_crit_text"),
        x: enemy.x + enemy.width / 2,
        y: enemy.y - 12,
        vx: (Math.random() * 2 - 1),
        vy: -2.0,
        color: "#fbbf24",
        size: 15,
        alpha: 1.0,
        decay: 0.04,
        type: "text",
        text: "⚡CRIT!"
      });
    }

    // Update Boss UI if relevant
    if (enemy.type === "boss") {
      setBossHealth(Math.max(0, enemy.health));
    }

    // Check dead
    if (enemy.health <= 0) {
      killEnemy(enemy, isMelee);
    }
  };

  // Handle enemy death behaviors
  const killEnemy = (enemy: Enemy, isMelee = false) => {
    const engine = engineRef.current;

    // Delete enemy from list
    engine.enemies = engine.enemies.filter((cur) => cur.id !== enemy.id);
    
    cyberAudio.playExplosion();
    engine.camera.shake = 12;

    // Inline credit earnings upon every enemy kill (decreased per user request!)
    let baseCredits = enemy.type === "boss" ? 80 : enemy.type === "android" ? 12 : enemy.type === "ninja" ? 8 : 4;
    // Apply decrease in credits obtained based on consecutive bosses killed (user requirement!)
    const scalingFactor = Math.max(0.15, 1.0 - (bossesKilledRef.current * 0.22));
    const finalEarnedCredits = Math.max(1, Math.round(baseCredits * scalingFactor));
    setCredits((prev) => prev + finalEarnedCredits);

    // Scrap ammo scavenger chip: Defeated enemies have percent chance to chamber ranged ammunition
    const scavLvl = engine.unlockedUpgrades["ammo_scavenger"] || 0;
    if (scavLvl > 0 && Math.random() < scavLvl * 0.08) {
      engine.player.weapons.forEach((wp) => {
        if (wp.type !== "katana" && wp.ammo < wp.maxAmmo) {
          wp.ammo = Math.min(wp.maxAmmo, wp.ammo + 1);
        }
      });
    }

    // Let's spawn a quick glowing floating "+D ₩" text particle above the corpse!
    engine.particles.push({
      id: generateFastId("credits_t"),
      x: enemy.x + enemy.width / 2,
      y: enemy.y - 12,
      vx: Math.random() * 1.5 - 0.75,
      vy: -1.2,
      color: "#fbbf24",
      size: 11,
      alpha: 1.0,
      decay: 0.02,
      type: "text",
      text: `+${finalEarnedCredits} ₩`
    });

    // Style and score boosts
    const multiBonus = isMelee ? 2 : 1;
    const styleAmt = enemy.type === "boss" ? 500 : enemy.type === "ninja" ? 150 : 80;
    addStylePoints(styleAmt * multiBonus, isMelee ? "KATANA OZONE EXCISE" : "TACTICAL SECURE");
    
    setScore((prev) => {
      const next = prev + enemy.value;
      scoreRef.current = next;
      return next;
    });

    // Spawn tactical pickups chance: 35% for a drop!
    if (Math.random() < 0.35) {
      const dropType = Math.random() < 0.45 ? "heal" : "shield";
      engine.pickups.push({
        id: `pickup_${Date.now()}_${Math.random()}`,
        type: dropType,
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        size: 14,
        amount: dropType === "heal" ? 25 : 30
      });
    }

    // Spawn custom crafting materials drops (guaranteed for boss, low probability for standard mobs)
    const getRandomMaterial = (rarity: "common" | "uncommon" | "rare"): string => {
      const commons = ["nano_filament", "titanium_alloy", "carbon_nanotube"];
      const uncommons = ["graphene_plate", "coolant_rod", "laser_emitter", "quantum_battery", "rebel_nanite"];
      const rares = ["unstable_plasma", "vortex_core", "cyber_neuro_mesh", "plasma_core", "warp_crystal", "dark_matter", "antimatter_fuel"];

      if (rarity === "common") {
        return commons[Math.floor(Math.random() * commons.length)];
      } else if (rarity === "uncommon") {
        return uncommons[Math.floor(Math.random() * uncommons.length)];
      } else {
        return rares[Math.floor(Math.random() * rares.length)];
      }
    };

    if (enemy.type === "boss") {
      // Bosses drop 3 to 5 valuable materials
      const dropsCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 drops
      for (let i = 0; i < dropsCount; i++) {
        const roll = Math.random();
        const rarity = roll < 0.4 ? "uncommon" : roll < 0.7 ? "rare" : "common";
        const selectedMat = getRandomMaterial(rarity);

        engine.pickups.push({
          id: `pickup_mat_boss_${selectedMat}_${Date.now()}_${i}`,
          type: selectedMat,
          x: enemy.x + enemy.width / 2 + (Math.random() * 32 - 16),
          y: enemy.y + enemy.height / 2 + (Math.random() * 32 - 16),
          size: rarity === "rare" ? 16 : rarity === "uncommon" ? 15 : 14,
          amount: 1
        });
      }
      
      // Celestial drop for Dark Matter (25% chance from Bosses)
      if (Math.random() < 0.25) {
        engine.pickups.push({
          id: `pickup_mat_boss_dark_matter_${Date.now()}`,
          type: "dark_matter",
          x: enemy.x + enemy.width / 2 + (Math.random() * 20 - 10),
          y: enemy.y + enemy.height / 2 + (Math.random() * 20 - 10),
          size: 17,
          amount: 1
        });
      }

      // Celestial drop for Chrono Codes (Rarest Celestial drop - 5% chance from Bosses)
      if (Math.random() < 0.05) {
        engine.pickups.push({
          id: `pickup_mat_boss_chrono_${Date.now()}`,
          type: "chrono_reagent",
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          size: 18,
          amount: 1
        });
      }
    } else {
      // Standard mobs drop chance increased to 22% for dynamic tech salvages!
      const randMat = Math.random();
      if (randMat < 0.22) {
        const roll = Math.random();
        const rarity = roll < 0.6 ? "common" : roll < 0.9 ? "uncommon" : "rare";
        const selectedMat = getRandomMaterial(rarity);

        engine.pickups.push({
          id: `pickup_mat_mob_${selectedMat}_${Date.now()}`,
          type: selectedMat,
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          size: rarity === "rare" ? 16 : rarity === "uncommon" ? 15 : 14,
          amount: 1
        });
      }

      // 3% celestial drop rate for dark matter from standard mobs
      if (Math.random() < 0.03) {
        engine.pickups.push({
          id: `pickup_mat_mob_dark_matter_${Date.now()}`,
          type: "dark_matter",
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          size: 17,
          amount: 1
        });
      }

      // 2% celestial drop rate for chrono codes from standard mobs (exactly 1% less than the 3% rate for dark matter, the second rarest item)
      if (Math.random() < 0.02) {
        engine.pickups.push({
          id: `pickup_mat_mob_chrono_${Date.now()}`,
          type: "chrono_reagent",
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          size: 18,
          amount: 1
        });
      }
    }

    // Large explosion cloud particles
    for (let i = 0; i < 20; i++) {
      engine.particles.push({
        id: `p_exp_${Date.now()}_${i}`,
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        vx: (Math.random() * 8 - 4),
        vy: (Math.random() * 8 - 4),
        color: Math.random() < 0.6 ? enemy.color : "#ffffff",
        size: Math.random() * 8 + 4,
        alpha: 0.9,
        decay: 0.04,
        type: "smoke"
      });
    }

    // If Boss is killed, clear the boss state!
    if (enemy.type === "boss") {
      setBossActive(false);
      
      // Increment bosses killed
      bossesKilledRef.current += 1;
      setBossesKilled(bossesKilledRef.current);
      
      // Essence absorption sequence alert!
      onTriggerWhisper("BOSS DEFEATED! SECURED HIGH-VALUE SECURED CARGO & SHARD CODES!");
      cyberAudio.playExplosion();
      
      // Visual flash and camera shake
      engine.camera.shake = 35;
      
      // Create numerous essence particles flowing towards the player's center!
      const px = engine.player.x;
      const py = engine.player.y;
      for (let i = 0; i < 90; i++) {
        const theta = Math.random() * Math.PI * 2;
        const rad = Math.random() * 200 + 100;
        const startX = enemy.x + Math.sin(theta) * 20;
        const startY = enemy.y + Math.cos(theta) * 20;
        
        engine.particles.push({
          id: `essence_${Date.now()}_${i}`,
          x: startX,
          y: startY,
          vx: (px - startX) / (Math.random() * 40 + 35),
          vy: (py - startY) / (Math.random() * 40 + 35),
          color: bossesKilledRef.current === 1 ? "#00f3ff" : bossesKilledRef.current === 2 ? "#f97316" : bossesKilledRef.current === 3 ? "#ec4899" : "#fbbf24",
          size: Math.random() * 5 + 3,
          alpha: 1.0,
          decay: 0.012,
          type: "glow"
        });
      }

      // Add special ability trigger log
      const bonusAbilities = [
        "MALPHAS HOMING BOLTS ADDED",
        "BEHEMOTH BULLET SHIELD ADDED",
        "LILITH PLASMA EDGE ADDED",
        "ORION SKYLIGHTNING DISCHARGE ADDED",
        "KRONOS ENERGY MATRIX COMPILATION STABLE"
      ];
      const abilityMsg = bonusAbilities[Math.min(bossesKilledRef.current - 1, bonusAbilities.length - 1)];
      
      setTimeout(() => {
        onTriggerWhisper(`CHASSIS COUPLING STABLE // ${abilityMsg} // MATRIX ACTIVE!`);
        cyberAudio.playHack();
      }, 2000);

      // Setup spawning of the NEXT, STRONGER boss in 5 seconds!
      setTimeout(() => {
        spawnSequentialBoss(bossesKilledRef.current);
      }, 5000);
    }

    // Check if wave is completely cleared
    const remainingHostiles = engine.enemies.filter((em) => em.type !== "boss");
    if (remainingHostiles.length === 0 && !bossActive) {
      setTimeout(() => {
        triggerNextWave();
      }, 1000);
    }
  };

  // Add Combos and Style score
  const addStylePoints = (amt: number, source: string) => {
    const engine = engineRef.current;
    const player = engine.player;

    player.stylePoints += amt;
    player.comboTimer = 180; // frames
    player.comboMultiplier = Math.min(8, player.comboMultiplier + 1);

    setStylePoints(player.stylePoints);
    setComboMultiplier(player.comboMultiplier);
    setComboTimer(player.comboTimer);

    // Set interactive visual style tag flasher floating
    engine.particles.push({
      id: `p_style_${Date.now()}_${Math.random()}`,
      x: player.x,
      y: player.y - 20,
      vx: (Math.random() * 2 - 1),
      vy: -1.5,
      color: "#2dd4bf",
      size: 13,
      alpha: 1,
      decay: 0.03,
      type: "text",
      text: `+${amt} ${source}`
    });

    // Determine stylized Letter Rank
    let rank = "E";
    if (player.stylePoints > 5000) rank = "D";
    if (player.stylePoints > 12000) rank = "C";
    if (player.stylePoints > 25000) rank = "B";
    if (player.stylePoints > 45000) rank = "A";
    if (player.stylePoints > 75000) rank = "S";
    if (player.stylePoints > 120000) rank = "SS";
    if (player.stylePoints > 180000) rank = "SSS";
    if (player.stylePoints > 260000) rank = "X";

    if (rank !== styleRank) {
      setStyleRank(rank);
      cyberAudio.playHack();
    }
  };

  // Damage Player
  const damagePlayer = (amount: number) => {
    const engine = engineRef.current;
    if (engine.player.movementState === "dashing") return; // Invulnerability frames

    // Cooldown reduction upgrade skin & Armor dodge chance
    const shieldDodge = engine.unlockedUpgrades["shading_field"] || 0;
    let bulletDodgeChance = shieldDodge * 0.08;
    if (equippedArmor === "shadow_set") {
      bulletDodgeChance += 0.20; // Void Shadow suit has a +20% run dodge chance passive!
    }
    if (Math.random() < bulletDodgeChance) {
      addStylePoints(50, "MATRIX SKIPPED");
      engine.particles.push({
        id: `p_dodge_text_${Date.now()}_${Math.random()}`,
        x: engine.player.x + engine.player.width / 2,
        y: engine.player.y - 12,
        vx: Math.random() * 2 - 1,
        vy: -1.3,
        color: "#ec4899",
        size: 11,
        alpha: 1.0,
        decay: 0.02,
        type: "text",
        text: "NEON GHOST DODGE"
      });
      return;
    }

    // Apply flat damage reduction Plate upgrade
    const plateLvl = engine.unlockedUpgrades["fortified_plate"] || 0;
    let reducedAmount = amount * Math.max(0.4, 1 - plateLvl * 0.06);

    // Apply Protection enchantment flat / percentage reduction to damage taken!
    let protectionReduction = 0;
    if (armorEnchants && armorEnchants[equippedArmor]) {
      const enchant = armorEnchants[equippedArmor];
      if (getEnchantType(enchant) === "protection") {
        const level = getEnchantLevel(enchant);
        protectionReduction = level * 0.08; // Reduces damage by 8% to 40%
      }
    }
    reducedAmount = reducedAmount * Math.max(0.3, 1 - protectionReduction);

    // Apply to shield first
    let finalDmg = reducedAmount;
    if (engine.player.shield > 0) {
      const absorbed = Math.min(engine.player.shield, reducedAmount);
      engine.player.shield -= absorbed;
      finalDmg -= absorbed * 0.5; // halved health bleedthrough
      setChassisShield(engine.player.shield);
    }

    if (finalDmg > 0) {
      engine.player.health = Math.max(0, engine.player.health - finalDmg);
      setChassisHealth(engine.player.health);
      engine.camera.shake = 16;
      cyberAudio.playGlitch();
    }

    // Spark red splash values
    for (let i = 0; i < 8; i++) {
      engine.particles.push({
        id: `p_damage_player_${Date.now()}_${i}`,
        x: engine.player.x + engine.player.width / 2,
        y: engine.player.y + engine.player.height / 2,
        vx: (Math.random() * 10 - 5),
        vy: (Math.random() * 10 - 5),
        color: "#f43f5e",
        size: Math.random() * 4 + 2,
        alpha: 0.9,
        decay: 0.05,
        type: "blood"
      });
    }

    // Game Over check
    if (engine.player.health <= 0) {
      engine.player.health = 0;
      onGameOver(scoreRef.current, engine.player.stylePoints, engine.player.weapons[engine.player.activeWeaponIndex].name, bossesKilledRef.current);
    }
  };

  // Update Core Physics Matrices in engine simulation loop
  const updateEngine = () => {
    const engine = engineRef.current;
    const player = engine.player;
    engine.gameTime++;

    // Periodically update coordinates HUD state (every 16 ticks is still extremely fluid but cuts re-render overhead in half)
    if (engine.gameTime % 16 === 0) {
      setPlayerLoc({
        x: Math.round(player.x),
        y: Math.round(player.y),
        vx: player.vx,
        vy: player.vy
      });
    }

    // Naturally regenerate shield slowly when alive: +0.025 points per frame (~1.5/sec) (boosted by upgrade!)
    if (player.health > 0 && player.shield < player.maxShield) {
      const shieldRegenLvl = engine.unlockedUpgrades["shield_recharge_efficiency"] || 0;
      const baseRegen = 0.025 * (1 + shieldRegenLvl * 0.40);
      player.shield = Math.min(player.maxShield, player.shield + baseRegen * (player.slowMoActive ? 0.22 : 1));
      if (engine.gameTime % 30 === 0) {
        setChassisShield(player.shield);
      }
    }

    // Heavy Tank Active HP Nano-restorations (+1 HP every 15s / 900 ticks)
    if (equippedArmor === "titan_set" && player.health > 0 && player.health < player.maxHealth) {
      if (engine.gameTime % 900 === 0) {
        player.health = Math.min(player.maxHealth, player.health + 1);
        setChassisHealth(player.health);
        // Add green repair particles
        for (let i = 0; i < 6; i++) {
          engine.particles.push({
            id: `p_heavy_heal_${Date.now()}_${i}`,
            x: player.x + Math.random() * player.width,
            y: player.y + Math.random() * player.height,
            vx: Math.random() * 1.2 - 0.6,
            vy: -1 - Math.random(),
            color: "#10b981",
            size: Math.random() * 3 + 1.5,
            alpha: 1.0,
            decay: 0.03
          });
        }
      }
    }

    // Tesla Static armor discharge (+15 damage to nearest enemy every 10s / 600 ticks)
    if (equippedArmor === "storm_set" && player.health > 0) {
      if (engine.gameTime % 600 === 0) {
        const pCenterX = player.x + player.width / 2;
        const pCenterY = player.y + player.height / 2;
        let nearest: any = null;
        let minDistSq = 220 * 220;
        const numE = engine.enemies.length;
        for (let idx = 0; idx < numE; idx++) {
          const e = engine.enemies[idx];
          if (e.health > 0) {
            const dx = (e.x + e.width / 2) - pCenterX;
            const dy = (e.y + e.height / 2) - pCenterY;
            const dSq = dx * dx + dy * dy;
            if (dSq < minDistSq) {
              minDistSq = dSq;
              nearest = e;
            }
          }
        }

        if (nearest) {
          damageEnemy(nearest, 15);
          const eCenterX = nearest.x + nearest.width / 2;
          const eCenterY = nearest.y + nearest.height / 2;
          
          // Draw lightning sparks particles
          for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const lx = pCenterX + (eCenterX - pCenterX) * t + (Math.random() * 12 - 6);
            const ly = pCenterY + (eCenterY - pCenterY) * t + (Math.random() * 12 - 6);
            engine.particles.push({
              id: `p_tesla_spark_${engine.gameTime}_${i}_${Math.random()}`,
              x: lx,
              y: ly,
              vx: Math.random() * 2 - 1,
              vy: Math.random() * 2 - 1,
              color: "#a855f7",
              size: Math.random() * 4 + 2,
              alpha: 0.9,
              decay: 0.07
            });
          }
          // Extra purple shock spark flash on hit
          for (let i = 0; i < 5; i++) {
            engine.particles.push({
              id: `p_tesla_hit_${engine.gameTime}_${i}`,
              x: eCenterX,
              y: eCenterY,
              vx: Math.random() * 3 - 1.5,
              vy: Math.random() * 3 - 1.5,
              color: "#c084fc",
              size: Math.random() * 3 + 1,
              alpha: 1.0,
              decay: 0.05
            });
          }
        }
      }
    }

    // Orion chain lightning drone helper trigger
    if (bossesKilled >= 4 && engine.gameTime % 10 === 0 && player.health > 0) {
      const pCenterX = player.x + player.width / 2;
      const pCenterY = player.y + player.height / 2;
      let nearest: any = null;
      let minDistSq = 340 * 340;
      const numE = engine.enemies.length;
      for (let idx = 0; idx < numE; idx++) {
        const e = engine.enemies[idx];
        if (e.health > 0) {
          const dx = (e.x + e.width / 2) - pCenterX;
          const dy = (e.y + e.height / 2) - pCenterY;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistSq) {
            minDistSq = dSq;
            nearest = e;
          }
        }
      }

      if (nearest) {
        damageEnemy(nearest, 5);
        const eCenterX = nearest.x + nearest.width / 2;
        const eCenterY = nearest.y + nearest.height / 2;
        for (let i = 0; i < 5; i++) {
          const t = i / 4;
          const lx = pCenterX + (eCenterX - pCenterX) * t + (Math.random() * 8 - 4);
          const ly = pCenterY + (eCenterY - pCenterY) * t + (Math.random() * 8 - 4);
          engine.particles.push({
            id: `orion_lightning_${engine.gameTime}_${i}_${Math.random()}`,
            x: lx,
            y: ly,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 2 - 1,
            color: "#eab308",
            size: Math.random() * 2.5 + 1.5,
            alpha: 0.9,
            decay: 0.16,
            type: "spark"
          });
        }
      }
    }

    // Check and handle dynamic level pickups (heal items & shield cells)
    if (engine.pickups) {
      engine.pickups.forEach((pickup, index) => {
         // Apply magnetic collector pickup pulling!
        const magLevel = engine.unlockedUpgrades["magnetic_collector"] || 0;
        if (magLevel > 0) {
          const pullDist = 30 + magLevel * 60; // Up to 30 + 240 = 270px radius range!
          const px = player.x + player.width / 2;
          const py = player.y + player.height / 2;
          const dx = px - pickup.x;
          const dy = py - pickup.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < pullDist * pullDist && distSq > 25) {
            const dist = Math.sqrt(distSq);
            // Drag the cells towards player coordinates
            pickup.x += (dx / dist) * 7.5;
            pickup.y += (dy / dist) * 7.5;
          }
        }

        const halfSize = pickup.size / 2;
        const collided = (
          player.x < pickup.x + halfSize &&
          player.x + player.width > pickup.x - halfSize &&
          player.y < pickup.y + halfSize &&
          player.y + player.height > pickup.y - halfSize
        );

        if (collided) {
          if (pickup.type === "heal") {
            player.health = Math.min(player.maxHealth, player.health + pickup.amount);
            setChassisHealth(player.health);
            cyberAudio.playLaser(440, "sine"); // Soft chime pickup pitch
            addStylePoints(20, "RE-GEN SANITATION");
            
            // Healing sparks
            for (let i = 0; i < 12; i++) {
              engine.particles.push({
                id: `p_heal_${Date.now()}_${i}`,
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: (Math.random() * 6 - 3),
                vy: (Math.random() * 6 - 3),
                color: "#10b981", // vibrant emerald
                size: Math.random() * 3 + 1.5,
                alpha: 0.95,
                decay: 0.04,
                type: "glow"
              });
            }
          } else if (pickup.type === "shield") {
            player.shield = Math.min(player.maxShield, player.shield + pickup.amount);
            setChassisShield(player.shield);
            cyberAudio.playLaser(680, "sine"); // Crisp shield chirp pitch
            addStylePoints(20, "SHIELD CHARGER");
            
            // Shielding sparks
            for (let i = 0; i < 12; i++) {
              engine.particles.push({
                id: `p_shield_${Date.now()}_${i}`,
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: (Math.random() * 6 - 3),
                vy: (Math.random() * 6 - 3),
                color: "#00f3ff", // cyan glow
                size: Math.random() * 3 + 1.5,
                alpha: 0.95,
                decay: 0.04,
                type: "glow"
              });
            }
          } else if (
            [
              "filament", "alloy", "core",
              "nano_filament", "titanium_alloy", "carbon_nanotube", "graphene_plate",
              "coolant_rod", "laser_emitter", "quantum_battery", "unstable_plasma",
              "vortex_core", "rebel_nanite", "cyber_neuro_mesh", "plasma_core",
              "warp_crystal", "dark_matter", "antimatter_fuel", "chrono_reagent"
            ].includes(pickup.type)
          ) {
            let matKey = pickup.type;
            if (pickup.type === "filament") matKey = "nano_filament";
            else if (pickup.type === "alloy") matKey = "titanium_alloy";
            else if (pickup.type === "core") matKey = "plasma_core";

            let addCount = 1;
            if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("deity_scavenger")) {
              if (matKey === "titanium_alloy" || matKey === "nano_filament") {
                addCount = 2; // Double plasma harvesting!
              }
            }

            setMaterials(prev => ({
              ...prev,
              [matKey]: (prev[matKey] || 0) + addCount
            }));

            // Play delicious high tech chime pitch
            const pitch = 920 + (Math.random() * 300);
            cyberAudio.playLaser(pitch, "triangle");

            const info = MATERIAL_INFO[matKey] || { name: matKey.replace("_", " ").toUpperCase(), icon: "📦" };
            const hexColor = getMatHexColor(matKey);
            const labelText = `+${addCount} ${info.name}`;

            addStylePoints(50, `MATERIAL RECLAIMED: ${info.icon} ${labelText}`);

            // Add custom visual text float above player
            engine.particles.push({
              id: `p_mat_float_${Date.now()}_${Math.random()}`,
              x: player.x,
              y: player.y - 12,
              vx: Math.random() * 2 - 1,
              vy: -1.5,
              color: hexColor,
              size: 11,
              alpha: 1.0,
              decay: 0.02,
              type: "text",
              text: labelText
            });

            // Glowing material sparkles
            for (let i = 0; i < 8; i++) {
              engine.particles.push({
                id: `p_mat_spark_${Date.now()}_${i}`,
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: (Math.random() * 5 - 2.5),
                vy: (Math.random() * 5 - 2.5),
                color: hexColor,
                size: Math.random() * 3 + 1,
                alpha: 0.9,
                decay: 0.05
              });
            }
          }
          engine.pickups.splice(index, 1);
        }
      });
    }

    // 1. DAMPING AND COMBO TIMERS (Optimized to reduce React re-renders)
    if (player.comboTimer > 0) {
      let decaySpeed = 1;
      if (Array.isArray(activeMutators) && activeMutators.includes("style_decay")) {
        decaySpeed = 2; // decays twice as fast!
      }
      player.comboTimer = Math.max(0, player.comboTimer - decaySpeed);
      if (player.comboTimer % 4 === 0 || player.comboTimer === 0) {
        setComboTimer(player.comboTimer);
      }
      if (player.comboTimer === 0) {
        player.comboMultiplier = 1;
        setComboMultiplier(1);
      }
    }

    // Slow energy charge restore (Optimized to prevent 60FPS React state changes)
    if (player.slowMoActive) {
      const btCap = engine.unlockedUpgrades["bullet_time_cap"] || 0;
      let decayMult = 1 - btCap * 0.25; // each level decreases drain by 25% (longer duration)
      if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("tactical_tactician")) {
        decayMult *= 0.5; // 50% slower decay vector!
      }
      player.slowMoEnergy = Math.max(0, player.slowMoEnergy - 0.35 * decayMult);
      if (player.slowMoEnergy === 0) {
        player.slowMoActive = false;
        cyberAudio.playBulletTime(false);
      }
    } else if (player.slowMoEnergy < 100) {
      const tauLevel = engine.unlockedUpgrades["tau_converter"] || 0;
      let baseRecharge = 0.15 * (1 + tauLevel * 0.20);
      if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("tactical_tactician")) {
        baseRecharge *= 1.5; // +50% faster bullet-time recovery scale!
      }
      player.slowMoEnergy = Math.min(100, player.slowMoEnergy + baseRecharge);
    }

    const roundedEnergy = Math.round(player.slowMoEnergy);
    if (roundedEnergy !== Math.round(slowMoEnergyRef.current)) {
      slowMoEnergyRef.current = player.slowMoEnergy;
      setSlowMoEnergy(roundedEnergy);
    }

    // Adjust global time scaling based on slowMo state
    const dt = player.slowMoActive ? 0.22 : 1;

    // 2. PLAYER PHYSICS DESIGN
    if (player.movementState === "normal") {
      let dx = 0;
      let dy = 0;
      if (engine.keys["w"]) dy = -1;
      if (engine.keys["s"]) dy = 1;
      if (engine.keys["a"]) dx = -1;
      if (engine.keys["d"]) dx = 1;

      // Normal speed augmented by cyber_core levels
      const speedUp = engine.unlockedUpgrades["cyber_core"] || 0;
      let moveSpeed = (4.6 + speedUp * 0.4) * dt;
      if (Array.isArray(unlockedPrestigePerks) && unlockedPrestigePerks.includes("magnetic_thrusters")) {
        moveSpeed *= 1.25; // Magnetic Trajectory Boost grants a clean +25% speed vector scaling!
      }
      if (equippedArmor === "shadow_set") {
        moveSpeed *= 1.10; // Void Shadow suit has a +10% speed vector boost!
      }
      if (Array.isArray(activeMutators) && activeMutators.includes("chrono_drag")) {
        moveSpeed *= 0.70; // Chrono-drag spatial anomalies penalize speed by 30%!
      }

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      player.vx = dx * moveSpeed;
      player.vy = dy * moveSpeed;

      // Wall-run check
      checkWallRunningState(dx, dy);

    } else if (player.movementState === "dashing") {
      player.dashTimer--;
      player.vx *= 0.92;
      player.vy *= 0.92;
      if (player.dashTimer <= 0) {
        player.movementState = "normal";
      }
    } else if (player.movementState === "grappling") {
      if (player.grapplePoint) {
        const ax = player.grapplePoint.x;
        const ay = player.grapplePoint.y;
        const angle = Math.atan2(ay - player.y, ax - player.x);

        player.vx = Math.cos(angle) * 11 * dt;
        player.vy = Math.sin(angle) * 11 * dt;

        // Anchor latch bounds check
        if (Math.hypot(ax - player.x, ay - player.y) < 32) {
          player.movementState = "normal";
          player.grapplePoint = null;
        }
      }
    } else if (player.movementState === "wallrunning") {
      // Automatic vertical run along structures
      player.vy = -6.5 * dt;

      // Keep wall side drift
      if (player.wallRunSide === "left") player.vx = -1.2;
      if (player.wallRunSide === "right") player.vx = 1.2;

      // Drop wallrunning state after some timer
      player.slideTimer--;
      if (player.slideTimer <= 0 || !engine.keys["w"]) {
        player.movementState = "normal";
        player.wallRunSide = null;
      }

      // Trailing lines
      if (Math.random() < 0.3) {
        engine.particles.push({
          id: `p_wallrun_${Date.now()}_${Math.random()}`,
          x: player.x + (player.wallRunSide === "left" ? 0 : player.width),
          y: player.y + player.height / 2,
          vx: player.wallRunSide === "left" ? -2 : 2,
          vy: 0,
          color: "#38bdf8",
          size: 2,
          alpha: 0.9,
          decay: 0.05,
          type: "trail"
        });
      }
    }

    // Apply displacement velocity
    player.x += player.vx;
    player.y += player.vy;

    // Boundary constraints clamped
    player.x = Math.max(-1000, Math.min(1500 - player.width, player.x));
    player.y = Math.max(-1000, Math.min(1500 - player.height, player.y));

    if (player.dashCooldown > 0) player.dashCooldown--;

    // 3. COLLISION WITH ARCHITECTURE BLOCKS
    if (!engine.wallsOnly) {
      engine.wallsOnly = engine.grid.filter((segment) => segment.type === "wall" || segment.type === "neon_billboard");
    }
    const wallsOnly = engine.wallsOnly;
    const numWalls = wallsOnly.length;
    const numE = engine.enemies.length;

    for (let w = 0; w < numWalls; w++) {
      const segment = wallsOnly[w];
      resolveBlockCollision(player, segment);
      
      const segCenterX = segment.x + segment.width / 2;
      const segCenterY = segment.y + segment.height / 2;
      const maxProxyDist = Math.max(segment.width, segment.height) + 120;

      for (let e = 0; e < numE; e++) {
        const enemy = engine.enemies[e];
        const dx = (enemy.x + enemy.width / 2) - segCenterX;
        const dy = (enemy.y + enemy.height / 2) - segCenterY;
        if (Math.abs(dx) < maxProxyDist && Math.abs(dy) < maxProxyDist) {
          resolveBlockCollision(enemy, segment);
        }
      }
    }

    // 3.5 MOB-TO-MOB SEPARATION PHYSICS (Solves stacking lag and creates natural surrounding formations)
    const numEnemies = engine.enemies.length;
    for (let i = 0; i < numEnemies; i++) {
      const e1 = engine.enemies[i];
      const e1w = e1.width;
      for (let j = i + 1; j < numEnemies; j++) {
        const e2 = engine.enemies[j];
        const dx = e2.x - e1.x;
        const dy = e2.y - e1.y;
        const minDist = (e1w + e2.width) / 1.35; // slightly smaller overlap threshold
        
        if (Math.abs(dx) < minDist && Math.abs(dy) < minDist) {
          const distSq = dx * dx + dy * dy;
          const minDistSq = minDist * minDist;
          if (distSq < minDistSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            const pushX = (dx / dist) * overlap * 0.5;
            const pushY = (dy / dist) * overlap * 0.5;
            
            e1.x -= pushX;
            e1.y -= pushY;
            e2.x += pushX;
            e2.y += pushY;
          }
        }
      }
    }

    // 4. CAMERA MATRIX TRACING FOLLOWS PLAYER WITH DECAY SHAKE
    const canvas = canvasRef.current;
    if (canvas) {
      const targetCamX = player.x + player.width / 2 - canvas.width / 2;
      const targetCamY = player.y + player.height / 2 - canvas.height / 2;
      engine.camera.x += (targetCamX - engine.camera.x) * 0.082;
      engine.camera.y += (targetCamY - engine.camera.y) * 0.082;

      if (engine.camera.shake > 0.1) {
        engine.camera.shake *= 0.9;
        engine.camera.x += (Math.random() * engine.camera.shake - engine.camera.shake / 2);
        engine.camera.y += (Math.random() * engine.camera.shake - engine.camera.shake / 2);
      }
    }

    // 5. PROJECTILE UPDATES
    // Cap active projectiles to prevent extreme collision checks overhead (O(N^2) bullet to bullet / O(N*M) bullet to walls)
    // Optimized single-pass reverse sweep to collect newer projectiles up to cap, avoiding multiple slow copy/slice steps
    const cappedPlayer: Projectile[] = [];
    const cappedEnemy: Projectile[] = [];
    const numProj = engine.projectiles.length;
    for (let i = numProj - 1; i >= 0; i--) {
      const p = engine.projectiles[i];
      if (p.age < p.maxAge) {
        if (p.owner === "player") {
          if (cappedPlayer.length < 25) {
            cappedPlayer.push(p);
          }
        } else {
          if (cappedEnemy.length < 35) {
            cappedEnemy.push(p);
          }
        }
      }
    }
    cappedPlayer.reverse();
    cappedEnemy.reverse();
    const activeProjectiles = [...cappedPlayer, ...cappedEnemy];
    engine.projectiles = activeProjectiles;

    const numCappedProj = activeProjectiles.length;
    for (let pi = 0; pi < numCappedProj; pi++) {
      const p = activeProjectiles[pi];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.age++;

      // Collision bounding tests
      if (p.owner === "player") {
        // Dynamic suction pull for gravity singularity vortexes!
        if (p.type === "gravity") {
          const suctionRadius = 240;
          const suctionPullForce = 0.5; // pull velocity offset per tick
          const numE = engine.enemies.length;
          for (let idx = 0; idx < numE; idx++) {
            const enemy = engine.enemies[idx];
            const ecx = enemy.x + enemy.width / 2;
            const ecy = enemy.y + enemy.height / 2;
            const dx = p.x - ecx;
            const dy = p.y - ecy;
            const distSq = dx * dx + dy * dy;
            if (distSq < suctionRadius * suctionRadius && distSq > 16) {
              const dist = Math.sqrt(distSq);
              // Gently suck towards gravity centroid structure!
              enemy.vx += (dx / dist) * suctionPullForce * dt;
              enemy.vy += (dy / dist) * suctionPullForce * dt;
            }
          }
        }

        // Player bullet hits enemy
        const px = p.x;
        const py = p.y;
        const pDamage = p.damage;
        const pType = p.type;
        const numE = engine.enemies.length;
        for (let idx = 0; idx < numE; idx++) {
          const enemy = engine.enemies[idx];
          const ecx = enemy.x + enemy.width / 2;
          const ecy = enemy.y + enemy.height / 2;
          const dx = px - ecx;
          const dy = py - ecy;
          const limit = enemy.width;
          if (Math.abs(dx) < limit && Math.abs(dy) < limit) {
            const distSq = dx * dx + dy * dy;
            if (distSq < limit * limit) {
              // Recoil Impact: Push the enemy backward based on bullet angle
              const pushAngle = Math.atan2(ecy - py, ecx - px);
              const recoilStrength = pType === "slug" || pType === "wave" ? 3.5 : 1.2;
              enemy.vx += Math.cos(pushAngle) * recoilStrength;
              enemy.vy += Math.sin(pushAngle) * recoilStrength;

              damageEnemy(enemy, pDamage, false, p.isCrit || false);
              p.age = p.maxAge; // expire
              break; // bullet has hit, stop checking other enemies
            }
          }
        }
      } else {
        // Enemy bullet hits player
        if (player.movementState !== "dashing") {
          const px = player.x + player.width / 2;
          const py = player.y + player.height / 2;
          const dx = p.x - px;
          const dy = p.y - py;
          const limit = player.width;
          if (Math.abs(dx) < limit && Math.abs(dy) < limit) {
            if (dx * dx + dy * dy < limit * limit) {
              damagePlayer(p.damage);
              p.age = p.maxAge; // expire
            }
          }
        }
      }

      // Check wall structure hits - only check if bullet hasn't already expired
      if (p.age < p.maxAge) {
        const px = p.x;
        const py = p.y;
        const pType = p.type;
        const pMaxAge = p.maxAge;
        for (let w = 0; w < numWalls; w++) {
          const segment = wallsOnly[w];
          if (px > segment.x && px < segment.x + segment.width && py > segment.y && py < segment.y + segment.height) {
            if (pType !== "gravity") {
              p.age = pMaxAge; // Kill projectile
              break;
            }
          }
        }
      }
    }

    // 5.5 BULLET-TO-BULLET INTERCEPTION (Neutralize hostile projectiles by shooting them!)
    const numCappedPlayer = cappedPlayer.length;
    const numCappedEnemy = cappedEnemy.length;
    for (let i = 0; i < numCappedPlayer; i++) {
      const p1 = cappedPlayer[i];
      if (p1.age >= p1.maxAge) continue;
      const p1x = p1.x;
      const p1y = p1.y;
      const p1Size = p1.size;
      for (let j = 0; j < numCappedEnemy; j++) {
        const p2 = cappedEnemy[j];
        if (p2.age >= p2.maxAge) continue;

        const dx = p2.x - p1x;
        const dy = p2.y - p1y;
        const collisionRadius = p1Size + p2.size + 4.5;
        if (Math.abs(dx) < collisionRadius && Math.abs(dy) < collisionRadius) {
          const distSq = dx * dx + dy * dy;
          if (distSq < collisionRadius * collisionRadius) {
            p1.age = p1.maxAge;
            p2.age = p2.maxAge;

            // Double sparkles on interception clash
            for (let k = 0; k < 3; k++) {
              engine.particles.push({
                id: `p_clash_${Date.now()}_${i}_${j}_${k}`,
                x: (p1x + p2.x) / 2,
                y: (p1y + p2.y) / 2,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 4 - 2,
                color: "#fbbf24", // orange spark
                size: 2,
                alpha: 1,
                decay: 0.08,
                type: "spark"
              });
            }
            addStylePoints(10, "INTERCEPT OK");
            break; // p1 has expired, exits enemy projectile loop
          }
        }
      }
    }

    // Delete aged projectiles
    engine.projectiles = activeProjectiles.filter((p) => p.age < p.maxAge);

    // 6. ENEMY BEHAVIOR AI SQUASHES
    const numActiveEnemies = engine.enemies.length;
    for (let idx = 0; idx < numActiveEnemies; idx++) {
      const enemy = engine.enemies[idx];
      if (enemy.isStunned) {
        enemy.stunTimer -= dt;
        if (enemy.stunTimer <= 0) enemy.isStunned = false;
        continue; // skip action
      }

      const pCenterX = player.x + player.width / 2;
      const pCenterY = player.y + player.height / 2;
      const dx = pCenterX - enemy.x;
      const dy = pCenterY - enemy.y;
      const distSq = dx * dx + dy * dy;

      // Throttling for very far off-screen entities (saves major CPU when 10+ enemies correspond)
      if (distSq > 950 * 950 && (engine.gameTime + idx) % 3 !== 0) {
        // Run friction and displacement movement so they don't lock freezes in space, but bypass heavy sensor calculations
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        continue;
      }

      // AI States
      enemy.shootCooldown -= 16 * dt;

      // Over time, minions health and damage increase little by little (10% standard scaling per 3 minutes)
      const minionScaleFactor = 1 + (engine.gameTime / 10800) * 0.18; // +18% damage/health every 3 minutes

      if (enemy.type === "drone") {
        // Drone moves towards player slowly in a hovering sinus orbit wave
        const angle = Math.atan2(pCenterY - enemy.y, pCenterX - enemy.x);
        enemy.angle = angle;
        enemy.vx = Math.cos(angle) * enemy.speed * dt;
        enemy.vy = (Math.sin(angle) * enemy.speed + Math.sin(engine.gameTime * 0.05) * 1.5) * dt;

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Shoot basic fire
        if (enemy.shootCooldown <= 0 && distSq < 450 * 450) {
          enemy.shootCooldown = 1800 + Math.random() * 800; // reload
          cyberAudio.playLaser(150, "sine");
          engine.projectiles.push({
            id: `p_drone_${Date.now()}_${Math.random()}`,
            owner: "enemy",
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * 5.5,
            vy: Math.sin(angle) * 5.5,
            damage: Math.round(8 * minionScaleFactor),
            type: "bullet",
            color: enemy.color,
            size: 4,
            age: 0,
            maxAge: 120
          });
        }
      } else if (enemy.type === "ninja") {
        // Ninja dashes occasionally and slashes
        enemy.aiStateTimer += dt;
        const angle = Math.atan2(pCenterY - enemy.y, pCenterX - enemy.x);
        enemy.angle = angle;

        if (enemy.aiStateTimer > 120) {
          enemy.aiStateTimer = 0;
          // Dash towards player
          enemy.vx = Math.cos(angle) * 12 * dt;
          enemy.vy = Math.sin(angle) * 12 * dt;
          cyberAudio.playDash();

          // Ninja slashing throw
          if (distSq < 150 * 150) {
            damagePlayer(Math.round(15 * minionScaleFactor));
          }
        } else {
          // Slow patrol track
          enemy.vx += (Math.cos(angle) * enemy.speed - enemy.vx) * 0.05 * dt;
          enemy.vy += (Math.sin(angle) * enemy.speed - enemy.vy) * 0.05 * dt;
        }

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
      } else if (enemy.type === "android") {
        // Prototype heavy gunner steps slowly
        const angle = Math.atan2(pCenterY - enemy.y, pCenterX - enemy.x);
        enemy.angle = angle;
        enemy.vx = Math.cos(angle) * enemy.speed * dt;
        enemy.vy = Math.sin(angle) * enemy.speed * dt;

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Shoot continuous plasma shells
        if (enemy.shootCooldown <= 0 && distSq < 500 * 500) {
          enemy.shootCooldown = 2200;
          for (let s = -1; s <= 1; s++) {
            const spreadAngle = angle + s * 0.2;
            engine.projectiles.push({
              id: `p_android_${Date.now()}_${s}`,
              owner: "enemy",
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(spreadAngle) * 4.2,
              vy: Math.sin(spreadAngle) * 4.2,
              damage: Math.round(10 * minionScaleFactor),
              type: "plasma",
              color: enemy.color,
              size: 5,
              age: 0,
              maxAge: 110
            });
          }
        }
      } else if (enemy.type === "boss") {
        // Boss behavior loop! Saint Malphas, Behemoth Titan, Lilith, Orion, Kronos
        engine.bossFight.attackTimer += dt;
        
        // Face the player
        const angle = Math.atan2(pCenterY - enemy.y, pCenterX - enemy.x);
        enemy.angle = angle;

        // Custom Boss Movements and Behaviors depending on SubType (progressive difficulty!)
        const sub = enemy.bossSubType || "malphas";
        
        if (sub === "behemoth") {
          // Slow stomping colossus movement
          enemy.vx += (Math.cos(angle) * enemy.speed * 0.8 - enemy.vx) * 0.05 * dt;
          enemy.vy += (Math.sin(angle) * enemy.speed * 0.8 - enemy.vy) * 0.05 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 90; // reload rate (multiplied by dt subtracted)
            cyberAudio.playLaser(180, "sawtooth");
            for (let s = -2; s <= 2; s++) {
              engine.projectiles.push({
                id: `boss_behe_${engine.gameTime}_${s}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle + s * 0.15) * 5.5,
                vy: Math.sin(angle + s * 0.15) * 5.5,
                damage: 18,
                type: "slug",
                color: "#f97316",
                size: 8,
                age: 0,
                maxAge: 160
              });
            }
          }
        } else if (sub === "lilith") {
          // Floating fast teleporter behavior
          enemy.vx += (Math.cos(angle) * enemy.speed - enemy.vx) * 0.08 * dt;
          enemy.vy += (Math.sin(angle) * enemy.speed - enemy.vy) * 0.08 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Rapid random teleport near player on a cooldown!
          if (engine.gameTime % 240 === 0 && distSq > 150 * 150) {
            enemy.x = pCenterX + (Math.random() * 200 - 100);
            enemy.y = pCenterY + (Math.random() * 160 - 80);
            engine.camera.shake = 15;
            cyberAudio.playDash();
            // Burst of sakura sparkles in old position and new
            for (let i = 0; i < 15; i++) {
              engine.particles.push({
                id: `lili_tele_${Date.now()}_${i}`,
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                color: "#ec4899",
                size: Math.random() * 5 + 2,
                alpha: 1.0,
                decay: 0.05,
                type: "spark"
              });
            }
          }

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 25; // rapid fire
            cyberAudio.playLaser(750, "sine");
            engine.projectiles.push({
              id: `boss_lili_${engine.gameTime}`,
              owner: "enemy",
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(angle + Math.sin(engine.gameTime * 0.1) * 0.3) * 6.5,
              vy: Math.sin(angle + Math.sin(engine.gameTime * 0.1) * 0.3) * 6.5,
              damage: 14,
              type: "wave",
              color: "#ec4899",
              size: 7,
              age: 0,
              maxAge: 120
            });
          }
        } else if (sub === "orion") {
          // Drifts and anchors, spawns lightning bolts on the player
          enemy.vx += (Math.cos(angle) * enemy.speed - enemy.vx) * 0.04 * dt;
          enemy.vy += (Math.sin(angle) * enemy.speed - enemy.vy) * 0.04 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 60; // Faster frequency!
            // Lightning shock discharge from orbit
            cyberAudio.playLaser(100, "square");
            
            // 1. Dual high-speed directed sniper shockwaves targeting the player!
            for (let offset = -0.15; offset <= 0.15; offset += 0.3) {
              const targetAngle = angle + offset;
              engine.projectiles.push({
                id: `boss_orion_targeted_${engine.gameTime}_${offset}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(targetAngle) * 9.5, // Extremely high-speed
                vy: Math.sin(targetAngle) * 9.5,
                damage: 22,
                type: "wave",
                color: "#ff8c00",
                size: 10,
                age: 0,
                maxAge: 320 // Global range tracking
              });
            }

            // 2. Far-reaching Ring Denser shock discharges
            for (let aCircle = 0; aCircle < Math.PI * 2; aCircle += Math.PI / 6) {
              engine.projectiles.push({
                id: `boss_orion_${engine.gameTime}_${aCircle}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(aCircle) * 6.5, // Double speed!
                vy: Math.sin(aCircle) * 6.5,
                damage: 18,
                type: "laser",
                color: "#f9ec2c",
                size: 8,
                age: 0,
                maxAge: 260 // Highly expanded reach!
              });
            }
          }
        } else if (sub === "kronos") {
          // Ultimate boss tracking
          enemy.vx += (Math.cos(angle) * enemy.speed - enemy.vx) * 0.06 * dt;
          enemy.vy += (Math.sin(angle) * enemy.speed - enemy.vy) * 0.06 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 35; // ultra fast
            const swirl = engine.gameTime * 0.12;
            engine.projectiles.push({
              id: `boss_kro_laser_${engine.gameTime}`,
              owner: "enemy",
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(swirl) * 5,
              vy: Math.sin(swirl) * 5,
              damage: 15,
              type: "wave",
              color: "#10b981",
              size: 6,
              age: 0,
              maxAge: 140
            });

            // Target seeking micro gravity gravity shells
            if (engine.gameTime % 25 === 0) {
              engine.projectiles.push({
                id: `boss_kro_seek_${engine.gameTime}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 3.5,
                vy: Math.sin(angle) * 3.5,
                damage: 25,
                type: "gravity",
                color: "#10b981",
                size: 15,
                age: 0,
                maxAge: 180
              });
            }
          }
        } else if (sub === "nemesis") {
          // SPEEDY DUAL SABER MECHANICAL SLASHER: High-frequency dash charging, leaves laser traces
          const isDashing = engine.gameTime % 140 < 35; // Dash charge phase!
          const speedMultiplier = isDashing ? 3.2 : 0.8;
          const zig = isDashing ? 0 : Math.sin(engine.gameTime * 0.12) * 4.2;
          
          enemy.vx += (Math.cos(angle + 0.25) * enemy.speed * speedMultiplier + Math.cos(angle + Math.PI / 2) * zig - enemy.vx) * 0.12 * dt;
          enemy.vy += (Math.sin(angle + 0.25) * enemy.speed * speedMultiplier + Math.sin(angle + Math.PI / 2) * zig - enemy.vy) * 0.12 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Spawn visual shadow trails during dashboard
          if (isDashing && engine.gameTime % 3 === 0) {
            engine.particles.push({
              id: `neme_dash_trail_${Date.now()}`,
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: -enemy.vx * 0.35,
              vy: -enemy.vy * 0.35,
              color: "#00f3ff",
              size: Math.random() * 6 + 3,
              alpha: 0.85,
              decay: 0.08,
              type: "glow"
            });
          }

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = isDashing ? 15 : 45; // Fires much faster during dash sprints!
            cyberAudio.playLaser(600, "square");
            for (let s = -1; s <= 1; s++) {
              engine.projectiles.push({
                id: `boss_neme_${engine.gameTime}_${s}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle + s * 0.18) * (isDashing ? 9.5 : 7.2),
                vy: Math.sin(angle + s * 0.18) * (isDashing ? 9.5 : 7.2),
                damage: 15,
                type: "wave",
                color: "#00f3ff",
                size: 8,
                age: 0,
                maxAge: 140
              });
            }
          }
        } else if (sub === "xenon" || sub === "apex") {
          // CYBERNETIC OVERLORD CORE: Orbits screen center slowly and sweeps wide streams of purple matrix lasers
          const orbitAngle = engine.gameTime * 0.012;
          const targetX = 400 + Math.cos(orbitAngle) * 260;
          const targetY = 220 + Math.sin(orbitAngle) * 160;
          
          enemy.vx += ((targetX - enemy.x) * 0.02 - enemy.vx) * 0.08 * dt;
          enemy.vy += ((targetY - enemy.y) * 0.02 - enemy.vy) * 0.08 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 55;
            cyberAudio.playLaser(250, "sawtooth");
            
            // Sweep fire a revolving wave of matrix beam files
            const sweepCenter = angle + Math.sin(engine.gameTime * 0.06) * 0.6;
            for (let s = -2; s <= 2; s++) {
              engine.projectiles.push({
                id: `boss_xenon_${engine.gameTime}_${s}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(sweepCenter + s * 0.08) * 6.2,
                vy: Math.sin(sweepCenter + s * 0.08) * 6.2,
                damage: 18,
                type: "laser",
                color: "#a855f7",
                size: 7,
                age: 0,
                maxAge: 200
              });
            }
          }
        } else if (sub === "astraea") {
          // GLIMMERING STAR DEFENDER: Alternates gravitational pull/push effect and starburst gravity particles
          enemy.vx += (Math.cos(angle) * enemy.speed * 1.15 - enemy.vx) * 0.06 * dt;
          enemy.vy += (Math.sin(angle) * enemy.speed * 1.15 - enemy.vy) * 0.06 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Apply radial gravitational shift fields to the player depending on chronal time cycles
          const distToPlayer = Math.hypot(pCenterX - enemy.x, pCenterY - enemy.y);
          if (distToPlayer > 40 && distToPlayer < 450) {
            const pullCycle = Math.sin(engine.gameTime * 0.015) > 0;
            const directionMod = pullCycle ? 1 : -1;
            const gravityForce = (2.2 / distToPlayer) * directionMod;
            
            // Seamlessly alter player drift
            engine.player.vx += (enemy.x - pCenterX) * gravityForce * dt;
            engine.player.vy += (enemy.y - pCenterY) * gravityForce * dt;

            // Gravitational trail particles
            if (engine.gameTime % 5 === 0) {
              engine.particles.push({
                id: `astraea_grav_${Date.now()}`,
                x: pCenterX + (Math.random() * 30 - 15),
                y: pCenterY + (Math.random() * 30 - 15),
                vx: (enemy.x - pCenterX) * (gravityForce * 2.8),
                vy: (enemy.y - pCenterY) * (gravityForce * 2.8),
                color: "#06b6d4",
                size: 3.5,
                alpha: 0.75,
                decay: 0.04,
                type: "spark"
              });
            }
          }

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 70;
            cyberAudio.playLaser(500, "sine");
            // Beautiful radial star-burst of cyan light shards
            for (let i = 0; i < 10; i++) {
              const starBurstAngle = angle + (i * Math.PI * 2) / 10;
              engine.projectiles.push({
                id: `boss_astraea_${engine.gameTime}_${i}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(starBurstAngle) * 5.2,
                vy: Math.sin(starBurstAngle) * 5.2,
                damage: 17,
                type: "shard",
                color: "#06b6d4",
                size: 8,
                age: 0,
                maxAge: 160
              });
            }
          }
        } else if (sub === "asmodeus") {
          // HEAVY HELLFIRE VEHICLE MATRIX: Floats slowly, anchoring, launching cross-sweeping lasers and cross-combustion payloads
          enemy.vx += (Math.cos(angle) * enemy.speed * 0.55 - enemy.vx) * 0.04 * dt;
          enemy.vy += (Math.sin(angle) * enemy.speed * 0.55 - enemy.vy) * 0.04 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 85;
            cyberAudio.playLaser(120, "sawtooth");
            
            // Launches heavy core tracking combustion mines
            for (let s = -1; s <= 1; s += 2) {
              const mineAngle = angle + s * 0.25;
              engine.projectiles.push({
                id: `boss_asmo_mine_${engine.gameTime}_${s}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(mineAngle) * 3.8,
                vy: Math.sin(mineAngle) * 3.8,
                damage: 25,
                type: "slug",
                color: "#f43f5e",
                size: 14,
                age: 0,
                maxAge: 120
              });
            }

            // Continuous hellfire cross beams sweeping in quadrants
            for (let quadrant = 0; quadrant < Math.PI * 2; quadrant += Math.PI / 2) {
              const angleFired = angle + quadrant;
              engine.projectiles.push({
                id: `boss_asmo_beam_${engine.gameTime}_${quadrant}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angleFired) * 4.8,
                vy: Math.sin(angleFired) * 4.8,
                damage: 19,
                type: "laser",
                color: "#ff0055",
                size: 9,
                age: 0,
                maxAge: 200
              });
            }
          }
        } else if (sub === "valkyrie") {
          // VALKYRIE BLADE MATRIX EXTREME: Hovers gracefully, tracking player, executing consecutive targeted light blades
          const desiredX = pCenterX + Math.cos(engine.gameTime * 0.035) * 250;
          const desiredY = pCenterY - 140 + Math.sin(engine.gameTime * 0.02) * 50;
          
          enemy.vx += ((desiredX - enemy.x) * 0.05 - enemy.vx) * 0.09 * dt;
          enemy.vy += ((desiredY - enemy.y) * 0.05 - enemy.vy) * 0.09 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 40;
            cyberAudio.playLaser(750, "sine");
            // Golden tracking light blade missile fires with subtle homing drift
            const homingAngle = angle + (Math.random() * 0.1 - 0.05);
            engine.projectiles.push({
              id: `boss_valk_blade_${engine.gameTime}`,
              owner: "enemy",
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(homingAngle) * 8.5,
              vy: Math.sin(homingAngle) * 8.5,
              damage: 16,
              type: "shard",
              color: "#fbbf24",
              size: 8,
              age: 0,
              maxAge: 130
            });

            // Heavy sweeping horizontal energy sweeps
            if (engine.gameTime % 180 === 0) {
              for (let i = 0; i < 8; i++) {
                const stepAngle = (i * Math.PI * 2) / 8;
                engine.projectiles.push({
                  id: `boss_valk_sweep_${engine.gameTime}_${i}`,
                  owner: "enemy",
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height / 2,
                  vx: Math.cos(stepAngle) * 4.5,
                  vy: Math.sin(stepAngle) * 4.5,
                  damage: 16,
                  type: "wave",
                  color: "#eab308",
                  size: 8,
                  age: 0,
                  maxAge: 160
                });
              }
            }
          }
        } else if (sub === "zeus") {
          // ZEUS COBALT SUPERCONDUCTOR: Floats straight above center screen to anchor sky-high static electric generation
          const anchorX = 400;
          const anchorY = 120;
          enemy.vx += ((anchorX - enemy.x) * 0.02 - enemy.vx) * 0.06 * dt;
          enemy.vy += ((anchorY - enemy.y) * 0.02 - enemy.vy) * 0.06 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 15; // EXTREME super-frequency cobalt discharges
            cyberAudio.playLaser(950, "square");
            const lightningOffset = (Math.random() * 0.25 - 0.125);
            
            engine.projectiles.push({
              id: `boss_zeus_discharge_${engine.gameTime}`,
              owner: "enemy",
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(angle + lightningOffset) * 11.5,
              vy: Math.sin(angle + lightningOffset) * 11.5,
              damage: 14,
              type: "bullet",
              color: "#3b82f6",
              size: 6.5,
              age: 0,
              maxAge: 100
            });
          }

          // Periodic deep sky-bolt warning structures. Red static rings on player which fire down cyan massive bolts!
          if (engine.gameTime % 120 === 0) {
            cyberAudio.playDash();
            engine.camera.shake = 16;
            for (let i = -1; i <= 1; i++) {
              const targetBoltX = pCenterX + i * 110 + (Math.random() * 30 - 15);
              engine.projectiles.push({
                id: `boss_zeus_thunder_${engine.gameTime}_${i}`,
                owner: "enemy",
                x: targetBoltX,
                y: Math.max(0, enemy.y - 80),
                vx: 0,
                vy: 9.0,
                damage: 26,
                type: "gravity",
                color: "#60a5fa",
                size: 22,
                age: 0,
                maxAge: 140
              });
            }
          }
        } else {
          // Default Malphas
          enemy.vx = Math.sin(engine.gameTime * 0.02) * 2 * dt;
          enemy.vy = Math.cos(engine.gameTime * 0.01) * 0.5 * dt;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.health > 600) {
            engine.bossFight.phase = 1;
            if (enemy.shootCooldown <= 0) {
              enemy.shootCooldown = 90;
              const spiralAngle = (engine.gameTime * 0.1);
              engine.projectiles.push({
                id: `boss_l_${engine.gameTime}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(spiralAngle) * 4.5,
                vy: Math.sin(spiralAngle) * 4.5,
                damage: 6,
                type: "laser",
                color: "#fbbf24",
                size: 5,
                age: 0,
                maxAge: 160
              });
            }
          } else if (enemy.health > 300) {
            if (engine.bossFight.phase === 1) {
              engine.bossFight.phase = 2;
              onTriggerWhisper("MALPHAS PHASE 2 ACTIVATED: PREPARE FOR RADIAL COMPRESSION.");
            }
            if (enemy.shootCooldown <= 0) {
              enemy.shootCooldown = 220;
              for (let angleCircle = 0; angleCircle < Math.PI * 2; angleCircle += Math.PI / 4) {
                engine.projectiles.push({
                  id: `boss_c_${engine.gameTime}_${angleCircle}`,
                  owner: "enemy",
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height / 2,
                  vx: Math.cos(angleCircle) * 3.5,
                  vy: Math.sin(angleCircle) * 3.5,
                  damage: 10,
                  type: "shard",
                  color: "#db2777",
                  size: 6,
                  age: 0,
                  maxAge: 160
                });
              }
            }
          } else {
            if (engine.bossFight.phase === 2) {
              engine.bossFight.phase = 3;
              onTriggerWhisper("MALPHAS PHASE 3: FINAL DE-SYNCHRONIZATION ENFORCED.");
            }
            if (enemy.shootCooldown <= 0) {
              enemy.shootCooldown = 40;
              const deviation = (Math.random() * 0.4 - 0.2);
              engine.projectiles.push({
                id: `boss_beam_${engine.gameTime}`,
                owner: "enemy",
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle + deviation) * 8.5,
                vy: Math.sin(angle + deviation) * 8.5,
                damage: 12,
                type: "wave",
                color: "#f43f5e",
                size: 7,
                age: 0,
                maxAge: 140
              });
            }
          }
        }

        enemy.shootCooldown -= dt;
      }
    }

    // 7. PARTICLES MATRIX EFFECTS
    const partsArray = engine.particles;
    const numParts = partsArray.length;
    const aliveParts = [];
    const maxParticles = 130; // Limit active particles to prevent canvas overhead
    const startIndex = numParts > maxParticles ? numParts - maxParticles : 0;

    for (let pi = startIndex; pi < numParts; pi++) {
      const p = partsArray[pi];
      if (p.type === "swipe") {
        p.x = player.x + player.width / 2;
        p.y = player.y + player.height / 2;
        if (p.progress === undefined) p.progress = 0;
        p.progress += 0.18 * dt;
        if (p.progress > 1.0) p.progress = 1.0;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      const nextAlpha = p.alpha - p.decay * dt;
      if (nextAlpha > 0.01) {
        p.alpha = nextAlpha;
        if (p.grow) p.size = Math.min(25, p.size + p.grow * dt);
        aliveParts.push(p);
      }
    }
    engine.particles = aliveParts;

    // Weather rain background layers spawning inside visor container
    if (Math.random() < 0.25) {
      engine.particles.push({
        id: `weath_rain_${Date.now()}_${Math.random()}`,
        x: player.x + Math.random() * 900 - 450,
        y: player.y - 300,
        vx: -1,
        vy: 12,
        color: "rgba(165, 243, 252, 0.15)",
        size: 10,
        alpha: 0.6,
        decay: 0.02,
        type: "rain"
      });
    }
  };

  // Wall-running auto tracking
  const checkWallRunningState = (dx: number, dy: number) => {
    const engine = engineRef.current;
    const player = engine.player;

    if (dy !== -1) return; // Must be sprinting upward/moving north in canvas space near walls

    let againstWall: "left" | "right" | null = null;
    if (!engine.wallsOnly) {
      engine.wallsOnly = engine.grid.filter((segment) => segment.type === "wall" || segment.type === "neon_billboard");
    }
    const wallsOnly = engine.wallsOnly;
    const numWalls = wallsOnly.length;

    for (let i = 0; i < numWalls; i++) {
      const segment = wallsOnly[i];
      if (segment.type === "wall") {
        // Player is touching left side of wall
        if (Math.abs(player.x - (segment.x + segment.width)) < 15 && player.y > segment.y && player.y < segment.y + segment.height) {
          againstWall = "right";
          break;
        }
        // Player is touching right side of wall
        if (Math.abs((player.x + player.width) - segment.x) < 15 && player.y > segment.y && player.y < segment.y + segment.height) {
          againstWall = "left";
          break;
        }
      }
    }

    if (againstWall) {
      player.movementState = "wallrunning";
      player.wallRunSide = againstWall;
      player.slideTimer = 45; // limits frames
      cyberAudio.playDash();
      addStylePoints(60, "WALL RUN ULTRA");
    }
  };

  // Resolve bounding coordinates wall collisions
  const resolveBlockCollision = (entity: any, segment: WorldGridSegment) => {
    // AABB overlapping checking
    const px = entity.x;
    const py = entity.y;
    const pw = entity.width;
    const ph = entity.height;

    const sx = segment.x;
    const sy = segment.y;
    const sw = segment.width;
    const sh = segment.height;

    if (px + pw > sx && px < sx + sw && py + ph > sy && py < sy + sh) {
      // Find overlap depth distances
      const overlapLeft = px + pw - sx;
      const overlapRight = sx + sw - px;
      const overlapTop = py + ph - sy;
      const overlapBottom = sy + sh - py;

      // Find smallest overlap to snap back
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) {
        entity.x -= overlapLeft;
        entity.vx = 0;
      } else if (minOverlap === overlapRight) {
        entity.x += overlapRight;
        entity.vx = 0;
      } else if (minOverlap === overlapTop) {
        entity.y -= overlapTop;
        entity.vy = 0;
      } else if (minOverlap === overlapBottom) {
        entity.y += overlapBottom;
        entity.vy = 0;
      }
    }
  };

  // Render Engine Grid Matrix, player vectors, katanas, particles to canvas
  const drawEngine = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = engineRef.current;
    const camX = engine.camera.x;
    const camY = engine.camera.y;

    // Adaptive performance scaling: disable expensive canvas shadow effects during heavy combat scenes (many entities)
    const entityCount = engine.enemies.length + engine.projectiles.length + engine.particles.length;
    const lowPerfMode = entityCount > 40;
    const shadowMult = lowPerfMode ? 0 : 0.6; // Scale down or completely disable shadow blurring dynamically to avoid lag spikes

    // Intercept all canvas shadowBlur assignments to enforce shadowMult scaling globally with zero leaks/CPU lag
    if (typeof CanvasRenderingContext2D !== "undefined") {
      const originalDesc = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "shadowBlur");
      if (originalDesc && originalDesc.set && originalDesc.get) {
        Object.defineProperty(ctx, "shadowBlur", {
          get() {
            return originalDesc.get!.call(this);
          },
          set(val) {
            originalDesc.set!.call(this, val * shadowMult);
          },
          configurable: true
        });
      }
    }

    // Reset background
    ctx.fillStyle = "#030206";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // BACKDROP LAYER: Scrolling Parallax Cyber-Dust & Starfield
    // Since this is drawn BEFORE translating the camera matrix, we can mathematically drift elements opposite to camX/camY
    for (let i = 0; i < 75; i++) {
      // Seed coordinates mathematically from index parameters 
      const seedValX = (i * 17942.53) % canvas.width;
      const seedValY = (i * 92842.11) % canvas.height;
      const layerDepth = 0.08 + (i % 4) * 0.09; // Speed multipliers: 0.08, 0.17, 0.26, 0.35
      const starSize = 1 + (i % 3) * 0.5; // Sizes: 1px, 1.5px, 2px

      let starX = (seedValX - camX * layerDepth) % canvas.width;
      let starY = (seedValY - camY * layerDepth) % canvas.height;

      // Wrap around bounding boxes
      if (starX < 0) starX += canvas.width;
      if (starY < 0) starY += canvas.height;

      // Choose beautiful glowing neon colors based on index
      if (i % 5 === 0) {
        ctx.fillStyle = "rgba(255, 0, 85, 0.18)"; // Hot pink cyber particles
      } else if (i % 7 === 0) {
        ctx.fillStyle = "rgba(168, 85, 247, 0.22)"; // Cyber fuchsia light
      } else {
        ctx.fillStyle = "rgba(0, 243, 255, 0.14)"; // Neon cyan dust particles
      }

      ctx.beginPath();
      ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render dynamic visual slow-motion filter ripple if slowmo active
    if (engine.player.slowMoActive) {
      // Create radial chromatic aberration or grid lines
      ctx.strokeStyle = "rgba(168, 85, 247, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gridX = 0; gridX < canvas.width; gridX += 30) {
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, canvas.height);
      }
      ctx.stroke();
    }

    // Offset of the Camera matrices
    ctx.translate(-camX, -camY);

    // 1. GRID FLOORS AND PATHS with detailed visual navigation guides (Camera-Relative Viewport Infinite Grid)
    const startGridX = Math.floor((camX - 60) / 60) * 60;
    const endGridX = Math.ceil((camX + canvas.width + 60) / 60) * 60;
    const startGridY = Math.floor((camY - 60) / 60) * 60;
    const endGridY = Math.ceil((camY + canvas.height + 60) / 60) * 60;

    // Batch regular cyan grid lines (Highly optimized single-pass drawing)
    ctx.strokeStyle = "rgba(0, 243, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startGridX; x <= endGridX; x += 60) {
      if (x !== 0) {
        ctx.moveTo(x, startGridY);
        ctx.lineTo(x, endGridY);
      }
    }
    for (let y = startGridY; y <= endGridY; y += 60) {
      if (y !== 0) {
        ctx.moveTo(startGridX, y);
        ctx.lineTo(endGridX, y);
      }
    }
    ctx.stroke();

    // Batch red center baseline axis axes
    ctx.strokeStyle = "rgba(255, 0, 85, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (startGridX <= 0 && endGridX >= 0) {
      ctx.moveTo(0, startGridY);
      ctx.lineTo(0, endGridY);
    }
    if (startGridY <= 0 && endGridY >= 0) {
      ctx.moveTo(startGridX, 0);
      ctx.lineTo(endGridX, 0);
    }
    ctx.stroke();

    // Dynamic grid coordinate stamps every 180px for space awareness (Viewport Restricted)
    const startStampX = Math.floor((camX - 60) / 180) * 180;
    const endStampX = Math.ceil((camX + canvas.width + 60) / 180) * 180;
    const startStampY = Math.floor((camY - 60) / 180) * 180;
    const endStampY = Math.ceil((camY + canvas.height + 60) / 180) * 180;

    ctx.font = "8px monospace";
    for (let x = startStampX; x <= endStampX; x += 180) {
      for (let y = startStampY; y <= endStampY; y += 180) {
        // Neon junction center point
        ctx.fillStyle = "rgba(0, 243, 255, 0.35)";
        ctx.fillRect(x - 2.5, y - 2.5, 5, 5);

        // Visual digital coordinate text overlay
        ctx.fillStyle = "rgba(0, 243, 255, 0.28)";
        ctx.fillText(`[${x},${y}]`, x + 6, y + 12);
        
        // Dynamic horizontal/vertical tick lines for brutalist high-tech look
        ctx.fillStyle = "rgba(255, 0, 85, 0.2)";
        ctx.fillRect(x - 10, y, 20, 1);
        ctx.fillRect(x, y - 10, 1, 20);
      }
    }

    // 2. WORLD ARCHITECTURE SEGMENTS (Optimized with standard high-velocity for loop & disabled shadowBlur on flat walls)
    const gridArray = engine.grid;
    const lenGrid = gridArray.length;
    const margin = 100;
    for (let g = 0; g < lenGrid; g++) {
      const segment = gridArray[g];
      // Frustum viewport culling: do not draw any segments that are completely off-screen
      if (
        segment.x + segment.width < camX - margin ||
        segment.x > camX + canvas.width + margin ||
        segment.y + segment.height < camY - margin ||
        segment.y > camY + canvas.height + margin
      ) {
        continue;
      }

      ctx.save();
      // Disable shadowBlur on regular walls to boost performance, keeping soft glow only on details/flickers
      ctx.shadowBlur = (segment.flicker && Math.random() < 0.15 ? 1 : (segment.type === "wall" ? 0 : 5)) * shadowMult;
      ctx.shadowColor = segment.neonColor || "#059669";
      ctx.fillStyle = segment.type === "wall" ? "#0a0914" : "rgba(6, 182, 212, 0.1)";
      ctx.strokeStyle = segment.neonColor || "#059669";
      ctx.lineWidth = 3;

      ctx.fillRect(segment.x, segment.y, segment.width, segment.height);
      ctx.strokeRect(segment.x, segment.y, segment.width, segment.height);

      // Draw aesthetic detail overlays inside columns
      if (segment.type === "neon_billboard") {
        ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
        ctx.font = "bold 11px monospace";
        ctx.fillText("SACRIFICE", segment.x + 12, segment.y + segment.height / 2);
      } else if (segment.type === "hologram") {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < segment.height; i += 7) {
          ctx.moveTo(segment.x, segment.y + i);
          ctx.lineTo(segment.x + segment.width, segment.y + i);
        }
        ctx.stroke();
      } else if (segment.type === "grapple_anchor") {
        // Draw highly technical scope target
        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.arc(segment.x + 8, segment.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 2.5 DYNAMIC CHASSIS REPAIR & SHIELD UPGRADES PICKUPS (Optimized with standard high-velocity for loop)
    if (engine.pickups) {
      const pickupsArray = engine.pickups;
      const lenPickups = pickupsArray.length;
      for (let pIdx = 0; pIdx < lenPickups; pIdx++) {
        const pickup = pickupsArray[pIdx];
        // Direct viewport boundary culling: do not draw any offscreen pickups
        if (
          pickup.x < camX - 40 ||
          pickup.x > camX + canvas.width + 40 ||
          pickup.y < camY - 40 ||
          pickup.y > camY + canvas.height + 40
        ) {
          continue;
        }
        ctx.save();
        ctx.shadowBlur = 5 * shadowMult; // Reduced from 15 to eliminate rendering lag
        let color = "#00f3ff";
        if (pickup.type === "heal") color = "#10b981";
        else if (pickup.type === "shield") color = "#00f3ff";
        else if (pickup.type === "filament") color = "#ec4899"; // pink
        else if (pickup.type === "alloy") color = "#f59e0b"; // yellow orange
        else if (pickup.type === "core") color = "#a855f7"; // purple
        else color = getMatHexColor(pickup.type);

        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.fillStyle = "#020308";
        ctx.lineWidth = 2;

        const pX = pickup.x;
        const pY = pickup.y;
        
        // Floating hover motion offset
        const hoverOffset = Math.sin(engine.gameTime * 0.08 + pX) * 4;
        const finalY = pY + hoverOffset;

        if (pickup.type === "heal") {
          // Green Bio-Nanite Diamond Core style
          ctx.beginPath();
          ctx.moveTo(pX, finalY - 9);
          ctx.lineTo(pX + 9, finalY);
          ctx.lineTo(pX, finalY + 9);
          ctx.lineTo(pX - 9, finalY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Concentric pulsing outer shield orbitals
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
          ctx.beginPath();
          ctx.arc(pX, finalY, 13 + Math.sin(engine.gameTime * 0.1) * 3, 0, Math.PI * 2);
          ctx.stroke();

          // Green cross inside the healing core
          ctx.fillStyle = "#10b981";
          ctx.fillRect(pX - 1.5, finalY - 4.5, 3, 9);
          ctx.fillRect(pX - 4.5, finalY - 1.5, 9, 3);
        } else if (pickup.type === "shield") {
          // Cyan Hexagonal Shield cell Style
          ctx.beginPath();
          const r = 9;
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const hx = pX + Math.cos(angle) * r;
            const hy = finalY + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Pulsing scanning laser plate across the shield recharger
          ctx.fillStyle = "rgba(0, 243, 255, 0.4)";
          ctx.fillRect(pX - 5, finalY - 1 + Math.sin(engine.gameTime * 0.15) * 4, 10, 2);

          // Outer orbiting target circle ticks
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = "rgba(0, 243, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(pX, finalY, 12, 0, Math.PI * 2);
          ctx.stroke();
        } else if (pickup.type === "filament") {
          // Nano Filament - Elegant Glowing Pink Spiral Strand icon
          ctx.beginPath();
          ctx.arc(pX, finalY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = "#ec4899";
          ctx.beginPath();
          ctx.arc(pX - 2.5, finalY - 2, 2, 0, Math.PI * 2);
          ctx.arc(pX + 2.5, finalY + 2, 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = "rgba(236,72,153,0.7)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(pX - 4, finalY + 4);
          ctx.bezierCurveTo(pX - 2, finalY - 4, pX + 2, finalY + 4, pX + 4, finalY - 4);
          ctx.stroke();
        } else if (pickup.type === "alloy") {
          // Titanium Alloy - Glowing Block/Plate Shape
          ctx.beginPath();
          ctx.rect(pX - 6, finalY - 6, 12, 12);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(pX - 2.5, finalY - 2.5, 5, 5);
          
          // Draw diagonal bracket edges
          ctx.strokeStyle = "rgba(245,158,11,0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pX - 9, finalY);
          ctx.lineTo(pX + 9, finalY);
          ctx.moveTo(pX, finalY - 9);
          ctx.lineTo(pX, finalY + 9);
          ctx.stroke();
        } else if (pickup.type === "core") {
          // Plasma Core - Majestic rotating radiant sphere
          ctx.beginPath();
          ctx.arc(pX, finalY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Center core spark
          const pulse = 2.5 + Math.sin(engine.gameTime * 0.15) * 1.2;
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.arc(pX, finalY, pulse, 0, Math.PI * 2);
          ctx.fill();

          // Crimson pulsing orbit ring
          ctx.strokeStyle = "rgba(168,85,247,0.75)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pX, finalY, 13, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Dynamic visual engine for custom materials, color-coded by rarity
          const matColor = getMatHexColor(pickup.type);
          const isCelestial = ["chrono_reagent", "warp_crystal", "dark_matter", "antimatter_fuel"].includes(pickup.type);
          const isMythicOrLegendary = ["cyber_neuro_mesh", "plasma_core", "vortex_core", "rebel_nanite"].includes(pickup.type);
          const isEpicOrRare = ["quantum_battery", "unstable_plasma", "coolant_rod", "laser_emitter"].includes(pickup.type);

          ctx.shadowBlur = 8 * shadowMult;
          ctx.shadowColor = matColor;
          ctx.strokeStyle = matColor;

          if (isCelestial) {
            // Celestial tier: Rotating diamond/octahedron inside glowing double orbit rings & stars
            const rotationAngle = engine.gameTime * 0.05 + pX;
            ctx.strokeStyle = "rgba(236, 72, 153, 0.45)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pX, finalY, 14, 0, Math.PI * 2);
            ctx.stroke();

            ctx.save();
            ctx.translate(pX, finalY);
            ctx.rotate(rotationAngle);
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(6, 0);
            ctx.lineTo(0, 9);
            ctx.lineTo(-6, 0);
            ctx.closePath();
            ctx.fillStyle = "#020308";
            ctx.fill();
            ctx.strokeStyle = matColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner core cell
            ctx.fillStyle = matColor;
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(3, 0);
            ctx.lineTo(0, 4);
            ctx.lineTo(-3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Sparkling stars
            const starsAngle = engine.gameTime * 0.06;
            const starX = pX + Math.cos(starsAngle) * 11;
            const starY = finalY + Math.sin(starsAngle) * 11;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(starX, starY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (isMythicOrLegendary) {
            // Mythic & Legendary tier: Rotating heavy hex containers
            const rotationAngle = -engine.gameTime * 0.04 + pX;
            ctx.save();
            ctx.translate(pX, finalY);
            ctx.rotate(rotationAngle);
            ctx.beginPath();
            const r = 8;
            for (let i = 0; i < 6; i++) {
              const ang = (i * Math.PI) / 3;
              const hx = Math.cos(ang) * r;
              const hy = Math.sin(ang) * r;
              if (i === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fillStyle = "#020308";
            ctx.fill();
            ctx.strokeStyle = matColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Core energy node
            ctx.fillStyle = matColor;
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else if (isEpicOrRare) {
            // Epic & Rare tier: Rotating diamond square in orbital dash lines
            ctx.save();
            ctx.translate(pX, finalY);
            ctx.rotate(engine.gameTime * 0.03 + pX);
            ctx.beginPath();
            ctx.rect(-6, -6, 12, 12);
            ctx.fillStyle = "#020308";
            ctx.fill();
            ctx.strokeStyle = matColor;
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.restore();

            ctx.strokeStyle = matColor;
            ctx.lineWidth = 0.8;
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.arc(pX, finalY, 11, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // Common & Uncommon tier: Dynamic sleek spinning triangle structures
            ctx.save();
            ctx.translate(pX, finalY);
            ctx.rotate(engine.gameTime * 0.02 + pX);
            ctx.beginPath();
            ctx.moveTo(0, -6.5);
            ctx.lineTo(6, 4.5);
            ctx.lineTo(-6, 4.5);
            ctx.closePath();
            ctx.fillStyle = "#020308";
            ctx.fill();
            ctx.strokeStyle = matColor;
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
      }
    }

    // 3. ENEMY VECTORS (Optimized: Viewport culled for offscreen enemies with fast standard for loop)
    const enemiesArray = engine.enemies;
    const lenEnemies = enemiesArray.length;
    for (let eIdx = 0; eIdx < lenEnemies; eIdx++) {
      const enemy = enemiesArray[eIdx];
      // Direct viewport boundary culling: do not draw any offscreen enemies (safety threshold of 60px)
      if (
        enemy.x + enemy.width < camX - 60 ||
        enemy.x > camX + canvas.width + 60 ||
        enemy.y + enemy.height < camY - 60 ||
        enemy.y > camY + canvas.height + 60
      ) {
        continue;
      }
      ctx.save();
      ctx.shadowBlur = 4 * shadowMult; // Reduced from 10 to speed up rendering considerably!
      ctx.shadowColor = enemy.color;
      ctx.fillStyle = "#0f101a";
      ctx.strokeStyle = enemy.color;
      ctx.lineWidth = 2.5;

      const centerX = enemy.x + enemy.width / 2;
      const centerY = enemy.y + enemy.height / 2;

      if (enemy.type === "drone") {
        // --- SENTINEL SWARM DRONE: Sleek flying drone design ---
        // Rotors & Quad-arms
        ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
        ctx.lineWidth = 2;
        
        // 4 rotor arms extending outward
        const armLength = enemy.width * 0.7;
        const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
        
        angles.forEach(ang => {
          const ax = centerX + Math.cos(ang) * armLength;
          const ay = centerY + Math.sin(ang) * armLength;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(ax, ay);
          ctx.stroke();

          // Mini glowing rotors at tip
          ctx.fillStyle = "#0f101a";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ax, ay, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Rotor spinning blades
          const spinningOffset = engine.gameTime * 0.4;
          ctx.beginPath();
          ctx.moveTo(ax - Math.cos(spinningOffset) * 6, ay - Math.sin(spinningOffset) * 6);
          ctx.lineTo(ax + Math.cos(spinningOffset) * 6, ay + Math.sin(spinningOffset) * 6);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.stroke();
        });

        // Center primary orb pod
        ctx.fillStyle = "#0f101a";
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, enemy.width / 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing red camera eye pointing towards facing angle
        const eyeX = centerX + Math.cos(enemy.angle) * (enemy.width / 4);
        const eyeY = centerY + Math.sin(enemy.angle) * (enemy.width / 4);
        ctx.fillStyle = "#ff0055";
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();

      } else if (enemy.type === "ninja") {
        // --- CYBER NINJA: Sleek humanoid chassis with dual blades ---
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(enemy.angle);

        // Athletic athletic torso
        ctx.fillStyle = "#0a0a14";
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.lineTo(10, -15);
        ctx.lineTo(6, 15);
        ctx.lineTo(-6, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shimmering Ninja Shoulder plates
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-15, -16, 5, 5);
        ctx.fillRect(10, -16, 5, 5);

        // Glowing neon head visor
        ctx.fillStyle = "#0f101a";
        ctx.beginPath();
        ctx.arc(0, -22, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = enemy.color;
        ctx.fillRect(-4, -24, 8, 2.5); // Visor strip

        // Dual crossed sharp energy blades projecting from back
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;

        // Blade 1
        ctx.beginPath();
        ctx.moveTo(-6, -5);
        ctx.lineTo(-24, 15);
        ctx.stroke();

        // Blade 2
        ctx.beginPath();
        ctx.moveTo(6, -5);
        ctx.lineTo(24, 15);
        ctx.stroke();

        ctx.restore();

      } else if (enemy.type === "android") {
        // --- FAILED PROTOTYPE MK3 (HEAVY COMBAT TANK / MECH!) ---
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(enemy.angle);

        // 1. LEFT AND RIGHT HEAVY CATERPILLAR CRAWLER TRACKS
        ctx.fillStyle = "#05060b";
        ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
        ctx.lineWidth = 2;
        
        // Track bounds
        const trackW = enemy.width * 1.05;
        const trackH = 8;
        
        // Draw Left Track
        ctx.fillRect(-trackW / 2, -enemy.height / 2 - 1, trackW, trackH);
        ctx.strokeRect(-trackW / 2, -enemy.height / 2 - 1, trackW, trackH);

        // Draw Right Track
        ctx.fillRect(-trackW / 2, enemy.height / 2 - 7, trackW, trackH);
        ctx.strokeRect(-trackW / 2, enemy.height / 2 - 7, trackW, trackH);

        // Animated scrolling tread ridges on the tanks! (Driven by gameTime and velocity!)
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 1;
        const treadStep = 7;
        const treadScroll = (engine.gameTime * 0.45) % treadStep;
        
        // Left tracks lines
        for (let tx = -trackW / 2 + treadScroll; tx < trackW / 2; tx += treadStep) {
          ctx.beginPath();
          ctx.moveTo(tx, -enemy.height / 2 - 1);
          ctx.lineTo(tx, -enemy.height / 2 + 7);
          ctx.stroke();
        }
        // Right track lines
        for (let tx = -trackW / 2 + treadScroll; tx < trackW / 2; tx += treadStep) {
          ctx.beginPath();
          ctx.moveTo(tx, enemy.height / 2 - 7);
          ctx.lineTo(tx, enemy.height / 2 + 1);
          ctx.stroke();
        }

        // 2. HEAVY ARMORED HULL CENTER CORE
        ctx.fillStyle = "#0a0b12";
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-enemy.width / 2, -enemy.height / 3);
        ctx.lineTo(enemy.width / 2.2, -enemy.height / 3);
        ctx.lineTo(enemy.width / 2.2, enemy.height / 3);
        ctx.lineTo(-enemy.width / 2, enemy.height / 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cyberhazard orange/yellow warning markings on hull
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(-enemy.width / 3, -2, 6, 4);

        // 3. ROTATING WEAPON TURRET MAIN DOME
        ctx.fillStyle = "#04050a";
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.width / 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 4. MAIN HEAVY KINETIC CANNON MUZZLE (DOUBLE BARRELED!)
        ctx.fillStyle = "#0c0d16";
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;

        // Barrel 1
        ctx.fillRect(enemy.width / 4, -4.5, enemy.width * 0.6, 3);
        ctx.strokeRect(enemy.width / 4, -4.5, enemy.width * 0.6, 3);
        
        // Barrel 2
        ctx.fillRect(enemy.width / 4, 1.5, enemy.width * 0.6, 3);
        ctx.strokeRect(enemy.width / 4, 1.5, enemy.width * 0.6, 3);

        // Glowing warning light at turret gun joint
        ctx.fillStyle = "#ff0055";
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-2, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

      } else if (enemy.type === "boss") {
        const sub = enemy.bossSubType || "malphas";
        ctx.save();
        ctx.translate(centerX, centerY);

        if (sub === "malphas") {
          // --- AI SAINT MALPHAS ---
          ctx.rotate(engine.gameTime * 0.008);

          // Concentration rings
          ctx.strokeStyle = "rgba(0, 243, 255, 0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.70, 0, Math.PI * 2);
          ctx.stroke();

          // Outer octagonal shield segments spinning
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          const spinStart = engine.gameTime * 0.015;
          ctx.arc(0, 0, enemy.width * 0.55, spinStart, spinStart + Math.PI * 0.4);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.55, spinStart + Math.PI, spinStart + Math.PI * 1.4);
          ctx.stroke();

          // Central towering octagon structures
          ctx.fillStyle = "#030408";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 4;
          
          ctx.beginPath();
          const sides = 8;
          const r = enemy.width / 2.2;
          for (let i = 0; i <= sides; i++) {
            const angleVal = (i * 2 * Math.PI) / sides;
            const x = Math.cos(angleVal) * r;
            const y = Math.sin(angleVal) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Blazing central generator
          ctx.fillStyle = "#0c0d16";
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width / 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ff0055";
          ctx.stroke();

          ctx.fillStyle = "#ff0055";
          ctx.shadowColor = "#ff0055";
          ctx.shadowBlur = 20;
          ctx.beginPath();
          const pulseCore = r / 3.5 + Math.sin(engine.gameTime * 0.1) * 2;
          ctx.arc(0, 0, pulseCore, 0, Math.PI * 2);
          ctx.fill();

        } else if (sub === "behemoth") {
          // --- BEHEMOTH TITAN ---
          // Giant quadruply armored box with rotating outer plates and thrusters
          ctx.rotate(engine.gameTime * 0.003); // ultra-slow for massive feel
          ctx.fillStyle = "#161310";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 5;

          // Box hull - perfectly balanced central square center
          const hw = enemy.width / 2.5;
          const hh = enemy.height / 2.5;
          ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
          ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);

          // Heavy heavy revolving shield units (4 rotating plates in orbit)
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 2 + engine.gameTime * 0.012);
            ctx.fillStyle = "#2d241c";
            ctx.fillRect(enemy.width / 2.1 - 6, -10, 12, 20);
            ctx.strokeRect(enemy.width / 2.1 - 6, -10, 12, 20);
            ctx.restore();
          }

          // Symmetrical corner glowing generator thrusters (completely symmetric in 4 diagonal directions)
          ctx.fillStyle = "#f97316";
          const cornerX = enemy.width / 2.6;
          const cornerY = enemy.height / 2.6;
          ctx.beginPath();
          ctx.arc(-cornerX, -cornerY, 8 + Math.sin(engine.gameTime * 0.2) * 2, 0, Math.PI * 2);
          ctx.arc(cornerX, -cornerY, 8 + Math.sin(engine.gameTime * 0.2) * 2, 0, Math.PI * 2);
          ctx.arc(-cornerX, cornerY, 8 + Math.sin(engine.gameTime * 0.2) * 2, 0, Math.PI * 2);
          ctx.arc(cornerX, cornerY, 8 + Math.sin(engine.gameTime * 0.2) * 2, 0, Math.PI * 2);
          ctx.fill();

        } else if (sub === "lilith") {
          // --- LILITH RED QUEEN (Super Enhanced Pure Crimson Core) ---
          // Sleek, high-contrast triangular chassis styled strictly with 3 elegant cohesive colors: Deep Amethyst-Black, Plasma Pink, and Pure White.
          ctx.rotate(engine.gameTime * 0.024);
          
          const rTri = enemy.width / 2;
          const hRatio = Math.sqrt(3) / 2; // ~0.866025
          const dy = rTri * hRatio;

          // Outer rotating equilateral triangular projection field (Pink field, spins in reverse)
          ctx.save();
          ctx.rotate(-engine.gameTime * 0.015);
          ctx.strokeStyle = "rgba(236, 72, 153, 0.22)"; // Pink projection lines
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const rField = rTri * 1.35;
          const dyField = rField * hRatio;
          ctx.moveTo(rField, 0);
          ctx.lineTo(-rField / 2, -dyField);
          ctx.lineTo(-rField / 2, dyField);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();

          // Rapid technical ring spins (Cohesive pink concentric orbits)
          ctx.strokeStyle = "rgba(236, 72, 153, 0.25)"; // Pink primary orbit
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.72, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = "rgba(236, 72, 153, 0.15)"; // Pink secondary orbit
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.85, 0, Math.PI * 2);
          ctx.stroke();

          // Underlay: Draw 3 thermal plasma thruster plumes (Pink exhaust)
          ctx.fillStyle = "rgba(236, 72, 153, 0.45)"; // Pink thermal exhaust
          const pulseOffset = 12 + Math.sin(engine.gameTime * 0.25) * 5;
          // Midpoint AB thruster
          ctx.save();
          ctx.translate(rTri / 4, -dy / 2);
          ctx.rotate(Math.PI / 6);
          ctx.fillRect(-5, 0, 10, pulseOffset);
          ctx.restore();
          // Midpoint BC thruster
          ctx.save();
          ctx.translate(-rTri / 2, 0);
          ctx.rotate(Math.PI);
          ctx.fillRect(-5, 0, 10, pulseOffset);
          ctx.restore();
          // Midpoint CA thruster
          ctx.save();
          ctx.translate(rTri / 4, dy / 2);
          ctx.rotate(-Math.PI / 6);
          ctx.fillRect(-5, 0, 10, pulseOffset);
          ctx.restore();

          // 1. Draw mechanical stabilizers extending from vertices
          ctx.strokeStyle = "rgba(236, 72, 153, 0.5)"; // Medium-dark pink stabilizer frame
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          // Apex support
          ctx.moveTo(rTri, 0); ctx.lineTo(rTri * 1.25, 0);
          // Rear-left support
          ctx.moveTo(-rTri / 2, -dy); ctx.lineTo(-rTri * 0.625, -dy * 1.25);
          // Rear-right support
          ctx.moveTo(-rTri / 2, dy); ctx.lineTo(-rTri * 0.625, dy * 1.25);
          ctx.stroke();

          // 2. Main equilateral chassis (Deep amethyst-black interior with neon pink boundaries)
          ctx.fillStyle = "#0c0517"; // Ultra-dark body (Color 1 - Deep Amethyst-Black)
          ctx.strokeStyle = "#ec4899"; // Neon Pink (Color 2 - Plasma Pink)
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(rTri, 0); // apex front
          ctx.lineTo(-rTri / 2, -dy); // rear-left
          ctx.lineTo(-rTri / 2, dy); // rear-right
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Outer protective pink trim on the border
          ctx.strokeStyle = "rgba(236, 72, 153, 0.7)"; // Radiant Pink Trim
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(rTri * 0.8, 0);
          ctx.lineTo(-rTri * 0.4, -dy * 0.82);
          ctx.lineTo(-rTri * 0.4, dy * 0.82);
          ctx.closePath();
          ctx.stroke();

          // 3. Glowing circuits/conduits inside (Neon pink conduits only!)
          ctx.strokeStyle = "#ec4899";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(rTri * 0.5, 0);
          ctx.moveTo(0, 0);
          ctx.lineTo(-rTri * 0.25, -dy * 0.5);
          ctx.moveTo(0, 0);
          ctx.lineTo(-rTri * 0.25, dy * 0.5);
          ctx.stroke();
          
          // Glowing capacitor points (Plasma Pink)
          ctx.fillStyle = "#ec4899";
          ctx.beginPath();
          ctx.arc(rTri * 0.5, 0, 3.5, 0, Math.PI * 2);
          ctx.arc(-rTri * 0.25, -dy * 0.5, 3.5, 0, Math.PI * 2);
          ctx.arc(-rTri * 0.25, dy * 0.5, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // 4. Opposing Inner spinning miniature induction matrix (Mini solid ring with pink boundary)
          ctx.save();
          ctx.rotate(-engine.gameTime * 0.038);
          ctx.fillStyle = "#1e0b30"; // Dark Indigo fill
          ctx.strokeStyle = "#ec4899"; // Pink stroke
          ctx.lineWidth = 2;
          const rMini = rTri * 0.45;
          const dyMini = rMini * hRatio;
          ctx.beginPath();
          ctx.moveTo(rMini, 0);
          ctx.lineTo(-rMini / 2, -dyMini);
          ctx.lineTo(-rMini / 2, dyMini);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 5. Symmetrical vertex glowing crystal prism nodes
          ctx.fillStyle = "#ec4899"; // Pink
          ctx.shadowColor = "#ec4899";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(rTri * 1.25, 0, 6, 0, Math.PI * 2); // apex node
          ctx.arc(-rTri * 0.625, -dy * 1.25, 5.5, 0, Math.PI * 2); // rear-left node
          ctx.arc(-rTri * 0.625, dy * 1.25, 5.5, 0, Math.PI * 2); // rear-right node
          ctx.fill();

          // Additional vertex glows internally
          ctx.fillStyle = "#ec4899";
          ctx.shadowColor = "#ec4899";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(rTri * 0.85, 0, 3.5, 0, Math.PI * 2);
          ctx.arc(-rTri * 0.42, -dy * 0.85, 3.5, 0, Math.PI * 2);
          ctx.arc(-rTri * 0.42, dy * 0.85, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // 6. Floating orbital ruby fragments (Pink & White shards only)
          ctx.shadowBlur = 0;
          for (let i = 0; i < 3; i++) {
            const rotVal = (i * 2 * Math.PI) / 3 + engine.gameTime * 0.022;
            const ox = Math.cos(rotVal) * (rTri * 1.55);
            const oy = Math.sin(rotVal) * (rTri * 1.55);
            ctx.save();
            ctx.translate(ox, oy);
            ctx.rotate(engine.gameTime * 0.05);
            ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#ec4899"; // Alternating Pink & White shards (Color 2 & 3)
            ctx.strokeStyle = "rgba(236, 72, 153, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -6); ctx.lineTo(5, 0); ctx.lineTo(0, 6); ctx.lineTo(-5, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // Blazing minimalist dual-color core reactor (Pulsing pink and white core layers)
          ctx.fillStyle = "rgba(236, 72, 153, 0.35)"; // Pink base halo
          ctx.beginPath();
          ctx.arc(0, 0, 16 + Math.sin(engine.gameTime * 0.18) * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ec4899"; // Pink middle reactor
          ctx.shadowColor = "#ec4899";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(0, 0, 9 + Math.sin(engine.gameTime * 0.18) * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff"; // White-hot core (Color 3 - Pure White)
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

        } else if (sub === "orion") {
          // --- ORION HIGH OVERSEER ---
          // Giant golden crescent spacecraft wings with electric antennas
          // Spinning exception requested: spins freely with cosmic movement!
          ctx.rotate(engine.gameTime * 0.012);
          ctx.fillStyle = "#0c0f1d";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 4;

          // Symmetrical sweeping wing arcs on both left and right sides
          for (let side = -1; side <= 1; side += 2) {
            ctx.save();
            ctx.scale(side, 1); // Mirrored horizontally
            ctx.beginPath();
            ctx.arc(0, 0, enemy.width / 2.1, -Math.PI / 1.4, Math.PI / 1.4);
            ctx.stroke();
            ctx.restore();
          }

          // Symmetrical rectangular pods on top and bottom sides
          for (let sideY = -1; sideY <= 1; sideY += 2) {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(-8, sideY * (enemy.height / 1.7) - 6, 16, 12);
            ctx.strokeRect(-8, sideY * (enemy.height / 1.7) - 6, 16, 12);
          }

          // Golden oversee optic laser eyes (central pulsing)
          ctx.fillStyle = "#eab308";
          ctx.shadowColor = "#eab308";
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();

        } else if (sub === "xenon" || sub === "apex") {
          // --- XENON & APEX ---
          // Sleek glowing purple hexagon mainframe surrounded by rotating defense shields
          // Hexagon is a polygon, so it spins freely
          ctx.rotate(engine.gameTime * 0.012);
          ctx.fillStyle = "#120e22";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 4;

          // Regular hexagon (symmetric in all directions)
          const rHex = enemy.width / 2.2;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const rotVal = (i * Math.PI) / 3;
            const x = Math.cos(rotVal) * rHex;
            const y = Math.sin(rotVal) * rHex;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // High frequency concentric force shields of identical radii on left and right for absolute symmetry
          ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.67, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.67, Math.PI / 2, -Math.PI / 2);
          ctx.stroke();

          ctx.fillStyle = "#a855f7";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, 12 + Math.cos(engine.gameTime * 0.12) * 3, 0, Math.PI * 2);
          ctx.fill();

        } else if (sub === "nemesis") {
          // --- NEMESIS GEOMETRIC MATRIX (Pure Symmetrical Geometric Design) ---
          // Crafted from clean, high-precision polygons: outer rotating hexagon, 
          // sharp rhombus wings, and dual-layered rotating central diamond.
          
          // 1. Sleek Outer Hexagon (Rotating field)
          ctx.save();
          ctx.rotate(engine.gameTime * 0.02);
          ctx.strokeStyle = "rgba(0, 243, 255, 0.4)"; // Neon Cyan
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          const hexRadius = enemy.width * 0.9;
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const hx = Math.cos(angle) * hexRadius;
            const hy = Math.sin(angle) * hexRadius;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();

          // 2. Symmetrical Sharp Wings (Rhombus shape extending outwards horizontally)
          ctx.fillStyle = "#0c1524"; // Symmetrical Tech Slate
          ctx.strokeStyle = "#a855f7"; // Neon Purple border
          ctx.lineWidth = 2.5;

          // Left Wing
          ctx.beginPath();
          ctx.moveTo(-enemy.width * 0.25, -enemy.height * 0.2);
          ctx.lineTo(-enemy.width * 1.1, 0);
          ctx.lineTo(-enemy.width * 0.25, enemy.height * 0.2);
          ctx.lineTo(-enemy.width * 0.12, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Wing
          ctx.beginPath();
          ctx.moveTo(enemy.width * 0.25, -enemy.height * 0.2);
          ctx.lineTo(enemy.width * 1.1, 0);
          ctx.lineTo(enemy.width * 0.25, enemy.height * 0.2);
          ctx.lineTo(enemy.width * 0.12, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Symmetrical inner neon laser core lines inside the wings
          ctx.strokeStyle = "#ffffff";
          ctx.shadowColor = "#00f3ff";
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          // Left wing laser line
          ctx.moveTo(-enemy.width * 0.22, 0);
          ctx.lineTo(-enemy.width * 1.0, 0);
          // Right wing laser line
          ctx.moveTo(enemy.width * 0.22, 0);
          ctx.lineTo(enemy.width * 1.0, 0);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // 3. Central Symmetrical Diamond Core
          ctx.save();
          ctx.rotate(-engine.gameTime * 0.03); // Rotates in opposite direction
          
          // Outer diamond container
          ctx.fillStyle = "#160f29"; // Deep purple-black base
          ctx.strokeStyle = "#00f3ff"; // Neon Cyan edge
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          const dSize = enemy.width * 0.45;
          ctx.moveTo(dSize, 0);
          ctx.lineTo(0, -dSize);
          ctx.lineTo(-dSize, 0);
          ctx.lineTo(0, dSize);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Inner white-hot diamond reactor
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#00f3ff";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          const dInner = enemy.width * 0.2;
          ctx.moveTo(dInner, 0);
          ctx.lineTo(0, -dInner);
          ctx.lineTo(-dInner, 0);
          ctx.lineTo(0, dInner);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();

        } else if (sub === "astraea") {
          // --- ASTRAEA DEFENDER (Redesigned Cosmos Matrix Star) ---
          // Symmetrical polygon shape spinning beautifully with time
          ctx.rotate(engine.gameTime * 0.015);

          // Outer shimmering geometric 10-pointed star-shield system
          ctx.fillStyle = "#021217";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3;

          ctx.beginPath();
          const points = 5;
          const rOuter = enemy.width / 2;
          const rInner = enemy.width / 3.2;
          for (let i = 0; i < points * 2; i++) {
            const rotVal = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? rOuter : rInner;
            ctx.lineTo(Math.cos(rotVal) * radius, Math.sin(rotVal) * radius);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Interlocking structural tech-lines connecting opposite star points to center
          ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
          ctx.lineWidth = 1.5;
          for (let i = 0; i < points; i++) {
            const angleVal = (i * 2 * Math.PI) / points;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angleVal) * rOuter, Math.sin(angleVal) * rOuter);
            ctx.stroke();
          }

          // Rotating orbit ring with detailed shield segment hashes
          ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, rOuter * 0.75, 0, Math.PI * 2);
          ctx.stroke();

          // Symmetrical orbital node emitters at each star peak
          for (let i = 0; i < points; i++) {
            const angleVal = (i * 2 * Math.PI) / points;
            const nodeX = Math.cos(angleVal) * rOuter;
            const nodeY = Math.sin(angleVal) * rOuter;
            
            // Draw a high-tech glowing diamond node on each vertex
            ctx.save();
            ctx.translate(nodeX, nodeY);
            ctx.rotate(engine.gameTime * 0.05);
            ctx.fillStyle = "#22d3ee";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // Central hyper-compact energy core
          ctx.save();
          ctx.rotate(-engine.gameTime * 0.02);
          ctx.strokeStyle = "#22d3ee";
          ctx.lineWidth = 2.5;
          // Draw an inner rotating micro-pentagon
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const rotVal = (i * 2 * Math.PI) / 5;
            const x = Math.cos(rotVal) * (enemy.width / 5);
            const y = Math.sin(rotVal) * (enemy.width / 5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();

          // Star core glowing cyan matrix
          ctx.fillStyle = "#06b6d4";
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 0, 8 + Math.sin(engine.gameTime * 0.15) * 2, 0, Math.PI * 2);
          ctx.fill();

        } else if (sub === "kronos") {
          // --- KRONOS CHRONO DEVOURER ---
          // Chronal hourglass with revolving temporal rings in reverse directions
          // Not 4-directionally symmetrical: faces the player directly
          ctx.rotate(enemy.angle);
          ctx.fillStyle = "#071a16";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 4;

          // Perfect bilateral and 4-way symmetrical Hourglass silhouette
          ctx.beginPath();
          ctx.moveTo(-enemy.width / 2.5, -enemy.height / 2);
          ctx.lineTo(enemy.width / 2.5, -enemy.height / 2);
          ctx.lineTo(enemy.width / 6, 0);
          ctx.lineTo(enemy.width / 2.5, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2.5, enemy.height / 2);
          ctx.lineTo(-enemy.width / 6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Green orbit vectors spinning
          ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.58, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#10b981";
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 17;
          ctx.beginPath();
          ctx.arc(0, 0, 11 + Math.sin(engine.gameTime * 0.16) * 3, 0, Math.PI * 2);
          ctx.fill();

        } else if (sub === "asmodeus") {
          // --- ASMODEUS ANNIHILATOR ---
          // Giant hot red industrial furnace base with exhaust ports leaking heat
          ctx.rotate(engine.gameTime * 0.006);
          ctx.fillStyle = "#1b090c";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 5;

          ctx.beginPath();
          ctx.arc(0, 0, enemy.width / 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4 exhaust block corners - fully balanced
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 2);
            ctx.fillStyle = "#2c0e11";
            ctx.fillRect(-14, enemy.width / 2.2 - 6, 28, 12);
            ctx.strokeRect(-14, enemy.width / 2.2 - 6, 28, 12);
            ctx.restore();
          }

          // Blazing super-heated core
          ctx.fillStyle = "#f43f5e";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(0, 0, 16 + Math.sin(engine.gameTime * 0.15) * 4, 0, Math.PI * 2);
          ctx.fill();

        } else if (sub === "valkyrie") {
          // --- VALKYRIE BLADE MATRIX EXTREME ---
          // Golden mechanical cyber-angel wings with celestial halo
          // Point the sharp top tip directly towards player (- Math.PI / 2) - turned 180 degrees
          ctx.rotate(enemy.angle - Math.PI / 2);
          ctx.fillStyle = "#1e1a0b";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3.5;

          // Shield core - perfectly mirrored left-to-right
          ctx.beginPath();
          ctx.moveTo(0, -enemy.height / 2.5);
          ctx.lineTo(enemy.width / 2.5, -enemy.height / 5);
          ctx.lineTo(enemy.width / 3.4, enemy.height / 3.2);
          ctx.lineTo(0, enemy.height / 2);
          ctx.lineTo(-enemy.width / 3.4, enemy.height / 3.2);
          ctx.lineTo(-enemy.width / 2.5, -enemy.height / 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Majestic golden wing vectors
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-enemy.width / 3.4, -8);
          ctx.lineTo(-enemy.width * 0.85, -enemy.height * 0.35);
          ctx.lineTo(-enemy.width * 0.58, 6);
          ctx.moveTo(enemy.width / 3.4, -8);
          ctx.lineTo(enemy.width * 0.85, -enemy.height * 0.35);
          ctx.lineTo(enemy.width * 0.58, 6);
          ctx.stroke();

          // Halo orbit
          ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.68, 0, Math.PI * 2);
          ctx.stroke();

        } else if (sub === "zeus") {
          // --- ZEUS SUPERCONDUCTOR ---
          // High-voltage cobalt stator block wrapping 4 heavy energy coils
          ctx.rotate(engine.gameTime * 0.011);
          ctx.fillStyle = "#0c142c";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 4.5;

          // Main coil engine block
          ctx.fillRect(-enemy.width / 2.7, -enemy.height / 2.7, enemy.width / 1.35, enemy.height / 1.35);
          ctx.strokeRect(-enemy.width / 2.7, -enemy.height / 2.7, enemy.width / 1.35, enemy.height / 1.35);

          // Rotating copper stator coils
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
            ctx.fillStyle = "#1b273d";
            ctx.fillRect(enemy.width / 2.7, -7, 10, 14);
            ctx.strokeRect(enemy.width / 2.7, -7, 10, 14);
            ctx.restore();
          }

          // Electric field lines
          ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.width * 0.82, 0, Math.PI * 2);
          ctx.stroke();

          // Superconductor cobalt core
          ctx.fillStyle = "#3b82f6";
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(0, 0, 12 + Math.sin(engine.gameTime * 0.22) * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Target pointing guide vector
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(enemy.angle);
        ctx.beginPath();
        ctx.moveTo(enemy.width / 2.22, -6);
        ctx.lineTo(enemy.width / 2.22 + 15, 0);
        ctx.lineTo(enemy.width / 2.22, 6);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.restore();

      } else {
        // Fallback
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }

      // Draw aesthetic detail coordinates text overlays inside enemy bodies
      ctx.font = "8px monospace";
      ctx.fillStyle = enemy.color;
      
      // Compute correct overlay text depending on type
      let textCode = "DRON";
      if (enemy.type === "ninja") textCode = "NINJ";
      else if (enemy.type === "android") textCode = "TANK"; // Tank designation!
      else if (enemy.type === "boss") textCode = "GOD_X";

      ctx.fillText(textCode, enemy.x + 3, enemy.y + enemy.height - 4);

      // Enemy Health overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(enemy.x - 5, enemy.y - 12, enemy.width + 10, 5);
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x - 5, enemy.y - 12, (enemy.width + 10) * (enemy.health / enemy.maxHealth), 5);

      ctx.restore();
    }

    // 4. PLAYER RENDER VEHICLE MATRIX
    const p = engine.player;
    ctx.save();
    ctx.shadowBlur = 18;
    
    // Choose base skin styling colors directly based on EQUIPPED ARMOR!
    let skinColor = "#2dd4bf"; // default mecha cyan
    let visorColor = "#ffffff";

    if (equippedArmor === "dragon_set") {
      skinColor = "#ef4444"; // high-energy ruby red
      visorColor = "#ffedd5";
    } else if (equippedArmor === "shadow_set") {
      skinColor = "#312e81"; // deep midnight purple/indigo stealth suit
      visorColor = "#818cf8";
    } else if (equippedArmor === "crystal_set") {
      skinColor = "#06b6d4"; // glinting refractive cyan crystal
      visorColor = "#ecfeff";
    } else if (equippedArmor === "berserker_set") {
      skinColor = "#b91c1c"; // wild red berserker
      visorColor = "#fca5a5";
    } else if (equippedArmor === "celestial_set") {
      skinColor = "#f59e0b"; // golden sun celestial
      visorColor = "#fef3c7";
    } else if (equippedArmor === "void_set") {
      skinColor = "#7c3aed"; // starry event horizon purple
      visorColor = "#ede9fe";
    } else if (equippedArmor === "storm_set") {
      skinColor = "#3b82f6"; // neon high-voltage electric blue
      visorColor = "#dbeafe";
    } else if (equippedArmor === "titan_set") {
      skinColor = "#475569"; // industrial titan slate-gray
      visorColor = "#f1f5f9";
    }

    // Visor HUD highlights depending on movement states
    const activeColor = p.movementState === "dashing" 
      ? (equippedArmor === "dragon_set" || equippedArmor === "berserker_set" ? "#991b1b" : equippedArmor === "celestial_set" ? "#a16207" : equippedArmor === "void_set" ? "#7c3aed" : "#db2777") 
      : p.movementState === "wallrunning" 
        ? "#38bdf8" 
        : skinColor;

    ctx.shadowColor = activeColor;
    ctx.fillStyle = "#0c0d16";
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 3;

    // Draw auxiliary plating and decals depending on active Armor Suit
    if (equippedArmor === "celestial_set") {
      // Golden celestial thrusters
      ctx.fillStyle = "#713f12";
      ctx.fillRect(p.x - 5, p.y + 8, 4, 18);
      ctx.fillRect(p.x + p.width + 1, p.y + 8, 4, 18);
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - 5, p.y + 8, 4, 18);
      ctx.strokeRect(p.x + p.width + 1, p.y + 8, 4, 18);
      
      // Floating orbit shield vector rings
      ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    } else if (equippedArmor === "dragon_set" || equippedArmor === "berserker_set") {
      // Demon/Dragon cybernetic horns protruding from top
      ctx.strokeStyle = equippedArmor === "dragon_set" ? "#ef4444" : "#b91c1c";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 3, p.y);
      ctx.lineTo(p.x - 3, p.y - 7);
      ctx.moveTo(p.x + p.width - 3, p.y);
      ctx.lineTo(p.x + p.width + 3, p.y - 7);
      ctx.stroke();

      // Menacing scarlet quantum aura rings
      ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.45, 0, Math.PI * 2);
      ctx.stroke();
    } else if (equippedArmor === "void_set") {
      // Ultimate Void cosmic ornaments & heavy purple wings
      ctx.fillStyle = "#581c87";
      ctx.fillRect(p.x - 7, p.y + 6, 5, 22);
      ctx.fillRect(p.x + p.width + 2, p.y + 6, 5, 22);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x - 7, p.y + 6, 5, 22);
      ctx.strokeRect(p.x + p.width + 2, p.y + 6, 5, 22);

      // Fluorescent cyan horns
      ctx.strokeStyle = "#00f3ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 3, p.y);
      ctx.lineTo(p.x - 4, p.y - 10);
      ctx.moveTo(p.x + p.width - 3, p.y);
      ctx.lineTo(p.x + p.width + 4, p.y - 10);
      ctx.stroke();

      // Cosmic rotating high-velocity halo ring
      const haloPulse = engine.gameTime * 0.08;
      ctx.strokeStyle = "rgba(168, 85, 247, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.55 + Math.sin(haloPulse) * 3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (equippedArmor === "shadow_set") {
      // Sleek indigo stabilizer fins
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(p.x - 4, p.y + 10, 3, 14);
      ctx.fillRect(p.x + p.width + 1, p.y + 10, 3, 14);
      
      // Floating shadow trail/aura
      ctx.strokeStyle = "rgba(49, 46, 129, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.25, 0, Math.PI * 2);
      ctx.stroke();
    } else if (equippedArmor === "crystal_set") {
      // Refractive cyan crystal shards rising
      ctx.strokeStyle = "#00f3ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 4, p.y);
      ctx.lineTo(p.x + p.width / 4, p.y - 6);
      ctx.moveTo(p.x + p.width - 4, p.y);
      ctx.lineTo(p.x + p.width * 0.75, p.y - 6);
      ctx.stroke();

      // Neon cyan outline orbit rings
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (equippedArmor === "storm_set") {
      // High-voltage lightning coils
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(p.x - 6, p.y + 4, 4, 20);
      ctx.fillRect(p.x + p.width + 2, p.y + 4, 4, 20);
      
      // Electric sparks pulsing
      const sparkTime = engine.gameTime * 0.12;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.3 + Math.sin(sparkTime) * 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (equippedArmor === "titan_set") {
      // Extra heavy shielding plates overlapping the edges
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(p.x - 5, p.y + 2, 4, p.height - 4);
      ctx.fillRect(p.x + p.width + 1, p.y + 2, 4, p.height - 4);
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - 5, p.y + 2, 4, p.height - 4);
      ctx.strokeRect(p.x + p.width + 1, p.y + 2, 4, p.height - 4);
    } else {
      // Original Mecha signal antenna element for "none"
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + p.width / 2, p.y - 8);
      ctx.stroke();
    }

    // Reset base drawing brush for main rect
    const isTank = (equippedArmor === "titan_set");

    if (isTank) {
      // 1. LEFT AND RIGHT HEAVY TREADS FOR PLAYER
      ctx.fillStyle = "#0a0b10";
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;
      
      const trackW = p.width * 1.15;
      const trackH = 7;
      
      // Draw Left Track
      ctx.fillRect(p.x - (trackW - p.width) / 2, p.y - 4, trackW, trackH);
      ctx.strokeRect(p.x - (trackW - p.width) / 2, p.y - 4, trackW, trackH);

      // Draw Right Track
      ctx.fillRect(p.x - (trackW - p.width) / 2, p.y + p.height - 3, trackW, trackH);
      ctx.strokeRect(p.x - (trackW - p.width) / 2, p.y + p.height - 3, trackW, trackH);

      // Animated scrolling treads based on velocity or gameTime
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 0.8;
      const treadStep = 6;
      const treadScroll = (engine.gameTime * 0.3) % treadStep;
      
      // Left tread lines
      for (let tx = p.x - (trackW - p.width) / 2 + treadScroll; tx < p.x + p.width + (trackW - p.width) / 2; tx += treadStep) {
        ctx.beginPath();
        ctx.moveTo(tx, p.y - 4);
        ctx.lineTo(tx, p.y + 3);
        ctx.stroke();
      }
      // Right tread lines
      for (let tx = p.x - (trackW - p.width) / 2 + treadScroll; tx < p.x + p.width + (trackW - p.width) / 2; tx += treadStep) {
        ctx.beginPath();
        ctx.moveTo(tx, p.y + p.height - 3);
        ctx.lineTo(tx, p.y + p.height + 4);
        ctx.stroke();
      }

      // 2. HEAVY ARMOR CHASSIS CENTER PLATE
      ctx.fillStyle = "#0c0d18";
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 3;
      ctx.fillRect(p.x, p.y + 2, p.width, p.height - 4);
      ctx.strokeRect(p.x, p.y + 2, p.width, p.height - 4);

    } else {
      // Original normal player/chassis draw
      ctx.lineWidth = 3;
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = "#0c0d16";
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeRect(p.x, p.y, p.width, p.height);

      // Glowing head piece visor
      ctx.fillStyle = visorColor;
      ctx.fillRect(p.x + 3, p.y + 4, p.width - 6, 8);
    }

    // Facing direction line to mouse
    const startX = p.x + p.width / 2;
    const startY = p.y + p.height / 2;
    const facingAngle = Math.atan2(engine.mouse.y - startY, engine.mouse.x - startX);

    if (isTank) {
      // Rotating weapon turret main dome
      ctx.save();
      ctx.translate(startX, startY);
      ctx.rotate(facingAngle);

      ctx.fillStyle = "#040509";
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.width / 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Main heavy kinetic muzzle (double barreled)
      ctx.fillStyle = "#0c0d16";
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;

      // Barrel 1
      ctx.fillRect(p.width / 4, -4.5, p.width * 0.55, 3);
      ctx.strokeRect(p.width / 4, -4.5, p.width * 0.55, 3);
      
      // Barrel 2
      ctx.fillRect(p.width / 4, 1.5, p.width * 0.55, 3);
      ctx.strokeRect(p.width / 4, 1.5, p.width * 0.55, 3);

      // Glowing core at turret gun joint
      ctx.fillStyle = visorColor;
      ctx.beginPath();
      ctx.arc(-2, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // Regular facing line pointing to mouse
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + Math.cos(facingAngle) * 20, startY + Math.sin(facingAngle) * 20);
      ctx.strokeStyle = activeColor;
      ctx.stroke();
    }

    // Red Laser laser sights indicating tracking!
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(engine.mouse.x, engine.mouse.y);
    ctx.stroke();

    // Draw active grappling rope tethering line if grappling
    if (p.movementState === "grappling" && p.grapplePoint) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#34d399";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#34d399";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(p.grapplePoint.x, p.grapplePoint.y);
      ctx.stroke();
    }

    // PRESTIGE LEVEL VISUALS: Glowing Rotating Crown and Orbiting Shimmering Orbs
    if (prestigeLevel > 0) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#f59e0b"; // Golden sun glow!
      
      // Rotating Golden Orbs based on prestigeLevel
      const prestigeOrbCount = Math.min(6, prestigeLevel);
      const time = engine.gameTime * 0.04;
      
      for (let i = 0; i < prestigeOrbCount; i++) {
        const offsetAngle = (i * (Math.PI * 2)) / prestigeOrbCount + time;
        const radius = p.width * 1.5 + (i * 2);
        const orbitX = p.x + p.width/2 + Math.cos(offsetAngle) * radius;
        const orbitY = p.y + p.height/2 + Math.sin(offsetAngle) * radius;
        
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(orbitX, orbitY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Floating Tiny Crown above mecha
      const crownY = p.y - 12 - Math.sin(engine.gameTime * 0.08) * 3;
      ctx.fillStyle = "#fbbf24";
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(p.x + p.width/2 - 8, crownY);
      ctx.lineTo(p.x + p.width/2 - 6, crownY - 5);
      ctx.lineTo(p.x + p.width/2 - 2, crownY - 1);
      ctx.lineTo(p.x + p.width/2,     crownY - 7);
      ctx.lineTo(p.x + p.width/2 + 2, crownY - 1);
      ctx.lineTo(p.x + p.width/2 + 6, crownY - 5);
      ctx.lineTo(p.x + p.width/2 + 8, crownY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    }

    // PROGRESSIVE ABSOLVED ESSENCE VISUAL MUTATIONS (Chassis alterations from defeated machine gods)
    const bossesKilledAmt = bossesKilled;
    if (bossesKilledAmt >= 1) {
      // 1. Dual orbiting cyan signal energy nodes
      const time = engine.gameTime * 0.05;
      const orbX1 = p.x + p.width / 2 + Math.cos(time) * 24;
      const orbY1 = p.y + p.height / 2 + Math.sin(time) * 24;
      const orbX2 = p.x + p.width / 2 - Math.cos(time) * 24;
      const orbY2 = p.y + p.height / 2 - Math.sin(time) * 24;

      ctx.save();
      ctx.fillStyle = "#00f3ff";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00f3ff";
      ctx.beginPath();
      ctx.arc(orbX1, orbY1, 4, 0, Math.PI * 2);
      ctx.arc(orbX2, orbY2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (bossesKilledAmt >= 2) {
      // 2. Burning hazard orange thruster exhausts on shoulders
      ctx.save();
      ctx.strokeStyle = "rgba(249, 115, 22, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#f97316";
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Flame exhaust thrusters sparks from shoulders
      if (Math.random() < 0.4) {
        engine.particles.push({
          id: `sparks_thr_${Date.now()}_${Math.random()}`,
          x: p.x + (Math.random() < 0.5 ? -2 : p.width + 2),
          y: p.y + p.height - 2,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 + 1,
          color: "#f97316",
          size: Math.random() * 3 + 1,
          alpha: 1.0,
          decay: 0.06,
          type: "spark"
        });
      }
      ctx.restore();
    }
    if (bossesKilledAmt >= 3) {
      // 3. High-frequency sakura pink energy stabilizer wings
      ctx.save();
      ctx.fillStyle = "rgba(236, 72, 153, 0.45)";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ec4899";
      ctx.beginPath();
      // left stabilized energy wing
      ctx.moveTo(p.x, p.y + 10);
      ctx.lineTo(p.x - 18, p.y - 2);
      ctx.lineTo(p.x - 6, p.y + 14);
      ctx.closePath();
      // right stabilized energy wing
      ctx.moveTo(p.x + p.width, p.y + 10);
      ctx.lineTo(p.x + p.width + 18, p.y - 2);
      ctx.lineTo(p.x + p.width + 6, p.y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (bossesKilledAmt >= 4) {
      // 4. Gold stellar crown of neural thunder discharge loops above helmet
      ctx.save();
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#eab308";
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2 - 10, p.y - 4);
      ctx.lineTo(p.x + p.width / 2 - 5, p.y - 14);
      ctx.lineTo(p.x + p.width / 2, p.y - 6);
      ctx.lineTo(p.x + p.width / 2 + 5, p.y - 14);
      ctx.lineTo(p.x + p.width / 2 + 10, p.y - 4);
      ctx.stroke();
      ctx.restore();
    }
    if (bossesKilledAmt >= 5) {
      // 5. Majestic Rotating violet holographic energy nodes & matrix shield
      ctx.save();
      ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#a855f7";
      ctx.setLineDash([6, 4]); // Cool dotted retro term visual styling!
      const radialPulse = engine.gameTime * 0.04;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 2.1, radialPulse, radialPulse + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset drawing brush
      ctx.restore();
    }

    ctx.restore();

    // 5. PROJECTILES RENDERED (Optimized: Viewport culled, zero-shadow quick-render pass for arcade speed)
    const renderProjs = engine.projectiles;
    const lenProjs = renderProjs.length;
    for (let i = 0; i < lenProjs; i++) {
      const proj = renderProjs[i];
      // Direct viewport bounding box culling: skip drawing any offscreen bullet
      if (
        proj.x < camX - 30 ||
        proj.x > camX + canvas.width + 30 ||
        proj.y < camY - 30 ||
        proj.y > camY + canvas.height + 30
      ) {
        continue;
      }

      ctx.fillStyle = proj.color;
      const dSz = proj.size * 2;
      ctx.fillRect(proj.x - proj.size, proj.y - proj.size, dSz, dSz);
    }

    // 6. PARTICLES RENDERED (Optimized: Viewport culled and batched state saves)
    const renderParts = engine.particles;
    const lenParts = renderParts.length;
    for (let pi = 0; pi < lenParts; pi++) {
      const part = renderParts[pi];
      // Direct viewport check: skip offscreen particles
      const px = part.x;
      const py = part.y;
      if (
        px < camX - 50 ||
        px > camX + canvas.width + 50 ||
        py < camY - 50 ||
        py > camY + canvas.height + 50
      ) {
        continue;
      }

      if (part.type === "text" && part.text) {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.font = "bold 11px monospace";
        ctx.shadowBlur = 4;
        ctx.shadowColor = part.color;
        ctx.fillText(part.text, px, py);
        ctx.restore();
      } else if (part.type === "grid") {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.strokeStyle = part.color;
        ctx.strokeRect(px - part.size / 2, py - part.size / 2, part.size, part.size);
        ctx.restore();
      } else if (part.type === "rain") {
        ctx.globalAlpha = part.alpha;
        ctx.strokeStyle = part.color;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + part.size);
        ctx.stroke();
      } else if (part.type === "glow") {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        
        // Draw double pass glow
        ctx.beginPath();
        ctx.arc(px, py, part.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = part.color;
        ctx.shadowBlur = 12 * shadowMult;
        ctx.shadowColor = part.color;
        ctx.fill();

        // Draw hot white center
        ctx.beginPath();
        ctx.arc(px, py, part.size * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.fill();

        ctx.restore();
      } else if (part.type === "swipe") {
        ctx.save();
        ctx.globalAlpha = part.alpha;

        const startA = part.startAngle || 0;
        const endA = part.endAngle || 0;
        const thickness = part.thickness || 10;
        const radius = part.size - thickness;
        const prog = part.progress !== undefined ? part.progress : 1.0;

        const currentEnd = startA + (endA - startA) * prog;
        const currentStart = startA + (endA - startA) * Math.max(0, prog - 0.45);

        const numSegs = 20;

        // Pre-Pass: Soft Spatial Air Motion Blur Behind Slash (creates gorgeous futuristic lens/kinetic sword drag)
        // Highly optimized: Completely skip this extremely slow canvas-filter-blur if we are in low performance or high load!
        if (shadowMult > 0) {
          ctx.save();
          ctx.filter = "blur(12px)";
          ctx.fillStyle = part.color || "#10b981";
          ctx.globalAlpha = part.alpha * 0.22;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.arc(px, py, radius + thickness, currentStart, currentEnd);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Pass 1: Wide Glowing Neo-Crescent
        ctx.shadowBlur = 18 * shadowMult;
        ctx.shadowColor = part.color || "#10b981";
        ctx.strokeStyle = part.color || "#10b981";
        ctx.lineCap = "round";

        for (let i = 0; i < numSegs; i++) {
          const t1 = i / numSegs;
          const t2 = (i + 1) / numSegs;
          const a1 = currentStart + (currentEnd - currentStart) * t1;
          const a2 = currentStart + (currentEnd - currentStart) * t2;
          const midT = (t1 + t2) / 2;

          const taper = Math.sin(midT * Math.PI);
          const currentThickness = thickness * taper * 1.5;

          ctx.lineWidth = currentThickness;
          ctx.beginPath();
          ctx.arc(px, py, radius, a1, a2);
          ctx.stroke();
        }

        // Pass 2: Bright White Solid Hot-Core Crescent Inside
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        for (let i = 0; i < numSegs; i++) {
          const t1 = i / numSegs;
          const t2 = (i + 1) / numSegs;
          const a1 = currentStart + (currentEnd - currentStart) * t1;
          const a2 = currentStart + (currentEnd - currentStart) * t2;
          const midT = (t1 + t2) / 2;

          const taper = Math.sin(midT * Math.PI);
          const currentThickness = thickness * taper * 0.55;

          ctx.lineWidth = currentThickness;
          ctx.beginPath();
          ctx.arc(px, py, radius, a1, a2);
          ctx.stroke();
        }

        ctx.restore();
      } else {
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.fillRect(px - part.size / 2, py - part.size / 2, part.size, part.size);
      }
    }
    ctx.globalAlpha = 1.0; // Reset global alpha

    ctx.restore();
  };

  return (
    <div className="flex-1 w-full flex flex-col md:flex-row bg-[#020205] text-[#00f3ff] border-t border-[#00f3ff]/10">
      {/* Game Canvas Board */}
      <div ref={containerRef} className="flex-1 relative border-r border-[#00f3ff]/10 min-h-[350px]">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

        {/* Floating Cybernetic HUD Overlays */}
        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2.5 max-w-[280px] bg-black/85 backdrop-blur-md p-4 rounded-md border border-[#00f3ff]/30 font-mono text-xs shadow-[0_0_20px_rgba(0,243,255,0.12)]">
          <div className="flex items-center gap-1.5 mb-1.5 font-black text-[#00f3ff] border-b border-[#00f3ff]/15 pb-1.5 justify-between">
            <span className="flex items-center gap-1.5"><Gauge size={14} /> VISOR HUD V2.4</span>
            <span className="text-[#ff0055] animate-pulse font-bold tracking-widest text-[9px]">DIAGNOSTIC</span>
          </div>

          {/* Health indicator */}
          <div>
            <div className="flex justify-between mb-1 text-[10px] font-bold">
              <span className="text-slate-400">CHASSIS CORE:</span>
              <span className="text-[#00f3ff] font-extrabold">{Math.round(chassisHealth)} / {chassisMaxHealth}</span>
            </div>
            <div className="w-full h-3 bg-slate-900 border border-slate-700 p-[1px] rounded-sm">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                style={{ width: `${(chassisHealth / chassisMaxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Shield Indicator */}
          <div>
            <div className="flex justify-between mb-1 text-[10px] font-bold">
              <span className="text-slate-400 flex items-center gap-1"><Shield size={12} /> SHIELD MATRIX:</span>
              <span className="text-[#00f3ff] font-extrabold">{Math.round(chassisShield)} / {chassisMaxShield}</span>
            </div>
            <div className="w-full h-3 bg-slate-900 border border-slate-700 p-[1px] rounded-sm">
              <div
                className="h-full bg-gradient-to-r from-[#00f3ff] to-[#0284c7] transition-all duration-100 shadow-[0_0_8px_#00f3ff]"
                style={{ width: `${(chassisShield / chassisMaxShield) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Repair Stimpacks */}
          <div>
            <div className="flex justify-between mb-1 text-[10px] font-bold">
              <span className="text-slate-400 flex items-center gap-1">REPAIR AMPOULES:</span>
              <span className={nanoInjectors > 0 ? "text-emerald-400 font-extrabold" : "text-slate-600 font-extrabold"}>
                {nanoInjectors} / {3 + (unlockedUpgrades["stim_overdrive"] || 0)} Charges
              </span>
            </div>
            <button
              onClick={triggerCoreRepair}
              id="active-nano-core-repair-btn"
              disabled={nanoInjectors === 0}
              className={`w-full p-2 py-1.5 flex gap-2 items-center justify-center font-mono font-bold text-[10px] rounded border transition-all cursor-pointer ${
                nanoInjectors > 0
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/70 hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-[98%]"
                  : "bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed"
              }`}
            >
              <div className="flex gap-1.5">
                {Array.from({ length: 3 + (unlockedUpgrades["stim_overdrive"] || 0) }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-sm border ${
                      idx < nanoInjectors
                        ? "bg-emerald-400 border-emerald-300 shadow-[0_0_4px_#10b981]"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  />
                ))}
              </div>
              <span className="uppercase tracking-widest ml-1 text-[9px]">REPAIR STIM (PRESS Q)</span>
            </button>
          </div>

          {/* Slow-mo Energy */}
          <div>
            <div className="flex justify-between mb-1 text-[10px] font-bold">
              <span className="text-slate-400 flex items-center gap-1"><Zap size={12} /> DIVE OVERCLOCK:</span>
              <span className="text-[#ff0055] font-extrabold">{Math.round(slowMoEnergy)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-900 border border-slate-700 p-[1px] rounded-sm">
              <div
                className="h-full bg-gradient-to-r from-[#ff0055] to-fuchsia-600 transition-all duration-100 shadow-[0_0_8px_#ff0055]"
                style={{ width: `${slowMoEnergy}%` }}
              />
            </div>
          </div>

          {/* System Coordinates & Live Vector Radar */}
          <div className="border-t border-[#00f3ff]/15 pt-2 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 text-[8.5px] uppercase font-bold tracking-wider">MOTION VECTOR:</span>
              <div className="text-white text-[11px] font-black tracking-wide flex flex-col font-mono">
                <span>LOC: {playerLoc.x}, {playerLoc.y}</span>
                <span className="text-[#00f3ff] text-[9.5px]">HDG: {getHeadingName(playerLoc.vx, playerLoc.vy)}</span>
              </div>
            </div>

            {/* Micro circular target vector */}
            <div className="w-10 h-10 rounded-full border border-[#00f3ff]/30 bg-slate-950 flex items-center justify-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,243,255,0.06)_0%,transparent_75%)] animate-pulse" />
              <div className="absolute w-full h-[1px] bg-[#00f3ff]/20 top-1/2 left-0" />
              <div className="absolute h-full w-[1px] bg-[#00f3ff]/20 left-1/2 top-0" />
              {/* Actual heading vector dot with absolute constraints */}
              <div 
                className="absolute w-1.5 h-1.5 rounded-full bg-[#ff0055] transition-all duration-75 shadow-[0_0_6px_#ff0055]"
                style={{
                  transform: `translate(${Math.max(-12, Math.min(12, playerLoc.vx * 3.2))}px, ${Math.max(-12, Math.min(12, playerLoc.vy * 3.2))}px)`
                }}
              />
              <div className="absolute w-1 h-1 rounded-full bg-[#00f3ff] left-1/2 top-1/2 -ml-0.5 -mt-0.5" />
            </div>
          </div>
        </div>

        {/* Right side combos ranking float cards */}
        <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2.5">
          <div className="bg-black/85 backdrop-blur-md py-4 px-6 rounded-md border border-[#ff0055]/30 text-center flex flex-col items-center shadow-[0_0_20px_rgba(255,0,85,0.12)]">
            <span className="font-mono text-[9px] text-[#ff0055] font-black tracking-widest uppercase">STYLE MULTIPLIER</span>
            <span
              className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#00f3ff] via-[#ff0055] to-amber-400 animate-bounce drop-shadow-[0_0_15px_rgba(255,0,85,0.3)]"
            >
              {styleRank}
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono text-[10px] text-[#00f3ff] font-extrabold uppercase">x {comboMultiplier} COMBO</span>
              {comboTimer > 0 && (
                <div className="w-12 h-1 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00f3ff]" style={{ width: `${(comboTimer / 180) * 100}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Score Counter */}
          <div className="bg-slate-950/95 backdrop-blur-md px-4 py-2 rounded-md border border-[#00f3ff]/15 font-mono text-[10px] flex justify-between w-[150px] font-bold tracking-wider text-white">
            <span className="text-slate-500">SCORE:</span>
            <span className="text-white font-extrabold">{score}</span>
          </div>
        </div>

        {/* Cinematic Top Boss Gauge overlay */}
        {bossActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-[500px] w-full px-4 text-center">
            <div className="bg-black/95 backdrop-blur-md p-3.5 rounded-md border border-[#ff0055] flex flex-col gap-1.5 shadow-[0_0_20px_rgba(255,0,85,0.45)]">
              <div className="flex items-center justify-between font-mono text-[#ff0055] text-xs font-black uppercase tracking-wider">
                <span className="flex items-center gap-1 text-white bg-[#ff0055] px-1.5 py-0.5 rounded text-[9px]"><ShieldAlert size={12} className="animate-spin" /> THREAT ACTIVE</span>
                <span className="tracking-widest font-extrabold text-[#ff0055]">{bossName}</span>
                <span className="text-white text-[10px]">{Math.round((bossHealth / bossMaxHealth) * 100)}% DETECTOR</span>
              </div>
              <div className="w-full h-3 bg-slate-950 border border-slate-800 p-0.5 rounded shadow-[inset_0_0_4px_black]">
                <div
                  className="h-full bg-gradient-to-r from-[#ff0055] via-amber-500 to-[#00f3ff] transition-all duration-100 shadow-[0_0_12px_#ff0055]"
                  style={{ width: `${(bossHealth / bossMaxHealth) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[7.5px] text-slate-500 font-extrabold tracking-widest leading-none">
                <span>REPLICATOR INTEGRITY STATE</span>
                <span>{bossHealth} / {bossMaxHealth} AP</span>
              </div>
            </div>
          </div>
        )}

        {/* Cyberpunk Dynamic Pause Overlay Panel */}
        {isPaused && (
          <div className="absolute inset-0 z-50 bg-[#030307]/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[340px] w-full bg-[#07080f]/95 border-2 border-[#ff0055]/50 rounded-lg p-6 shadow-[0_0_35px_rgba(255,0,85,0.3)] relative text-white font-mono flex flex-col gap-5 text-center">
              
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[#ff0055] font-black tracking-[0.25em] text-[10px] uppercase animate-pulse">● SIMULATION PAUSED ●</span>
                <h3 className="text-xl font-black tracking-wide text-white">TACTICAL OVERRIDE</h3>
                <div className="h-[2px] w-4/5 bg-gradient-to-r from-transparent via-[#ff0055] to-transparent my-1" />
                <p className="text-[10px] text-slate-400 max-w-[280px]">
                  All combat thread pipelines are currently suspended. You can safely modify audio feedback grids or return to standard command.
                </p>
              </div>

              {/* Sound & Mute Toggle Grid */}
              <div className="bg-slate-900/40 p-3 rounded-md border border-[#ff0055]/10 flex flex-col gap-2 text-left">
                <span className="text-slate-500 font-bold text-[8px] uppercase tracking-wider">COMMAND METRIC SUMMARY:</span>
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>ACTIVE SECTOR WAVE:</span>
                  <span className="text-[#00f3ff] font-extrabold font-mono">WAVE {engineRef.current?.wave || 1}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>DEFEATED SQUADRONS:</span>
                  <span className="text-[#fbbf24] font-extrabold font-mono">{scoreRef.current} UNITS</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>DEFEATED MACHINE GODS:</span>
                  <span className="text-[#ef4444] font-extrabold font-mono">{bossesKilled}</span>
                </div>
              </div>

              {/* Action Choices buttons list */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#ff0055] to-purple-600 hover:from-[#ff0055]/90 hover:to-purple-600/90 text-white font-mono text-xs font-black rounded tracking-widest border border-white/10 hover:border-white/20 transition-all cursor-pointer uppercase shadow-[0_0_15px_rgba(255,0,85,0.2)]"
                >
                  RESUME COMBAT THREAD
                </button>

                <button
                  onClick={() => {
                    const isMuted = cyberAudio.getMuteState();
                    cyberAudio.toggleMute();
                    setMuted(!isMuted);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded text-xs tracking-wider cursor-pointer font-extrabold transition-colors flex justify-center items-center gap-1.5"
                >
                  {muted ? "🔊 UNMUTE CHANNELS" : "🔇 MUTE CHANNELS"}
                </button>

                <button
                  onClick={() => {
                    setIsPaused(false);
                    onHomePress();
                  }}
                  className="w-full py-2 bg-slate-950/80 hover:bg-red-950/40 text-red-500 hover:text-red-400 border border-red-900/35 hover:border-red-500/50 rounded text-xs tracking-wider cursor-pointer transition-colors"
                >
                  ABANDON RUN TO TITLE
                </button>
              </div>

              <div className="text-[8px] text-slate-500 font-medium tracking-widest uppercase">
                PRESS ESC OR P TO TOGGLE PAUSE
              </div>

            </div>
          </div>
        )}

        {/* Mid-Game Tactical Shop Overlay */}
        {shopOpen && (
          <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[460px] w-full bg-[#05050b] border-2 border-[#fbbf24]/50 rounded-lg p-5 shadow-[0_0_30px_rgba(251,191,36,0.25)] relative text-white">
              <button
                onClick={() => setShopOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white font-mono text-sm tracking-tighter"
              >
                [X] CLOSE
              </button>
              
              <div className="flex flex-col items-center text-center gap-1 mb-4">
                <span className="text-[#fbbf24] font-black tracking-widest text-[11px] uppercase">[ TACTICAL GEAR & REBOOT CONSOLE ]</span>
                <h3 className="text-lg font-black tracking-wider text-white">SINGLE-RUN MUNITIONS</h3>
                <p className="text-[10px] text-slate-400 max-w-[340px]">
                  Chassis hardware updates and ammunition purchases bought using credits earned during combat. All benefits terminate when the game run ends.
                </p>
              </div>

              {/* Player capital stats panel */}
              <div className="bg-slate-950 p-2.5 rounded border border-[#fbbf24]/20 flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-[9px] uppercase">CAPITAL LIQUID CREDITS:</span>
                  <span className="text-[#fbbf24] font-mono font-black text-sm tracking-wider">{credits} ₩</span>
                </div>
                <div className="font-mono text-[8px] text-slate-400">
                  RUN DAMAGE SCALER: <span className="text-[#00f3ff] font-extrabold">{Math.round(tempDamageMultiplierRef.current * 100)}%</span>
                </div>
              </div>

              {/* Shop Items list */}
              <div className="flex flex-col gap-3 font-mono">
                {/* 1. HP Repair */}
                <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#10b981]">CORE ADRENALINE HP (+40 Integrity)</span>
                    <span className="text-[8.5px] text-slate-400">Regain immediate structural chassis shell HP</span>
                  </div>
                  <button
                    onClick={() => {
                      const player = engineRef.current.player;
                      if (credits < 30) {
                        cyberAudio.playGlitch();
                        onTriggerWhisper("TRANSACTION FAULT: SHORT ON CREDITS.");
                        return;
                      }
                      if (player.health >= player.maxHealth) {
                        onTriggerWhisper("SYSTEM REFUSE: HEALTH CAPACITY STABLE.");
                        return;
                      }
                      setCredits(prev => prev - 30);
                      player.health = Math.min(player.maxHealth, player.health + 40);
                      setChassisHealth(player.health);
                      cyberAudio.playHack();
                      onTriggerWhisper("TACTICAL HP RECONSTRUCTION COMPLETE.");
                    }}
                    className="px-3 py-1.5 bg-[#10b981]/20 hover:bg-[#10b981]/40 border border-[#10b981] text-white rounded font-mono text-[10px] font-extrabold cursor-pointer transition-colors"
                  >
                    BUY / 30 ₩
                  </button>
                </div>

                {/* 2. Shield Restore */}
                <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#00f3ff]">DEFLECTOR SHIELD (+45 Shield)</span>
                    <span className="text-[8.5px] text-slate-400">Recharge standard kinetic defector absorber shield</span>
                  </div>
                  <button
                    onClick={() => {
                      const player = engineRef.current.player;
                      if (credits < 25) {
                        cyberAudio.playGlitch();
                        onTriggerWhisper("TRANSACTION FAULT: SHORT ON CREDITS.");
                        return;
                      }
                      if (player.shield >= player.maxShield) {
                        onTriggerWhisper("SYSTEM REFUSE: SHIELD ACCUMULATOR MATRICES FULL.");
                        return;
                      }
                      setCredits(prev => prev - 25);
                      player.shield = Math.min(player.maxShield, player.shield + 45);
                      setChassisShield(player.shield);
                      cyberAudio.playHack();
                      onTriggerWhisper("DEFLECTOR HARVEST CONVERSION SUCCESSFUL.");
                    }}
                    className="px-3 py-1.5 bg-[#00f3ff]/20 hover:bg-[#00f3ff]/40 border border-[#00f3ff] text-white rounded font-mono text-[10px] font-extrabold cursor-pointer transition-colors"
                  >
                    BUY / 25 ₩
                  </button>
                </div>

                {/* 3. Damage Overdrive */}
                <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#fbbf24]">DAMAGE OVERDRIVE (+10% SCALE)</span>
                    <span className="text-[8.5px] text-slate-400">Scale weapon output by +10% this session</span>
                  </div>
                  <button
                    onClick={() => {
                      if (credits < 75) {
                        cyberAudio.playGlitch();
                        onTriggerWhisper("TRANSACTION FAULT: SHORT ON CREDITS.");
                        return;
                      }
                      setCredits(prev => prev - 75);
                      tempDamageMultiplierRef.current += 0.10;
                      cyberAudio.playHack();
                      onTriggerWhisper("PRIMED CONVERSION UP: FIREGUN WEAPONS OUT " + Math.round(tempDamageMultiplierRef.current * 100) + "%.");
                    }}
                    className="px-3 py-1.5 bg-[#fbbf24]/20 hover:bg-[#fbbf24]/40 border border-[#fbbf24] text-white rounded font-mono text-[10px] font-extrabold cursor-pointer transition-colors"
                  >
                    BUY / 75 ₩
                  </button>
                </div>

                {/* 4. Buy Ammo */}
                <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-rose-500">MUNICIPAL MUNITIONS (+50% AMMO)</span>
                    <span className="text-[8.5px] text-slate-400">Re-supply tactical fire pistols/shotguns/railguns</span>
                  </div>
                  <button
                    onClick={() => {
                      const player = engineRef.current.player;
                      if (credits < 20) {
                        cyberAudio.playGlitch();
                        onTriggerWhisper("TRANSACTION FAULT: SHORT ON CREDITS.");
                        return;
                      }
                      
                      let alreadyFull = true;
                      player.weapons.forEach((wp) => {
                        if (wp.type !== "katana" && wp.ammo < wp.maxAmmo) {
                          alreadyFull = false;
                        }
                      });

                      if (alreadyFull) {
                        onTriggerWhisper("SYSTEM REFUSE: ALL WEAPON MAGAZINES FULL.");
                        return;
                      }

                      setCredits(prev => prev - 20);
                      player.weapons.forEach((wp) => {
                        if (wp.type !== "katana") {
                          wp.ammo = Math.min(wp.maxAmmo, wp.ammo + Math.round(wp.maxAmmo * 0.5));
                        }
                      });
                      
                      // Sync to UI state
                      setActiveWeapon({ ...player.weapons[player.activeWeaponIndex] });
                      cyberAudio.playHack();
                      onTriggerWhisper("WEAPONS BULLETS HARVEST RE-SUPPLY SECURED.");
                    }}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500 text-white rounded font-mono text-[10px] font-extrabold cursor-pointer transition-colors"
                  >
                    BUY / 20 ₩
                  </button>
                </div>
              </div>

              {/* Tip info panel */}
              <div className="mt-4 text-center font-mono text-[8px] text-slate-500 uppercase tracking-widest leading-none">
                [ TIP ] OPEN OVERLAY AT ANY TIME DURING BATTLE BY PRESSING TAB / T KEY
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right control panel & weapon armory selection */}
      <aside className="w-full md:w-[325px] p-6 bg-[#040409] flex flex-col justify-between font-mono text-xs gap-4 relative border-t md:border-t-0 md:border-l border-[#00f3ff]/10">
        
        {/* Navigation Action Toolbar */}
        <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-md border border-[#00f3ff]/15">
          <span className="text-[9px] text-[#00f3ff]/70 font-black tracking-widest uppercase">SYSTEM COGNITION CONTROLS</span>
          <div className="grid grid-cols-2 gap-2 text-[9.5px] font-bold">
            <button
              onClick={() => {
                cyberAudio.playHack();
                if (onHomePress) onHomePress();
              }}
              id="game-home-nav-btn"
              className="flex items-center justify-center gap-1.5 py-2 px-1.5 rounded bg-slate-950 border border-[#ff0055]/30 hover:border-[#ff0055] hover:bg-[#ff0055]/10 text-slate-300 hover:text-white transition-all cursor-pointer text-center select-none"
              title="Abort current run and sync back to title screen Safely"
            >
              ← HOME SYNC
            </button>
            <button
              onClick={() => {
                cyberAudio.playHack();
                setShowControls(true);
              }}
              id="game-controls-manual-btn"
              className="flex items-center justify-center gap-1.5 py-2 px-1.5 rounded bg-[#00f3ff]/5 border border-[#00f3ff]/30 hover:border-[#00f3ff] hover:bg-[#00f3ff]/15 text-[#00f3ff] hover:text-white transition-all cursor-pointer text-center select-none animate-pulse"
              title="Inspect detailed training manual and key bindings guide"
            >
              🕹️ MANUAL
            </button>
          </div>

          <button
            onClick={() => {
              setShopOpen(true);
              cyberAudio.playHack();
            }}
            id="game-shop-toggle-btn"
            className="w-full mt-2.5 py-2.5 px-3 rounded border border-dashed border-[#fbbf24] hover:bg-[#fbbf24]/10 text-[#fbbf24] text-[10px] font-black tracking-widest uppercase cursor-pointer hover:shadow-[0_0_15px_rgba(251,191,36,0.15)] transition-all flex items-center justify-center gap-2 select-none"
          >
            <span>🛍️</span> OPEN TACTICAL SHOP [TAB]
          </button>
        </div>

        {/* Armory Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#00f3ff] border-b border-[#00f3ff]/15 pb-2 font-bold uppercase tracking-wider">
            <Swords size={16} /> Cyber Chassis Armory
          </div>

          <div className="flex flex-col gap-2">
            {engineRef.current.player.weapons.map((w, index) => {
              const works = activeWeapon?.id === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => changeWeapon(index)}
                  className={`w-full text-left p-2.5 rounded-md transition-all duration-300 border cursor-pointer select-none ${
                    works
                      ? "bg-slate-950 border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.15)] text-white"
                      : "bg-[#0b0c16]/50 border-slate-900 text-slate-400 hover:border-[#00f3ff]/20 hover:text-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-[10.5px] uppercase flex items-center gap-1.5">
                      <ChevronRight size={12} className={works ? "text-[#00f3ff]" : "text-transparent"} />
                      {index + 1}. {w.name}
                    </span>
                    {w.type !== "katana" ? (
                      <span className={w.ammo === 0 ? "text-[#ff0055] font-black" : "text-[#00f3ff] font-bold"}>
                        {w.ammo} / {w.maxAmmo}
                      </span>
                    ) : (
                      <span className="text-[#00f3ff] font-bold uppercase">REFLECTIVE</span>
                    )}
                  </div>
                  <p className="text-[9px] leading-relaxed text-slate-400 pl-4">{w.desc}</p>
                </button>
              );
            })}
          </div>
        </section>



        {/* Technical help guidelines */}
        <section className="bg-[#0b080f] p-3 rounded-md border border-[#ff0055]/15 flex flex-col gap-2">
          <div className="font-black text-[#00f3ff] flex items-center gap-1.5 mb-0.5 text-[9.5px] tracking-wider uppercase"><HelpCircle size={14} /> COMBAT PROTOCOL</div>
          <p className="text-[9.5px] leading-relaxed text-slate-400">
            <span className="text-[#00f3ff] font-bold">WALL RUN:</span> Press <span className="text-white font-bold">w</span> when sprint dragging adjacent to columns.
          </p>
          <p className="text-[9.5px] leading-relaxed text-slate-400">
            <span className="text-sky-400 font-bold">DASH SLIDE:</span> Hit <span className="text-white font-bold">SPACE</span> to trigger invincibility frames.
          </p>
          <p className="text-[9.5px] leading-relaxed text-slate-400">
            <span className="text-[#ff0055] font-bold">SLICE:</span> Left-click with Katana to deflect red missiles.
          </p>
          <p className="text-[9.5px] leading-relaxed text-slate-400">
            <span className="text-purple-400 font-bold">BULLET TIME:</span> Hold <span className="text-white font-bold">SHIFT</span> to overclock temporal speed.
          </p>
        </section>
      </aside>

      {/* Render detailed pop-up controls manual if activated during play */}
      {showControls && (
        <ControlsManual onClose={() => setShowControls(false)} />
      )}
    </div>
  );
}
