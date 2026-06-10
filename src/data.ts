export interface CraftableWeapon {
  id: string;
  name: string;
  category: "melee" | "primary" | "secondary";
  type: string; // katana, pistol, shotgun, railgun, gravity, etc.
  desc: string;
  color: string;
  creditCost: number;
  materialsCost: { [key: string]: number };
  damage: number;
  range: number;
  fireRate: number;
  ammo: number;
  rank: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "CELESTIAL";
}

export interface CraftableArmor {
  id: string;
  name: string;
  desc: string;
  ability: string;
  color: string;
  creditCost: number;
  materialsCost: { [key: string]: number };
  powerLevel: number;
  rank: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "CELESTIAL";
}

export function getRankAndColor(index: number): { rank: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "CELESTIAL"; color: string } {
  if (index === 0) return { rank: "COMMON", color: "#94a3b8" };
  if (index <= 4) return { rank: "COMMON", color: "#94a3b8" };
  if (index <= 8) return { rank: "UNCOMMON", color: "#22c55e" };
  if (index <= 12) return { rank: "RARE", color: "#3b82f6" };
  if (index <= 16) return { rank: "EPIC", color: "#a855f7" };
  if (index <= 20) return { rank: "LEGENDARY", color: "#f97316" };
  if (index <= 23) return { rank: "MYTHIC", color: "#ef4444" };
  return { rank: "CELESTIAL", color: "#ec4899" };
}

export function getArmorRankAndColor(powerLevel: number): { rank: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "CELESTIAL"; color: string } {
  if (powerLevel <= 1) return { rank: "COMMON", color: "#94a3b8" };
  if (powerLevel <= 2) return { rank: "UNCOMMON", color: "#22c55e" };
  if (powerLevel <= 4) return { rank: "RARE", color: "#3b82f6" };
  if (powerLevel <= 6) return { rank: "EPIC", color: "#a855f7" };
  if (powerLevel <= 8) return { rank: "LEGENDARY", color: "#f97316" };
  return { rank: "MYTHIC", color: "#ef4444" };
}

export function getMaterialDetails(key: string): { desc: string; rarity: string; color: string } {
  switch (key) {
    case "nano_filament":
      return { desc: "Microscopic carbon-weaver cables with a tensile strength exceeding advanced steel. Used to reinforce weapon hilt frames and lightweight battle armors.", rarity: "COMMON", color: "#94a3b8" };
    case "titanium_alloy":
      return { desc: "Sub-zero forged grade-9 titanium alloyed with carbon micro-lattices. Extends outer chassis shielding and heavy blade reinforcement.", rarity: "COMMON", color: "#94a3b8" };
    case "carbon_nanotube":
      return { desc: "Cylindrical carbon allotropes providing supreme thermal conductivity and shock dampening for energy weapon barrels.", rarity: "UNCOMMON", color: "#22c55e" };
    case "graphene_plate":
      return { desc: "Two-dimensional atomic sheets stacked into ultra-hard plates. Deflects extreme energy discharge and high-velocity kinetic slugs.", rarity: "UNCOMMON", color: "#22c55e" };
    case "coolant_rod":
      return { desc: "Pressurized nitrogen-gel containment tubes preventing weapon hardware thermal throttling under continuous fire.", rarity: "RARE", color: "#3b82f6" };
    case "laser_emitter":
      return { desc: "Coherent wave-magnifying lens modules used in focused laser sights and focal projection points for swords.", rarity: "RARE", color: "#3b82f6" };
    case "quantum_battery":
      return { desc: "Sub-atomic particle battery looping magnetic fields to store high currents of power without thermal runaway.", rarity: "EPIC", color: "#a855f7" };
    case "unstable_plasma":
      return { desc: "Bottled superheated gas ions contained in electromagnetic stasis. Delivers devastating splash-combustion parameters.", rarity: "EPIC", color: "#a855f7" };
    case "vortex_core":
      return { desc: "A miniature gravitational vortex field emitter. Used to compress localized space anomalies and fire hyper-slugs.", rarity: "LEGENDARY", color: "#f97316" };
    case "rebel_nanite":
      return { desc: "Reprogrammed molecular-repair robots designed to slowly construct cybernetic circuits and repair worn battleplates.", rarity: "LEGENDARY", color: "#f97316" };
    case "cyber_neuro_mesh":
      return { desc: "Synthetic neural bundle that bridges flesh with silicon, enabling weapon targeting tracking directly synced to player thoughts.", rarity: "MYTHIC", color: "#ef4444" };
    case "plasma_core":
      return { desc: "Miniaturized nuclear fusion matrix emitting constant high-voltage ion discharges. Powers high-tier energy weaponry.", rarity: "MYTHIC", color: "#ef4444" };
    case "warp_crystal":
      return { desc: "Light-bending crystal structures mined from deep tectonic fault grids. Capable of slight retro-causal temporal shifts.", rarity: "CELESTIAL", color: "#ec4899" };
    case "dark_matter":
      return { desc: "Extremely dense, non-baryonic particulate matter that absorbs all electromagnetic radiation. Distorts surrounding light fields.", rarity: "CELESTIAL", color: "#ec4899" };
    case "antimatter_fuel":
      return { desc: "Highly regulated quantum containers housing positrons for maximum energy output systems.", rarity: "CELESTIAL", color: "#ec4899" };
    case "chrono_reagent":
      return { desc: "Crystallized quantum timelines harvested from temporal glitches. Used to weave permanent chrono stat-enchants.", rarity: "CELESTIAL", color: "#ec4899" };
    default:
      return { desc: "Extracted post-collapse tech debris salvaged from battle units.", rarity: "COMMON", color: "#94a3b8" };
  }
}

export function getWeaponDescription(name: string, category: string): string {
  const upper = name.toUpperCase();
  
  // Custom unique descriptions for all 75 weapons so none are identical.
  const customDescriptions: { [key: string]: string } = {
    // Melee (25)
    "ENERGY KATANA": "Flowing energy steel optimized for light, high-frequency kinetic slices and shield-piercing strikes.",
    "THERMAL COMBAT CLAW": "Superheated claws that melt flesh and composite armor on contact with hydraulic force boosters.",
    "MONO-MOLECULAR WHIP": "A whip made of a single-strand carbon chain that shears columns and cyborg hulls like paper.",
    "NEUTRON GREATSWORD": "A massive, heavy-impact sword powered by heavy isotopes, delivering catastrophic energy shocks.",
    "PLASMA DAGGER": "A stealth weapon with a superionic plasma edge designed for rapid under-armor lunges.",
    "APEX SLASHER": "Modified butcher blade outfitted with vibration nodes that vibrate 10,000 times per second.",
    "TITANIUM MACE": "Raw, heavy titanium hammer augmented with sub-surface kinetic cells to deliver skull-shattering concussions.",
    "QUANTUM BROADSWORD": "Weaves a field of probability waves around its edge, allowing it to bypass standard defensive shields entirely.",
    "VORTEX CLAYMORE": "Creates tiny centrifugal micro-singularities upon each heavy swing to pull targets closer.",
    "SHOCK BATON": "Standard-issue riot-control stun stick, heavily customized to discharge lightning arcs into combat units.",
    "REBEL MACHETE": "A rugged, carbon-reinforced clearing tool optimized by the resistance for close-quarters grid sabotage.",
    "DARK MATTER SICKLE": "Features a vacuum-forged sickle head that leaves a freezing trail of dead light behind it.",
    "AEGIS SHIELD-BLADE": "A hybrid weapon integrating high-frequency energy projection alongside a defensive deflection rig.",
    "NANO GUILLOTINE": "Staged nanite dispensers active along the edge, instantly dissolving target structural joints.",
    "CHRONO RAPIER": "Phases through time slightly, often striking enemies a fraction of a second before the physical lunge registers.",
    "VOID SCYTHE": "Harvested from deep space wreckage; drains target neural nets to convert energy directly to weapon output.",
    "GRAVITY HAMMER": "Emits local gravitational flux fields to multiply impact mass by a factor of fifty.",
    "SINGULARITY CLEAVER": "Forces sub-atomic compaction on strike, compressing matter until targeted circuits crack.",
    "CYBER ODACHI": "Extended long-curve blade crafted from synthetic high-carbon steel, granting unprecedented reach and arc.",
    "WARP SHIV": "Flickers in and out of local dimensional grids, allowing seamless stealth armor bypass on thrusts.",
    "SPECTRAL FALCHION": "Emits a high-frequency ghost blade silhouette, leaving multi-layered phase-delayed cuts.",
    "EMP WAR-STAFF": "resistance heavy rod with secondary discharge circuits designed to instantly lock cyborg joints.",
    "LASER GLAIVE": "Polearm with a sustained hard-light coherent beam emitter. Sweeps wide corridors with lethal laser arcs.",
    "SOLDER SABER": "A rare super-conductor blade that utilizes thermal kinetic energy to cauterize target repair nanites.",
    "PHOENIX FANG": "Weaves super-ionic flame loops that trigger localized thermal detonations inside metallic chassis.",

    // Primary (25)
    "SMART PISTOL": "Semi-automatic sidearm equipped with predictive micro-targeting logic that locks onto moving targets.",
    "PLASMA SHOTGUN": "Discharges unstable, superheated plasma balls in a wide, wall-pulverizing close-range combustion spread.",
    "COOLDOWN RAILGUN": "Standard-issue magnetic sniper rifle firing hyper-velocity depleted uranium pellets at extreme speed.",
    "TRIDENT BURST SMG": "Tri-barrel submachine gun delivering aggressive three-round burst vectors to maximize point-blank impact.",
    "VORTEX RIFLE": "Utilizes a miniature black-hole chamber to condense kinetic slugs into devastating gravity bullets.",
    "LASER CARBINE": "Sustained high-laser tracker firing continuous coherent energy beams for precise, consistent melting power.",
    "NEUTRON SWARMER": "Fires micro-guided energetic isotope capsules that seeking out and orbit hostiles before explosive collapse.",
    "VOLT AUTOMATION": "A self-adjusting heavy machine gun that steps up its cyclic rate of fire the longer you hold the trigger.",
    "PULSE BASTER": "A localized shockwave weapon emitting high-frequency compression waves that destabilizes synthetic skeletons.",
    "APEX DEVASTATOR": "A multi-slug heavy tactical assault cannon that leaves wide patterns of absolute structural destruction.",
    "DARK MATTER CANNON": "Projects dense non-baryonic plasma spheres that collapse upon impact to drag targets downward.",
    "HEAVY BOLTER": "Fires self-propelled, explosive rocket-propelled slugs that detonate deep inside enemy armored chassis.",
    "ACID SPITTER": "A highly corrosive pressurized bio-synthetic launcher that melts through titanium plates over time.",
    "REBEL MARKSMAN": "Precision long-rifle fitted with thermal imaging, calibrated for single-shot lethal weakpoint strikes.",
    "TESLA ARC RIFLE": "Generates a potential difference of ten million volts, bridging high-energy lightning bolts across enemies.",
    "CHRONO REPEATER": "Chambered to loop its firing cycle within a tiny time anomaly, essentially firing bullets on a past loop.",
    "FUSION INJECTOR": "Supercharges target cells with combustible fusion isotopes, causing a massive meltdown upon unit failure.",
    "SINGULARITY DRIVER": "Accelerates micro-singularities to orbital speeds, punching through consecutive targets in a straight path.",
    "QUANTUM SHREDDER": "Splits the projectile stream among adjacent parallel realities, dealing highly unpredictable and chaotic burst damage.",
    "MAGNETIC SLUGGER": "Fires raw industrial metal spikes using high-output capacitor banks, pinning targets to composite walls.",
    "SOLDER STORMER": "Industrial furnace converted into a weapon, spraying a torrent of super-heated metallic rivets.",
    "NOVA SPITTER": "Launches contained mini-stars that violently expand post-muzzle discharge, scorching entire combat lanes.",
    "TACTICAL NAILER": "Fires silent, compressed-air alloy nails designed to rupture critical internal hydraulic conduits.",
    "CYBER OVERLOAD CARBINE": "Artificially spikes surrounding radio interference to overload internal sensory processors with noise.",
    "PHOTON BEAM RIFLE": "Harnesses zero-point photon energy fields to output a blinding lane of pure laser annihilation.",

    // Secondary (25)
    "GRAV GRENADE": "Generates a temporary micro-gravity well on detonation, compressing hostiles and trapping them inside.",
    "NANO SEEKER BASTER": "Deployable seeker disk that glides across floors searching for and injecting neural scramblers.",
    "MICRO-STINGER REEFER": "A compact secondary device firing toxic needles designed to break down organic neural systems.",
    "SHOCKWAVE MINE": "Tactical proximity sensor releasing a heavy kinetic pulse, flinging nearby attackers backward.",
    "DECAY GRENADE": "Releases radioactive dust clouds that slowly eat away biological tissues and composite alloys alike.",
    "EMP DETONATOR": "Resistance cell trigger shutting down mechanical shields and locking down enemy cyber-implants.",
    "PLASMA CELL": "Volatile fuel block that can be manual detonated to release a sweeping ring of super-heated fission fire.",
    "COMBUSTION SIPHON": "Thermal siphon absorbing ambient heat to charge a powerful, high-temp flash ignition blast.",
    "TRACKER DART": "Tactical locator registering weak-points and amplifying player damage output against tagged targets.",
    "SLOW-MO BUBBLE": "Synthesizes local chrono field stagnation, reducing incoming tactical units to slow-motion speeds.",
    "FRAG POD": "High-fragmentation canister splitting into dozens of jagged steel shrapnel pellets on pressure trigger.",
    "THERMITE FLARE": "Releases a sustained stream of chemical fires burning at 4,000 degrees, melting floors and armor.",
    "TOXIC VIAL": "Shatters a pressurized biochemical cylinder, filling the area with an extremely lethal acidic vapor.",
    "ACID GRENADE": "A bio-weapon payload designed to liquefy high-defense plating and increase target damage vulnerability.",
    "NAPALM ROCKET": "Fires a sticky, phosphorous-loaded miniature rocket that bathes targeted landing grids in fire.",
    "LASER TRIPMINE": "Proximity hard-light beam laser sensor detonating whenever its path is broken by hostile movement.",
    "CRYO GRENADE": "Instantly drops local ambient temperature to absolute zero, solidifying gears and freezing joints solid.",
    "RADIATION CELL": "A leaking core cell that irradiates surrounding pathways, poisoning anything that steps into its light.",
    "STICKY DYNAMO": "Attaches a powerful magnetic clamp to targets, constantly discharging arcs of static disruptor currents.",
    "QUANTUM SPARKER": "Triggers a cascade of randomized micro-teleports on target, confusing targeting and tracking logic.",
    "MINI MISSILE": "Packs a compact computerized smart rocket tracking and locking onto the nearest enemy centroid.",
    "VORTEX POPPER": "Implodes with a silent vacuum wave, pulling armor panels apart and creating a small vacuum pocket.",
    "DECOY HOLOGRAM": "Generates a tactical phantom decoy projection that occupies hostile targeting scanners temporarily.",
    "SOLDER POPPER": "A simple pipe explosive filled with superheated copper slags, showering scrap metals in an arc.",
    "VOID DISCHARGER": "Releases a localized wave of cosmic zero-point radiation, neutralizing enemy energy projectiles."
  };

  return customDescriptions[upper] || `${category === "melee" ? "An elite melee strike arm" : "A primary tactical firearm"} crafted with high-density materials in the Rebel grid.`;
}

export const ALL_MATERIALS_KEYS = [
  "nano_filament",
  "titanium_alloy",
  "carbon_nanotube",
  "graphene_plate",
  "coolant_rod",
  "laser_emitter",
  "quantum_battery",
  "unstable_plasma",
  "vortex_core",
  "rebel_nanite",
  "cyber_neuro_mesh",
  "plasma_core",
  "warp_crystal",
  "dark_matter",
  "antimatter_fuel",
  "chrono_reagent"
];

export const MATERIAL_INFO: { [key: string]: { name: string; icon: string; color: string } } = {
  nano_filament: { name: "N-FILAMENT", icon: "🧬", color: "text-pink-400" },
  titanium_alloy: { name: "T-ALLOY", icon: "⚙️", color: "text-amber-400" },
  carbon_nanotube: { name: "C-NANOTUBE", icon: "🕸️", color: "text-[#38bdf8]" },
  graphene_plate: { name: "G-PLATE", icon: "⬜", color: "text-slate-300" },
  coolant_rod: { name: "COOLANT", icon: "🧪", color: "text-teal-400" },
  laser_emitter: { name: "LASER EMITTER", icon: "🔦", color: "text-red-400" },
  quantum_battery: { name: "Q-BATTERY", icon: "🔋", color: "text-emerald-400" },
  unstable_plasma: { name: "U-PLASMA", icon: "🔥", color: "text-orange-400" },
  vortex_core: { name: "VORTEX CORE", icon: "🌀", color: "text-indigo-400" },
  rebel_nanite: { name: "R-NANITES", icon: "🤖", color: "text-blue-400" },
  cyber_neuro_mesh: { name: "NEURO MESH", icon: "🧠", color: "text-fuchsia-400" },
  plasma_core: { name: "P-CORE", icon: "🔮", color: "text-violet-400" },
  warp_crystal: { name: "WARP GLASS", icon: "💎", color: "text-cyan-400" },
  dark_matter: { name: "DARK MATTER", icon: "🌌", color: "text-purple-600" },
  antimatter_fuel: { name: "ANTIMATTER", icon: "☢️", color: "text-lime-500" },
  chrono_reagent: { name: "CHRONO CODES", icon: "🔮", color: "text-indigo-400 font-extrabold animate-pulse" }
};

const MELEE_NAMES = [
  "Energy Katana", "Thermal Combat Claw", "Mono-Molecular Whip", "Neutron Greatsword",
  "Plasma Dagger", "Apex Slasher", "Titanium Mace", "Quantum Broadsword",
  "Vortex Claymore", "Shock Baton", "Rebel Machete", "Dark Matter Sickle",
  "Aegis Shield-Blade", "Nano Guillotine", "Chrono Rapier", "Void Scythe",
  "Gravity Hammer", "Singularity Cleaver", "Cyber Odachi", "Warp Shiv",
  "Spectral Falchion", "EMP War-Staff", "Laser Glaive", "Solder Saber",
  "Phoenix Fang"
];

const PRIMARY_NAMES = [
  "Smart Pistol", "Plasma Shotgun", "Cooldown Railgun", "Trident Burst SMG",
  "Vortex Rifle", "Laser Carbine", "Neutron Swarmer", "Volt Automaton",
  "Pulse Blaster", "Apex Devastator", "Dark Matter Cannon", "Heavy Bolter",
  "Acid Spitter", "Rebel Marksman", "Tesla Arc Rifle", "Chrono Repeater",
  "Fusion Injector", "Singularity Driver", "Quantum Shredder", "Magnetic Slugger",
  "Solder Stormer", "Nova Spitter", "Tactical Nailer", "Cyber Overload Carbine",
  "Photon Beam Rifle"
];

const SECONDARY_NAMES = [
  "Grav Grenade", "Nano Seeker Blaster", "Micro-Stinger Reefer", "Shockwave Mine",
  "Decay Grenade", "EMP Detonator", "Plasma Cell", "Combustion Siphon",
  "Tracker Dart", "Slow-Mo Bubble", "Frag Pod", "Thermite Flare",
  "Toxic Vial", "Acid Grenade", "Napalm Rocket", "Laser Tripmine",
  "Cryo Grenade", "Radiation Cell", "Sticky Dynamo", "Quantum Sparker",
  "Mini Missile", "Vortex Popper", "Decoy Hologram", "Solder Popper",
  "Void Discharger"
];

export const WEAPONS_CATALOG: CraftableWeapon[] = [];

// Generate 25 Melee
MELEE_NAMES.forEach((name, i) => {
  const mats: { [key: string]: number } = {};
  if (i > 0) {
    const primaryMat = ALL_MATERIALS_KEYS[Math.floor(i / 1.8) % ALL_MATERIALS_KEYS.length];
    const secondaryMat = ALL_MATERIALS_KEYS[Math.floor(i / 3) % ALL_MATERIALS_KEYS.length];
    mats[primaryMat] = 2 + Math.floor(i / 2);
    if (primaryMat !== secondaryMat) {
      mats[secondaryMat] = 1 + Math.floor(i / 4);
    }
  }
  const { rank, color } = getRankAndColor(i);
  WEAPONS_CATALOG.push({
    id: i === 0 ? "katana" : name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    name: name.toUpperCase(),
    category: "melee",
    type: "katana",
    desc: getWeaponDescription(name, "melee"),
    color,
    creditCost: i === 0 ? 0 : 50 + i * 40,
    materialsCost: mats,
    damage: i === 0 ? 45 : 30 + i * 6,
    range: i === 0 ? 75 : 65 + i * 3,
    fireRate: i === 0 ? 250 : Math.max(100, 350 - i * 8),
    ammo: 999,
    rank
  });
});

// Generate 25 Primary
PRIMARY_NAMES.forEach((name, i) => {
  const mats: { [key: string]: number } = {};
  if (i > 0) {
    const primaryMat = ALL_MATERIALS_KEYS[Math.floor(i / 1.8) % ALL_MATERIALS_KEYS.length];
    const secondaryMat = ALL_MATERIALS_KEYS[Math.floor(i / 3) % ALL_MATERIALS_KEYS.length];
    mats[primaryMat] = 2 + Math.floor(i / 2);
    if (primaryMat !== secondaryMat) {
      mats[secondaryMat] = 1 + Math.floor(i / 4);
    }
  }
  const subType = i === 0 ? "pistol" : (i % 3 === 0 ? "shotgun" : i % 3 === 1 ? "railgun" : "pistol");
  const { rank, color } = getRankAndColor(i);
  WEAPONS_CATALOG.push({
    id: i === 0 ? "pistol" : name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    name: name.toUpperCase(),
    category: "primary",
    type: subType,
    desc: getWeaponDescription(name, "primary"),
    color,
    creditCost: i === 0 ? 0 : 60 + i * 45,
    materialsCost: mats,
    damage: i === 0 ? 12 : (subType === "shotgun" ? 5 + i * 2 : subType === "railgun" ? 50 + i * 6 : 10 + i * 3),
    range: i === 0 ? 350 : (subType === "shotgun" ? 180 + i * 3 : subType === "railgun" ? 400 + i * 10 : 300 + i * 5),
    fireRate: i === 0 ? 150 : (subType === "shotgun" ? Math.max(300, 650 - i * 15) : subType === "railgun" ? Math.max(500, 1200 - i * 25) : Math.max(70, 180 - i * 4)),
    ammo: i === 0 ? 120 : (subType === "shotgun" ? 20 + i * 2 : subType === "railgun" ? 6 + Math.floor(i / i) : 80 + i * 12),
    rank
  });
});

// Generate 25 Secondary
SECONDARY_NAMES.forEach((name, i) => {
  const mats: { [key: string]: number } = {};
  if (i > 0) {
    const primaryMat = ALL_MATERIALS_KEYS[Math.floor(i / 1.8) % ALL_MATERIALS_KEYS.length];
    const secondaryMat = ALL_MATERIALS_KEYS[Math.floor(i / 3) % ALL_MATERIALS_KEYS.length];
    mats[primaryMat] = 2 + Math.floor(i / i) * 2;
    if (primaryMat !== secondaryMat) {
      mats[secondaryMat] = 1 + Math.floor(i / 4);
    }
  }
  const subType = i % 3 === 0 ? "gravity" : "pistol";
  const { rank, color } = getRankAndColor(i);
  WEAPONS_CATALOG.push({
    id: name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    name: name.toUpperCase(),
    category: "secondary",
    type: subType,
    desc: getWeaponDescription(name, "secondary"),
    color,
    creditCost: 40 + i * 35,
    materialsCost: mats,
    damage: 15 + i * 5,
    range: 200 + i * 10,
    fireRate: Math.max(200, 1000 - i * 24),
    ammo: subType === "gravity" ? 4 + Math.floor(i / i) * 2 : 30 + i * 4,
    rank
  });
});

const RAW_ARMORS: Omit<CraftableArmor, "rank">[] = [
  {
    id: "none",
    name: "STANDARD REBEL PLASMA SKIN",
    desc: "The basic-issue lightweight kinetic submesh. Worn by sector scouts in low-combat grids.",
    ability: "Standard operations. Baseline status defense.",
    color: "#94a3b8",
    creditCost: 0,
    materialsCost: {},
    powerLevel: 1
  },
  {
    id: "dragon_set",
    name: "IGNIS DRAGON SPLICER SET",
    desc: "A carbon-alloy flame forged plate radiating constant thermal output. Evolves sweeping plasma thruster wings during fights.",
    ability: "+50% resistance to explosion and impact damage. Heavy bullet waves trigger brief flame streams.",
    color: "#ef4444",
    creditCost: 200,
    materialsCost: { nano_filament: 10, titanium_alloy: 6, unstable_plasma: 3 },
    powerLevel: 2
  },
  {
    id: "shadow_set",
    name: "VOID SHADOW STEALTH SUIT",
    desc: "Formulated from dark energy threads. Generates a quiet, dark pixel smoke trail distracting enemy aim matrices.",
    ability: "+25 Shield Capacity, +20% run dodge chances, leaves spatial decoy shades behind on slide.",
    color: "#312e81",
    creditCost: 250,
    materialsCost: { carbon_nanotube: 8, dark_matter: 3, cyber_neuro_mesh: 1 },
    powerLevel: 3
  },
  {
    id: "crystal_set",
    name: "REFRACTIVE CRYSTAL MATRIX",
    desc: "Plated from polarized glass cores. Visually spikes glowing neon prism filaments as the shield cell recharges.",
    ability: "+35 Shield Capacity. Automatically triggers a screenflash slowing field when structural integrity cracks.",
    color: "#06b6d4",
    creditCost: 320,
    materialsCost: { graphene_plate: 10, warp_crystal: 4, coolant_rod: 2 },
    powerLevel: 4
  },
  {
    id: "berserker_set",
    name: "RED BERSERKER SPLICER HARNESS",
    desc: "No safety limits on neural overdrive cords. Evolves a bright blood-red particle ring as your hull health diminishes.",
    ability: "Chassis damage outputs rise up to +100% proportionally to lost structural health.",
    color: "#b91c1c",
    creditCost: 400,
    materialsCost: { coolant_rod: 12, unstable_plasma: 6, rebel_nanite: 2 },
    powerLevel: 5
  },
  {
    id: "celestial_set",
    name: "ASTRA CELESTIAL OVER-VEST",
    desc: "Crafted inside high-atmosphere orbital labs. Launches orbiting star-specks rotating in rings about the player.",
    ability: "+50 Max HP. Orbital orbs emit smart flare bolts firing at hostiles for 25 damage.",
    color: "#f59e0b",
    creditCost: 520,
    materialsCost: { quantum_battery: 15, vortex_core: 4, warp_crystal: 5 },
    powerLevel: 6
  },
  {
    id: "void_set",
    name: "EVENT HORIZON VOID CARAPACE",
    desc: "A heavy gravity-insulated container. Visually distorts spatial coordinates with beautiful purple vortex ring anomalies.",
    ability: "Gives a permanent passive slow-motion speed amplification and adds shield recharging bonuses.",
    color: "#7c3aed",
    creditCost: 650,
    materialsCost: { vortex_core: 12, dark_matter: 6, antimatter_fuel: 2 },
    powerLevel: 7
  },
  {
    id: "storm_set",
    name: "ZEUS STORM SUPREME COILS",
    desc: "Tesla conduits linked with core cooling ducts. Crackles electric voltage bolts around your visual frame.",
    ability: "+40 Max Shield capacity. Chain lightning shockwaves deploy automatically frying enemies (35 damage every 8 seconds).",
    color: "#3b82f6",
    creditCost: 780,
    materialsCost: { quantum_battery: 18, laser_emitter: 10, antimatter_fuel: 4 },
    powerLevel: 8
  },
  {
    id: "titan_set",
    name: "GOLIATH TITAN EXOSKELETON",
    desc: "Hydra-dense mechanical plates. Deploys a transparent glowing dome-shield reinforcing absolute armor defense.",
    ability: "+100 Max HP. Gives total knockback immunity and flat -15% reduction to bullet damage.",
    color: "#475569",
    creditCost: 950,
    materialsCost: { graphene_plate: 25, titanium_alloy: 20, plasma_core: 6 },
    powerLevel: 9
  }
];

export const ARMORS_CATALOG: CraftableArmor[] = RAW_ARMORS.map(a => {
  const { rank, color } = getArmorRankAndColor(a.powerLevel);
  return {
    ...a,
    rank,
    color
  };
});

