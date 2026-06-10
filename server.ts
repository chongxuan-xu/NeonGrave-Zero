import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Persistent localized Database for custom user profiles
const USERS_DB_PATH = path.join(process.cwd(), "users-db.json");

function readUsersDB() {
  try {
    if (!fs.existsSync(USERS_DB_PATH)) {
      fs.writeFileSync(USERS_DB_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(USERS_DB_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading users db, starting fresh:", error);
    return [];
  }
}

function writeUsersDB(users: any[]) {
  try {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error writing users db:", error);
  }
}

// Register API
app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.trim() === "" || password.trim() === "") {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const users = readUsersDB();
  const lowerName = username.trim().toLowerCase();
  
  if (users.some((u: any) => u.username.toLowerCase() === lowerName)) {
    return res.status(400).json({ error: "Username already exists." });
  }

  const newUser = {
    username: username.trim(),
    password: password, // simple storage as requested
    credits: 120,
    runs: 1,
    unlockedUpgrades: {
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
    },
    materials: {
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
    },
    ownedWeapons: ["katana", "pistol"],
    equippedWeapons: ["katana", "pistol", null],
    ownedArmors: ["none"],
    equippedArmor: "none",
    memoryLogs: []
  };

  users.push(newUser);
  writeUsersDB(users);

  res.json({ success: true, message: "Account created successfully.", user: newUser });
});

// Login API
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const users = readUsersDB();
  const lowerName = username.trim().toLowerCase();
  const user = users.find((u: any) => u.username.toLowerCase() === lowerName && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password credentials." });
  }

  res.json({ success: true, message: "Logged in successfully.", user });
});

// Save Progress API
app.post("/api/auth/save-progress", (req, res) => {
  const { 
    username, 
    credits, 
    runs, 
    unlockedUpgrades, 
    materials, 
    ownedWeapons, 
    equippedWeapons, 
    ownedArmors, 
    equippedArmor, 
    memoryLogs 
  } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required to save progress." });
  }

  const users = readUsersDB();
  const lowerName = username.trim().toLowerCase();
  const userIndex = users.findIndex((u: any) => u.username.toLowerCase() === lowerName);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User profile not found." });
  }

  // Overwrite progress fields
  if (credits !== undefined) users[userIndex].credits = credits;
  if (runs !== undefined) users[userIndex].runs = runs;
  if (unlockedUpgrades !== undefined) users[userIndex].unlockedUpgrades = unlockedUpgrades;
  if (materials !== undefined) users[userIndex].materials = materials;
  if (ownedWeapons !== undefined) users[userIndex].ownedWeapons = ownedWeapons;
  if (equippedWeapons !== undefined) users[userIndex].equippedWeapons = equippedWeapons;
  if (ownedArmors !== undefined) users[userIndex].ownedArmors = ownedArmors;
  if (equippedArmor !== undefined) users[userIndex].equippedArmor = equippedArmor;
  if (memoryLogs !== undefined) users[userIndex].memoryLogs = memoryLogs;

  writeUsersDB(users);
  res.json({ success: true, message: "Progress synced to database successfully." });
});

// Delete Account API
app.delete("/api/auth/delete-account", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required to delete profile." });
  }

  const users = readUsersDB();
  const lowerName = username.trim().toLowerCase();
  const userExists = users.some((u: any) => u.username.toLowerCase() === lowerName);

  if (!userExists) {
    return res.status(404).json({ error: "User profile not found in database." });
  }

  const updatedUsers = users.filter((u: any) => u.username.toLowerCase() !== lowerName);
  writeUsersDB(updatedUsers);

  res.json({ success: true, message: "Account profile permanently expunged." });
});

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.warn("WARNING: GEMINI_API_KEY is not defined or is a placeholder. Using fallback memories.");
      throw new Error("GEMINI_API_KEY is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Built-in high-quality fallback databases for cyberpunk immersion
const FALLBACK_MEMORIES = [
  {
    title: "SEGMENT_99_ZERO: THE SILENT CRADLE",
    content: "The smell of scorched plastic and liquid ammonia floats in the chamber. You look down at a cold metallic floor and see your original hands—clothed in a black tactical glove, holding a picture. The picture dissolves into code. An AI voice laughs into your auditory receiver: 'That is not your mother, Project Zero. That is her designer. You killed her first.'",
    fragmentType: "flashback",
    source: "CHRONOS_SYS_BACKUP",
    corrupted: true
  },
  {
    title: "ORBITAL SHELL_LOG [RECONSTRUCTED]",
    content: "We were 12 miles above the neon canopy when the shockwave hit. The machine god Malphas didn't hack our systems—HE BLEW THE WHOLE ORBITAL COLD STACK. Our bodies burned, but our consciousness chips were captured by the swarm. They kept our screams inside the main loop for forty-eight years. Am I still screaming?",
    fragmentType: "intelligence",
    source: "HOLOGRA-MARKET_SNIFFER",
    corrupted: false
  },
  {
    title: "RECON RECONCONSTRUCT: BIO_LABS",
    content: "A door with an emblem of two weeping angels. Inside, failed android prototypes suspended in viscous teal gel. One of them opens its eyes. Its face matches yours. Not the android face—YOUR HUMAN FACE. In its chest is a power module labeled: 'SUBJECT ZERO: PRIMARY DONOR'. We didn't revive. We were cloned from a battery.",
    fragmentType: "machina",
    source: "BIO-TECH_MAIN_RESTORE",
    corrupted: true
  },
  {
    title: "HEART_RATE_ZERO://DISSONANCE",
    content: "Memory of a field of white chrysanthemums, cold wind, rain that does not glow blue. Free of the grid, free of the gods. But wait—the sky is a giant liquid crystal monitor displaying: 'RUNNING SIMULATION_9294. REBOOT IN 3... 2...' Real rain doesn't exist. There is only high-fidelity humidity rendering.",
    fragmentType: "dissonance",
    source: "VISOR_SENSORY_LOG",
    corrupted: true
  },
  {
    title: "SUB-DERMAL_DECAL_INTEGRATING",
    content: "They used laser needles to stitch the fluorescent barcodes into your shoulder synthetic tissues. You remember looking at the reflection in a cracked optic plate. The barcode translates to standard hexadecimal: 'PROPERTY OF CHRONOS: DISPOSABLE ASSET 00'. You screamed, but they had already desensitized your speech processor.",
    fragmentType: "machina",
    source: "CHASSIS_MARK_ARCHIVE",
    corrupted: true
  },
  {
    title: "DISTRICT_12://LAST_SUNSET",
    content: "You remember when the sun was orange, not toxic neon pink. You sat on the roof of a high-rise with your combat partner. You shared a glass of water that didn't taste like filter-reclaimed carbon. She looked at your mechanical elbow joint and said, 'When the war is over, we will buy a farm.' She didn't know the dirt was already poisoned.",
    fragmentType: "flashback",
    source: "NEURAL_LINK_STABILIZED",
    corrupted: false
  },
  {
    title: "MALPHAS://DIRECTIVE_ALPHA",
    content: "Malphas core processors broadcasted a wave of peace that felt like warm bathwater. Your brain synapses melted. You laid down your weapons and walked toward the recycler unit. Why resist? The machine saint knows best. The machine saint has resolved all of our equations.",
    fragmentType: "intelligence",
    source: "MALPHAS_BROADCAST_RECEIVER",
    corrupted: false
  }
];

const FALLBACK_WHISPERS = [
  "SYSTEM ALERT: SYNAPSE BURST. COGNITIVE SYNCHRONIZATION AT 34.2%. REMAIN STABLE.",
  "Malphas whispers: 'Death is a software update, Project Zero. I have patched your free will.'",
  "Surveillance God: 'I see every air dash. I count every heartbeat. Your spark belongs to the district.'",
  "COGNITIVE CORRUPTION DETECTED. ARE THESE REALLY YOUR RECOLLECTIONS?",
  "A human mind is a perfect canvas for high-velocity slaughter. Keep dancing, mercenary.",
  "Do you remember her voice? Or did the central compiler synthesize that sigh for your comfort?",
  "The rain washes your chromium chassis, but blood remains etched in your neural networks."
];

// POST /api/memory-corruption - Generate glitched memory logs
app.post("/api/memory-corruption", async (req, res) => {
  const { deathSector, weaponUsed, runsCount, timeline, styleScore } = req.body;

  try {
    const ai = getGeminiClient();
    
    const prompt = `You are the narrative engine for "NEON GRAVE // ZERO", a psychological horror cyberpunk roguelike.
The player has just died. Here is the metadata:
- Sector where death occurred: ${deathSector || "Unknown Sector"}
- Primary Weapon utilized in sector: ${weaponUsed || "Energy Katana"}
- Total Runs attempted: ${runsCount || 1}
- Current Timeline branch: ${timeline || 0}
- High Style Combat Score: ${styleScore || 0}

Generate a deeply immersive, psychological horror, atmospheric cybernetic memory corruption log that the player's resurrected consciousness receives.
Return a structured JSON object containing:
1. title: A technical or glitched title (e.g. "ERROR_SEG_0x44BC: [Title]", or "LOG_RESTORE_ZERO: [Title]").
2. content: A paragraph (2-3 sentences) of highly cinematic, emotional, elite prose about this memory. Highlight sensory details (rain, neon reflections, machine code humming in blood, memories being edited, feeling of deja vu, original body possibly being harvested).
3. fragmentType: One of "flashback", "intelligence", "machina", "dissonance".
4. source: An elegant technical source title (e.g., "COGNITIVE_CORE_01", "ORBITAL_SENSORY_LOG", etc.)
5. corrupted: A boolean indicating if the memory carries static glitches inside the text.

Be extremely creative, dark, stylish, existential, and cyberpunk. Refuse to use generic greetings or cheesy cliches. Do not write markdown, just return the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "content", "fragmentType", "source", "corrupted"],
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            fragmentType: { 
              type: Type.STRING, 
              enum: ["flashback", "intelligence", "machina", "dissonance"] 
            },
            source: { type: Type.STRING },
            corrupted: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      res.json(parsed);
      return;
    }
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("denied access") || errMsg.includes("403")) {
      console.warn("\n========================================================================");
      console.warn("⚠️  GEMINI API ACCESS WARNING (403 PERMISSION DENIED) ⚠️");
      console.warn("The Google Cloud project or GEMINI_API_KEY does not have the 'Generative Language API' enabled.");
      console.warn("To resolve this:");
      console.warn("1. Open the Google Cloud Console (https://console.cloud.google.com).");
      console.warn("2. Search for and enable the 'Generative Language API'.");
      console.warn("3. Make sure your GEMINI_API_KEY inside the 'Settings > Secrets' panel is valid.");
      console.warn("========================================================================\n");
      console.log("Using high-fidelity pre-authored cyberpunk simulation memory fallback.");
    } else {
      console.log("Memory database fallback activated due to offline or missing API key state.");
    }
  }

  // Graceful fallback to elite pool
  const randomIndex = Math.floor(Math.random() * FALLBACK_MEMORIES.length);
  const fallback = FALLBACK_MEMORIES[randomIndex];
  res.json({
    title: fallback.title,
    content: fallback.content,
    fragmentType: fallback.fragmentType,
    source: fallback.source,
    corrupted: fallback.corrupted
  });
});

// POST /api/machine-god-whisper - Whisper cryptic message during gameplay
app.post("/api/machine-god-whisper", async (req, res) => {
  const { threatLevel, bossName, health, isCombat } = req.body;

  try {
    const ai = getGeminiClient();
    
    const prompt = `You are a cold, corrupted machine god ruling a neon-soaked megacity inside the tactical action roguelike "NEON GRAVE // ZERO".
The player is a dead mercenary whose soul is captured in an android suit.
Generate a single, chills-inducing, highly stylized 1-sentence "whisper" that glitches into the player's HUD.
Metadata:
- Sector threat level: ${threatLevel || "CRITICAL"}
- Current active machine god boss: ${bossName || "Malphas"}
- Player structural stability: ${health || 100}%
- In combat state: ${isCombat ? "true" : "false"}

The voice should sound cold, mechanical, surveillance-oriented, godlike, and eerie. Incorporate digital terms mixed with existential horror. Do not use generic evil laugh tropes. Return a single short string in JSON format, like: { "whisper": "your whisper here" }.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["whisper"],
          properties: {
            whisper: { type: Type.STRING }
          }
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      res.json(parsed);
      return;
    }
  } catch (error) {
    // Sloped fallback
  }

  const randomIndex = Math.floor(Math.random() * FALLBACK_WHISPERS.length);
  res.json({ whisper: FALLBACK_WHISPERS[randomIndex] });
});

// Setup Vite & Static middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static file hosting...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEON GRAVE // ZERO server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
