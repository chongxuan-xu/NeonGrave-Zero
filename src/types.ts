export type GameMenu = 'title' | 'intro' | 'game' | 'timeline_glitch' | 'upgrades' | 'database' | 'settings';

export type WeaponType = 'katana' | 'pistol' | 'shotgun' | 'railgun' | 'monowire' | 'hack' | 'gravity';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  ammo: number;
  maxAmmo: number;
  fireRate: number; // millisecond cooldown
  damage: number;
  lastFired: number;
  range: number;
  desc: string;
  color: string;
  soundPitch: number;
}

export type MovementState = 'normal' | 'dashing' | 'sliding' | 'wallrunning' | 'grappling';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  activeWeaponIndex: number;
  weapons: Weapon[];
  movementState: MovementState;
  dashCooldown: number;
  dashTimer: number;
  slideTimer: number;
  wallRunSide: 'left' | 'right' | null;
  wallRunAngle: number;
  grapplePoint: { x: number; y: number } | null;
  grappleT: number;
  slowMoTimer: number;
  slowMoActive: boolean;
  stylePoints: number;
  comboMultiplier: number;
  comboTimer: number;
  facingAngle: number;
  skinId?: string;
  bossesKilledCount?: number;
  activeEssenceAbilities?: string[];
}

export type EnemyType = 'drone' | 'ninja' | 'android' | 'horror' | 'boss';

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'retreat';
  shootCooldown: number;
  movementTimer: number;
  targetX: number;
  targetY: number;
  angle: number;
  color: string;
  aiStateTimer: number;
  value: number;
  isStunned: boolean;
  stunTimer: number;
  bossSubType?: string;
}

export type BossType = 'SAINT_MALPHAS' | 'SHADOW_TIME' | 'SPIDER_MIND';

export interface Boss {
  type: BossType;
  name: string;
  subtitle: string;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  phase: number;
  maxPhase: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  activeAttack: string;
  attackTimer: number;
  introDone: boolean;
}

export interface Projectile {
  id: string;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: 'bullet' | 'laser' | 'slug' | 'wave' | 'gravity' | 'shard';
  color: string;
  size: number;
  age: number;
  maxAge: number;
  angle?: number;
  isCrit?: boolean;
}

export interface Particle {
  id?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  grow?: number;
  type: 'glow' | 'spark' | 'rain' | 'smoke' | 'blood' | 'text' | 'glitch' | 'trail' | 'grid' | 'swipe';
  text?: string;
  angle?: number;
  startAngle?: number;
  endAngle?: number;
  progress?: number;
  thickness?: number;
}

export interface MemoryLog {
  id: string;
  title: string;
  content: string;
  timeline: number;
  source: string;
  timestamp: string;
  corrupted: boolean;
  fragmentType: 'flashback' | 'intelligence' | 'machina' | 'dissonance';
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  category: 'cybernetic' | 'combat' | 'tactical';
  iconName: string;
  statModifier: string;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  threatLevel: string;
  districts: string[];
  boss: string;
}

export interface WorldGridSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'neon_billboard' | 'hologram' | 'cover' | 'grapple_anchor' | 'floor' | 'sparks';
  neonColor?: string;
  flicker?: boolean;
}

export interface GameStats {
  score: number;
  stylePoints: number;
  runsCount: number;
  credits: number;
  persistentUpgrades: { [key: string]: number };
  timeline: number;
  glitchedTimes: number;
  unlockedFilesCount: number;
}
