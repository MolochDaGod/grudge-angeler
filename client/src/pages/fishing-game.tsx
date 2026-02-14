import { useRef, useEffect, useState, useCallback } from "react";
const beachCrabSheetUrl = "/assets/beach_crabs.png";
const BGM_URL = "/assets/bgm.mp3";

const SCALE = 4;
const FRAME_H = 48;

const ROPE_SEGMENTS = 12;
const ROPE_SEG_LEN = 15;

const PLANT_TYPES = [
  { sx: 0, sy: 0, sw: 170, sh: 340 },
  { sx: 170, sy: 0, sw: 170, sh: 340 },
  { sx: 340, sy: 0, sw: 170, sh: 340 },
  { sx: 510, sy: 0, sw: 170, sh: 340 },
  { sx: 0, sy: 340, sw: 170, sh: 220 },
  { sx: 170, sy: 340, sw: 170, sh: 220 },
  { sx: 340, sy: 340, sw: 170, sh: 220 },
  { sx: 510, sy: 340, sw: 170, sh: 220 },
  { sx: 0, sy: 560, sw: 340, sh: 300 },
  { sx: 340, sy: 560, sw: 340, sh: 300 },
];

interface UnderwaterPlant {
  typeIdx: number;
  worldX: number;
  baseY: number;
  scale: number;
  phase: number;
  swaySpeed: number;
  swayAmp: number;
  inFront: boolean;
}

function generateUnderwaterPlants(W: number, H: number, waterY: number, dockX: number): UnderwaterPlant[] {
  const plants: UnderwaterPlant[] = [];
  const worldLeft = -(W * 3) - 200;
  const worldRight = W * 5 + 200;
  const dockExcludeLeft = dockX - 100;
  const dockExcludeRight = W * 2.8 + 50;
  const fishermanHeight = 48 * 4;
  const minPlantY = waterY + fishermanHeight;
  const maxPlantY = H - 10;
  const plantCount = 80;
  for (let i = 0; i < plantCount; i++) {
    const worldX = worldLeft + Math.random() * (worldRight - worldLeft);
    if (worldX > dockExcludeLeft && worldX < dockExcludeRight) {
      continue;
    }
    const scale = 1 + Math.random() * 29;
    const baseY = minPlantY + Math.random() * (maxPlantY - minPlantY);
    plants.push({
      typeIdx: Math.floor(Math.random() * PLANT_TYPES.length),
      worldX,
      baseY,
      scale: scale * 0.08,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 0.003 + Math.random() * 0.004,
      swayAmp: 3 + Math.random() * 8,
      inFront: Math.random() < 0.35,
    });
  }
  return plants;
}

function initRopeSegments(startX: number, startY: number, targetX: number, targetY: number) {
  const segs = [];
  for (let i = 0; i < ROPE_SEGMENTS; i++) {
    const t = i / (ROPE_SEGMENTS - 1);
    segs.push({ x: startX + (targetX - startX) * t, y: startY + (targetY - startY) * t, ox: startX + (targetX - startX) * t, oy: startY + (targetY - startY) * t });
  }
  return segs;
}

interface FishType {
  name: string;
  catchAsset: string;
  catchW: number;
  catchH: number;
  creatureFolder: string;
  idleFrames: number;
  walkFrames: number;
  points: number;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "ultra_rare";
  weight: number;
  minDepth: number;
  speed: number;
  description: string;
  tint?: string;
  baseScale?: number;
  spriteSheet?: string;
  spriteRow?: number;
  spriteFrameSize?: number;
  beachCrab?: boolean;
}

const FISH_TYPES: FishType[] = [
  { name: "Minnow", catchAsset: "/assets/catch/1.png", catchW: 24, catchH: 6, creatureFolder: "1", idleFrames: 4, walkFrames: 4, points: 10, rarity: "common", weight: 40, minDepth: 0.15, speed: 1.5, description: "A tiny silver fish, common in shallow waters." },
  { name: "Perch", catchAsset: "/assets/catch/2.png", catchW: 32, catchH: 12, creatureFolder: "2", idleFrames: 4, walkFrames: 6, points: 25, rarity: "common", weight: 30, minDepth: 0.25, speed: 1.2, description: "A striped freshwater fish with sharp fins." },
  { name: "Bass", catchAsset: "/assets/catch/3.png", catchW: 40, catchH: 12, creatureFolder: "3", idleFrames: 4, walkFrames: 4, points: 50, rarity: "uncommon", weight: 15, minDepth: 0.35, speed: 1.0, description: "A strong fighter popular with anglers." },
  { name: "Catfish", catchAsset: "/assets/catch/4.png", catchW: 52, catchH: 12, creatureFolder: "4", idleFrames: 4, walkFrames: 4, points: 75, rarity: "uncommon", weight: 8, minDepth: 0.45, speed: 0.8, description: "A bottom-dweller with long whiskers." },
  { name: "Swordfish", catchAsset: "/assets/catch/5.png", catchW: 56, catchH: 24, creatureFolder: "5", idleFrames: 4, walkFrames: 6, points: 150, rarity: "rare", weight: 4, minDepth: 0.55, speed: 1.8, description: "A powerful ocean predator with a sharp bill." },
  { name: "Whale", catchAsset: "/assets/catch/6.png", catchW: 108, catchH: 22, creatureFolder: "6", idleFrames: 6, walkFrames: 6, points: 300, rarity: "legendary", weight: 1, minDepth: 0.65, speed: 0.5, description: "The king of the deep. Incredibly rare!" },
  { name: "Eel", catchAsset: "/assets/catch/7.png", catchW: 60, catchH: 12, creatureFolder: "4", idleFrames: 4, walkFrames: 4, points: 40, rarity: "common", weight: 20, minDepth: 0.3, speed: 1.3, description: "A slippery serpentine fish." },
  { name: "Salmon", catchAsset: "/assets/catch/8.png", catchW: 60, catchH: 12, creatureFolder: "5", idleFrames: 4, walkFrames: 6, points: 60, rarity: "uncommon", weight: 12, minDepth: 0.35, speed: 1.1, description: "A prized pink-fleshed fish." },
  { name: "Phantom Minnow", catchAsset: "/assets/catch/1.png", catchW: 24, catchH: 6, creatureFolder: "1", idleFrames: 4, walkFrames: 4, points: 500, rarity: "ultra_rare", weight: 0.3, minDepth: 0.55, speed: 2.2, description: "A ghostly minnow wreathed in spectral flame. Blinks in and out of reality.", tint: "rgba(0,255,200,0.35)", baseScale: 1.8 },
  { name: "Volcanic Perch", catchAsset: "/assets/catch/2.png", catchW: 32, catchH: 12, creatureFolder: "2", idleFrames: 4, walkFrames: 6, points: 600, rarity: "ultra_rare", weight: 0.25, minDepth: 0.6, speed: 1.6, description: "A perch superheated by deep-sea vents. Its scales glow molten orange.", tint: "rgba(255,80,0,0.4)", baseScale: 2.0 },
  { name: "Abyssal Bass", catchAsset: "/assets/catch/3.png", catchW: 40, catchH: 12, creatureFolder: "3", idleFrames: 4, walkFrames: 4, points: 750, rarity: "ultra_rare", weight: 0.2, minDepth: 0.65, speed: 1.4, description: "A colossal bass from the deepest trenches. Radiates dark energy.", tint: "rgba(120,0,255,0.35)", baseScale: 2.2 },
  { name: "Frost Catfish", catchAsset: "/assets/catch/4.png", catchW: 52, catchH: 12, creatureFolder: "4", idleFrames: 4, walkFrames: 4, points: 800, rarity: "ultra_rare", weight: 0.18, minDepth: 0.6, speed: 0.9, description: "An ancient catfish encased in living ice. Freezes the water around it.", tint: "rgba(100,200,255,0.4)", baseScale: 2.3 },
  { name: "Storm Swordfish", catchAsset: "/assets/catch/5.png", catchW: 56, catchH: 24, creatureFolder: "5", idleFrames: 4, walkFrames: 6, points: 1000, rarity: "ultra_rare", weight: 0.12, minDepth: 0.7, speed: 2.5, description: "A swordfish that rides lightning bolts. Crackles with electric fury.", tint: "rgba(255,255,0,0.35)", baseScale: 2.0 },
  { name: "Celestial Whale", catchAsset: "/assets/catch/6.png", catchW: 108, catchH: 22, creatureFolder: "6", idleFrames: 6, walkFrames: 6, points: 2000, rarity: "ultra_rare", weight: 0.05, minDepth: 0.75, speed: 0.4, description: "A cosmic whale that swallowed a dying star. The rarest creature in existence.", tint: "rgba(255,180,255,0.3)", baseScale: 1.5 },
  { name: "Neon Eel", catchAsset: "/assets/catch/7.png", catchW: 60, catchH: 12, creatureFolder: "4", idleFrames: 4, walkFrames: 4, points: 650, rarity: "ultra_rare", weight: 0.22, minDepth: 0.55, speed: 1.9, description: "A bioluminescent eel pulsing with neon colors. Mesmerizing.", tint: "rgba(0,255,100,0.4)", baseScale: 2.0 },
  { name: "Golden Salmon", catchAsset: "/assets/catch/8.png", catchW: 60, catchH: 12, creatureFolder: "5", idleFrames: 4, walkFrames: 6, points: 700, rarity: "ultra_rare", weight: 0.2, minDepth: 0.6, speed: 1.5, description: "A legendary salmon with solid gold scales. Worth a fortune.", tint: "rgba(255,200,0,0.45)", baseScale: 2.1 },
  { name: "Shadow Leviathan", catchAsset: "/assets/catch/6.png", catchW: 108, catchH: 22, creatureFolder: "6", idleFrames: 6, walkFrames: 6, points: 1500, rarity: "ultra_rare", weight: 0.08, minDepth: 0.8, speed: 0.6, description: "A titanic shadow beast from beyond the abyss. Feared by all ocean life.", tint: "rgba(180,0,50,0.35)", baseScale: 1.8 },
];

const BETA_EGG_MAX_STOCK = 50;
const WARLORD_EGG_MAX_STOCK = 50;
const BETAXGRUDA_EGGS = [
  { name: "Crimson BetaXGruda Egg", img: "/assets/eggs/egg_red.png", type: "beta", description: "Contains a crimson beta fish character. Hatches with fire affinity.", cost: 1, maxStock: BETA_EGG_MAX_STOCK },
  { name: "Emerald BetaXGruda Egg", img: "/assets/eggs/egg_green.png", type: "beta", description: "Contains an emerald beta fish character. Hatches with nature affinity.", cost: 1, maxStock: BETA_EGG_MAX_STOCK },
  { name: "Sapphire BetaXGruda Egg", img: "/assets/eggs/egg_blue.png", type: "beta", description: "Contains a sapphire beta fish character. Hatches with water affinity.", cost: 1, maxStock: BETA_EGG_MAX_STOCK },
  { name: "Ivory BetaXGruda Egg", img: "/assets/eggs/egg_white.png", type: "beta", description: "Contains an ivory beta fish character. Hatches with spirit affinity.", cost: 1, maxStock: BETA_EGG_MAX_STOCK },
  { name: "Warlord Egg: Dusk Tyrant", img: "/assets/eggs/warlord_purple.png", type: "warlord", description: "Contains the Dusk Tyrant warlord. Commands shadow armies.", cost: 2, maxStock: WARLORD_EGG_MAX_STOCK },
  { name: "Warlord Egg: Iron Sovereign", img: "/assets/eggs/warlord_silver.png", type: "warlord", description: "Contains the Iron Sovereign warlord. Unbreakable defense.", cost: 2, maxStock: WARLORD_EGG_MAX_STOCK },
  { name: "Warlord Egg: Venom King", img: "/assets/eggs/warlord_green.png", type: "warlord", description: "Contains the Venom King warlord. Poisons all who oppose.", cost: 2, maxStock: WARLORD_EGG_MAX_STOCK },
];

const CRAB_SHEET = beachCrabSheetUrl;
const CRAB_FRAME = 16;
const CRAB_COLS = 16;
const CRAB_WALK_FRAMES = 4;

const BEACH_CRABS: FishType[] = [
  { name: "Red Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 8, rarity: "common", weight: 50, minDepth: 0.05, speed: 0.9, description: "A small red crab that scuttles along the beach.", spriteSheet: CRAB_SHEET, spriteRow: 0, spriteFrameSize: CRAB_FRAME, beachCrab: true },
  { name: "Blue Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 10, rarity: "common", weight: 40, minDepth: 0.05, speed: 1.0, description: "A bright blue crab found near tidal pools.", spriteSheet: CRAB_SHEET, spriteRow: 3, spriteFrameSize: CRAB_FRAME, beachCrab: true },
  { name: "Green Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 8, rarity: "common", weight: 45, minDepth: 0.05, speed: 0.8, description: "A mossy green crab hiding in the seaweed.", spriteSheet: CRAB_SHEET, spriteRow: 5, spriteFrameSize: CRAB_FRAME, beachCrab: true },
  { name: "Purple Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 15, rarity: "uncommon", weight: 20, minDepth: 0.05, speed: 1.1, description: "An uncommon purple crab with iridescent shell.", spriteSheet: CRAB_SHEET, spriteRow: 2, spriteFrameSize: CRAB_FRAME, beachCrab: true },
  { name: "Gold Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 25, rarity: "uncommon", weight: 15, minDepth: 0.05, speed: 1.2, description: "A rare golden crab. Prized for its shimmering shell.", spriteSheet: CRAB_SHEET, spriteRow: 11, spriteFrameSize: CRAB_FRAME, beachCrab: true },
  { name: "Cyan Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 8, rarity: "common", weight: 45, minDepth: 0.05, speed: 0.85, description: "A pale cyan crab commonly found on sandy shores.", spriteSheet: CRAB_SHEET, spriteRow: 14, spriteFrameSize: CRAB_FRAME, beachCrab: true },
  { name: "Pink Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 12, rarity: "common", weight: 35, minDepth: 0.05, speed: 0.95, description: "A cute pink crab that loves warm shallow waters.", spriteSheet: CRAB_SHEET, spriteRow: 18, spriteFrameSize: CRAB_FRAME, beachCrab: true },
  { name: "Dark Crab", catchAsset: CRAB_SHEET, catchW: 16, catchH: 16, creatureFolder: "", idleFrames: 4, walkFrames: CRAB_WALK_FRAMES, points: 20, rarity: "uncommon", weight: 18, minDepth: 0.05, speed: 1.15, description: "A dark-shelled crab with powerful pincers.", spriteSheet: CRAB_SHEET, spriteRow: 22, spriteFrameSize: CRAB_FRAME, beachCrab: true },
];

const JUNK_ITEMS = [
  { name: "Old Barrel", asset: "/assets/catch/Barrel.png", w: 12, h: 14, points: 5, description: "A barnacle-covered barrel from a sunken ship." },
  { name: "Wooden Box", asset: "/assets/catch/Box.png", w: 12, h: 10, points: 5, description: "A waterlogged wooden crate." },
  { name: "Treasure Chest", asset: "/assets/catch/Chest.png", w: 22, h: 12, points: 100, description: "A chest glittering with gold coins!" },
];

const CHARACTER_VARIANTS = [
  { name: "Fabled", folder: "fisherman", tint: null, color: "#2ecc71", factionIcon: "/assets/icons/faction_fabled.png", selectImg: "/assets/char_fabled.png" },
  { name: "Legion", folder: "fisherman3", tint: null, color: "#e74c3c", factionIcon: "/assets/icons/faction_legion.png", selectImg: "/assets/char_legion.png" },
  { name: "Crusade", folder: "fisherman2", tint: null, color: "#5dade2", factionIcon: "/assets/icons/faction_crusade.png", selectImg: "/assets/char_crusade.png" },
];

interface Rod {
  name: string;
  price: number;
  catchZoneBonus: number;
  reelSpeedMult: number;
  lineStrength: number;
  description: string;
  icon: string;
}

const RODS: Rod[] = [
  { name: "Bamboo Rod", price: 0, catchZoneBonus: 0, reelSpeedMult: 1.0, lineStrength: 1.0, description: "A simple bamboo rod. Gets the job done.", icon: "/assets/icons/Icons_07.png" },
  { name: "Fiberglass Rod", price: 150, catchZoneBonus: 0.015, reelSpeedMult: 1.1, lineStrength: 1.15, description: "Lighter and more responsive.", icon: "/assets/icons/Icons_07.png" },
  { name: "Carbon Rod", price: 400, catchZoneBonus: 0.025, reelSpeedMult: 1.2, lineStrength: 1.3, description: "High-tech carbon fiber build.", icon: "/assets/icons/Icons_07.png" },
  { name: "Titanium Rod", price: 800, catchZoneBonus: 0.035, reelSpeedMult: 1.35, lineStrength: 1.5, description: "Ultra-strong titanium alloy.", icon: "/assets/icons/Icons_07.png" },
  { name: "Legendary Rod", price: 1500, catchZoneBonus: 0.05, reelSpeedMult: 1.5, lineStrength: 1.8, description: "Forged from the anchor of a ghost ship.", icon: "/assets/icons/Icons_07.png" },
];

interface Lure {
  name: string;
  price: number;
  effect: string;
  description: string;
  icon: string;
  rarityBoost: number;
  sizeBoost: number;
  speedBoost: number;
  targetFish: string[];
  targetBonus: number;
  type: "live" | "lure";
}

const LURES: Lure[] = [
  { name: "Basic Worm", price: 0, effect: "None", description: "A plain earthworm. The classic bait.", icon: "/assets/lures/worm.png", rarityBoost: 1.0, sizeBoost: 0, speedBoost: 1.0, targetFish: [], targetBonus: 1.0, type: "live" },
  { name: "Nightcrawler", price: 40, effect: "Faster bites", description: "A fat, juicy nightcrawler. Fish can't resist the wriggle.", icon: "/assets/lures/nightcrawler.png", rarityBoost: 1.0, sizeBoost: 0.1, speedBoost: 1.4, targetFish: ["Catfish", "Bass"], targetBonus: 1.5, type: "live" },
  { name: "Leech", price: 90, effect: "Attracts bottom feeders", description: "A slimy leech that bottom dwellers love.", icon: "/assets/lures/leech.png", rarityBoost: 1.2, sizeBoost: 0.2, speedBoost: 1.1, targetFish: ["Catfish", "Eel"], targetBonus: 2.5, type: "live" },
  { name: "Maggots", price: 60, effect: "Quick nibbles", description: "A cluster of wriggling maggots. Small fish go crazy.", icon: "/assets/lures/maggots.png", rarityBoost: 1.0, sizeBoost: 0, speedBoost: 2.0, targetFish: ["Minnow", "Perch"], targetBonus: 2.0, type: "live" },
  { name: "Minnow Bait", price: 150, effect: "Attracts predators", description: "A live minnow on the hook. Big predators can't resist.", icon: "/assets/lures/minnow_bait.png", rarityBoost: 1.5, sizeBoost: 0.4, speedBoost: 1.0, targetFish: ["Bass", "Salmon", "Swordfish"], targetBonus: 2.0, type: "live" },
  { name: "Beginner Lure", price: 50, effect: "Slight speed boost", description: "A basic crankbait for beginners. Better than bare hooks.", icon: "/assets/lures/beginner_lure.png", rarityBoost: 1.0, sizeBoost: 0, speedBoost: 1.2, targetFish: [], targetBonus: 1.0, type: "lure" },
  { name: "Crankbait", price: 120, effect: "Attracts Perch & Bass", description: "A fat-bodied diving lure with a rattling action.", icon: "/assets/lures/crankbait.png", rarityBoost: 1.1, sizeBoost: 0.2, speedBoost: 1.3, targetFish: ["Perch", "Bass"], targetBonus: 2.5, type: "lure" },
  { name: "Silver Spoon", price: 100, effect: "Flash attracts fish", description: "A hammered metal spoon that flashes in the water.", icon: "/assets/lures/spoon.png", rarityBoost: 1.0, sizeBoost: 0.1, speedBoost: 1.5, targetFish: ["Salmon", "Minnow"], targetBonus: 2.0, type: "lure" },
  { name: "Grub Worm", price: 80, effect: "Versatile soft bait", description: "A soft plastic grub with a curly tail. Works on everything.", icon: "/assets/lures/grub_worm.png", rarityBoost: 1.1, sizeBoost: 0.1, speedBoost: 1.2, targetFish: [], targetBonus: 1.0, type: "lure" },
  { name: "Spinnerbait", price: 200, effect: "Flash & vibration", description: "Spinning blades create flash and vibration underwater.", icon: "/assets/lures/spinnerbait.png", rarityBoost: 1.3, sizeBoost: 0.3, speedBoost: 1.4, targetFish: ["Bass", "Perch"], targetBonus: 2.5, type: "lure" },
  { name: "Deep Diver", price: 180, effect: "Better deep fish", description: "Dives deep to attract bottom dwellers.", icon: "/assets/lures/deep_diver.png", rarityBoost: 1.2, sizeBoost: 0.3, speedBoost: 1.0, targetFish: ["Catfish", "Eel"], targetBonus: 2.5, type: "lure" },
  { name: "Golden Fly", price: 250, effect: "Rare fish boost", description: "An iridescent golden fly. Rare fish can't resist.", icon: "/assets/lures/golden_fly.png", rarityBoost: 2.0, sizeBoost: 0, speedBoost: 1.0, targetFish: ["Swordfish"], targetBonus: 2.0, type: "lure" },
  { name: "Glow Jig", price: 350, effect: "Bigger fish", description: "Bioluminescent lure that attracts larger specimens.", icon: "/assets/lures/glow_jig.png", rarityBoost: 1.3, sizeBoost: 0.8, speedBoost: 1.1, targetFish: [], targetBonus: 1.0, type: "lure" },
  { name: "Storm Shad", price: 300, effect: "Faster bites", description: "Mimics injured baitfish. Fish bite faster.", icon: "/assets/lures/storm_shad.png", rarityBoost: 1.0, sizeBoost: 0.2, speedBoost: 2.0, targetFish: ["Bass", "Salmon"], targetBonus: 2.0, type: "lure" },
  { name: "Kraken Bait", price: 500, effect: "Legendary attraction", description: "Mysterious bait from the ocean depths.", icon: "/assets/lures/kraken_bait.png", rarityBoost: 3.0, sizeBoost: 0.5, speedBoost: 0.8, targetFish: ["Whale"], targetBonus: 4.0, type: "lure" },
  { name: "Prismatic Lure", price: 750, effect: "All bonuses", description: "A rainbow-shifting lure. Boosts everything.", icon: "/assets/lures/prismatic_lure.png", rarityBoost: 1.8, sizeBoost: 0.5, speedBoost: 1.5, targetFish: [], targetBonus: 1.0, type: "lure" },
];

interface ChumItem {
  name: string;
  price: number;
  description: string;
  icon: string;
  effect: string;
  duration: number;
  rarityBoost: number;
  biteSpeedBoost: number;
  fishAttract: number;
  cooldown: number;
  catchable: boolean;
  type: "chum" | "special";
}

const CHUM_ITEMS: ChumItem[] = [
  { name: "Fish Scraps", price: 15, description: "Basic chum. A slight fish attract.", icon: "/assets/icons/Icons_01.png", effect: "Slight attract", duration: 300, rarityBoost: 1.0, biteSpeedBoost: 1.0, fishAttract: 1.2, cooldown: 120, catchable: false, type: "chum" },
  { name: "Bread Crumbs", price: 20, description: "Attracts small fish nearby.", icon: "/assets/icons/Icons_02.png", effect: "Small fish attract", duration: 350, rarityBoost: 1.0, biteSpeedBoost: 1.1, fishAttract: 1.4, cooldown: 120, catchable: false, type: "chum" },
  { name: "Corn Mash", price: 25, description: "Attracts bottom feeders.", icon: "/assets/icons/Icons_03.png", effect: "Bottom feeder attract", duration: 400, rarityBoost: 1.05, biteSpeedBoost: 1.0, fishAttract: 1.5, cooldown: 140, catchable: false, type: "chum" },
  { name: "Blood Meal", price: 40, description: "Attracts predators with its scent.", icon: "/assets/icons/Icons_04.png", effect: "Predator attract", duration: 350, rarityBoost: 1.15, biteSpeedBoost: 1.05, fishAttract: 1.6, cooldown: 160, catchable: false, type: "chum" },
  { name: "Shrimp Paste", price: 50, description: "Good all-around chum.", icon: "/assets/icons/Icons_05.png", effect: "All-around attract", duration: 400, rarityBoost: 1.1, biteSpeedBoost: 1.15, fishAttract: 1.7, cooldown: 150, catchable: false, type: "chum" },
  { name: "Squid Ink", price: 60, description: "Attracts deep fish.", icon: "/assets/icons/Icons_06.png", effect: "Deep fish attract", duration: 350, rarityBoost: 1.2, biteSpeedBoost: 1.0, fishAttract: 1.5, cooldown: 180, catchable: false, type: "chum" },
  { name: "Fish Oil Slick", price: 75, description: "Wide area attract effect.", icon: "/assets/icons/Icons_08.png", effect: "Wide area attract", duration: 500, rarityBoost: 1.1, biteSpeedBoost: 1.1, fishAttract: 2.0, cooldown: 200, catchable: false, type: "chum" },
  { name: "Sardine Chunks", price: 45, description: "Fast bite speed boost.", icon: "/assets/icons/Icons_09.png", effect: "Fast bites", duration: 300, rarityBoost: 1.0, biteSpeedBoost: 1.5, fishAttract: 1.3, cooldown: 130, catchable: false, type: "chum" },
  { name: "Crab Guts", price: 55, description: "Attracts rare fish.", icon: "/assets/icons/Icons_10.png", effect: "Rare fish attract", duration: 350, rarityBoost: 1.3, biteSpeedBoost: 1.0, fishAttract: 1.4, cooldown: 170, catchable: false, type: "chum" },
  { name: "Mussel Mix", price: 35, description: "Steady and reliable attract.", icon: "/assets/icons/Icons_11.png", effect: "Steady attract", duration: 450, rarityBoost: 1.05, biteSpeedBoost: 1.05, fishAttract: 1.5, cooldown: 140, catchable: false, type: "chum" },
  { name: "Fermented Brine", price: 80, description: "Strong rarity boost.", icon: "/assets/icons/Icons_12.png", effect: "Rarity boost", duration: 400, rarityBoost: 1.5, biteSpeedBoost: 1.0, fishAttract: 1.6, cooldown: 200, catchable: false, type: "chum" },
  { name: "Whale Blubber", price: 100, description: "Attracts legendary fish.", icon: "/assets/icons/Icons_13.png", effect: "Legendary attract", duration: 350, rarityBoost: 1.7, biteSpeedBoost: 1.0, fishAttract: 1.8, cooldown: 250, catchable: false, type: "chum" },
  { name: "Phosphor Dust", price: 120, description: "Glowing effect. Ultra rare boost.", icon: "/assets/icons/Icons_14.png", effect: "Glowing ultra rare", duration: 300, rarityBoost: 2.0, biteSpeedBoost: 1.1, fishAttract: 1.5, cooldown: 280, catchable: false, type: "chum" },
  { name: "Coral Powder", price: 90, description: "Attracts reef fish.", icon: "/assets/icons/Icons_15.png", effect: "Reef fish attract", duration: 400, rarityBoost: 1.3, biteSpeedBoost: 1.1, fishAttract: 1.7, cooldown: 200, catchable: false, type: "chum" },
  { name: "Deep Sea Extract", price: 150, description: "Deep water mega boost.", icon: "/assets/icons/Icons_16.png", effect: "Deep mega boost", duration: 350, rarityBoost: 1.8, biteSpeedBoost: 1.2, fishAttract: 2.0, cooldown: 300, catchable: false, type: "chum" },
  { name: "Thunder Chum", price: 130, description: "Attracts storm fish.", icon: "/assets/icons/Icons_17.png", effect: "Storm fish attract", duration: 300, rarityBoost: 1.6, biteSpeedBoost: 1.3, fishAttract: 1.8, cooldown: 260, catchable: false, type: "chum" },
  { name: "Moonlight Essence", price: 200, description: "Celestial boost to all catches.", icon: "/assets/icons/Icons_18.png", effect: "Celestial boost", duration: 400, rarityBoost: 2.0, biteSpeedBoost: 1.2, fishAttract: 2.2, cooldown: 350, catchable: false, type: "chum" },
  { name: "Kraken Bile", price: 180, description: "Massive rarity increase.", icon: "/assets/icons/Icons_19.png", effect: "Massive rarity", duration: 300, rarityBoost: 2.5, biteSpeedBoost: 1.0, fishAttract: 1.6, cooldown: 320, catchable: false, type: "chum" },
  { name: "Golden Flakes", price: 250, description: "Boosts everything.", icon: "/assets/icons/Icons_20.png", effect: "Everything boost", duration: 500, rarityBoost: 2.0, biteSpeedBoost: 1.4, fishAttract: 2.5, cooldown: 400, catchable: false, type: "chum" },
  { name: "Abyssal Ooze", price: 300, description: "The ultimate chum.", icon: "/assets/icons/Icons_01.png", effect: "Ultimate attract", duration: 600, rarityBoost: 2.5, biteSpeedBoost: 1.5, fishAttract: 3.0, cooldown: 500, catchable: false, type: "chum" },
  { name: "Live Shrimp Cluster", price: 0, description: "Caught live shrimp. Good bait for medium fish.", icon: "/assets/icons/Icons_05.png", effect: "Medium fish attract", duration: 250, rarityBoost: 1.2, biteSpeedBoost: 1.3, fishAttract: 1.8, cooldown: 100, catchable: true, type: "special" },
  { name: "Glowing Plankton", price: 0, description: "Caught glowing plankton. Attracts rare fish.", icon: "/assets/icons/Icons_14.png", effect: "Rare glow attract", duration: 200, rarityBoost: 1.8, biteSpeedBoost: 1.1, fishAttract: 1.5, cooldown: 100, catchable: true, type: "special" },
];

const PREDATOR_TYPES = [
  { name: "Shark", folder: "1", idleFrames: 4, walkFrames: 6, attackFrames: 6, hurtFrames: 2, deathFrames: 6, specialFrames: 6, catchAsset: "/assets/predators/1/Idle.png", catchW: 96, catchH: 96, points: 400, rarity: "rare" as const, weight: 3, speed: 2.2, size: 1.8, scareRadius: 200, description: "A fearsome shark prowling the deep waters.", tint: null as string | null },
  { name: "Kraken", folder: "2", idleFrames: 6, walkFrames: 6, attackFrames: 6, hurtFrames: 2, deathFrames: 6, specialFrames: 6, catchAsset: "/assets/predators/2/Idle.png", catchW: 96, catchH: 96, points: 800, rarity: "legendary" as const, weight: 1, speed: 1.5, size: 2.2, scareRadius: 280, description: "A massive squid from the abyss, feared by all.", tint: null as string | null },
  { name: "Sea Devil", folder: "3", idleFrames: 4, walkFrames: 6, attackFrames: 6, hurtFrames: 2, deathFrames: 6, specialFrames: 6, catchAsset: "/assets/predators/3/Idle.png", catchW: 96, catchH: 96, points: 600, rarity: "rare" as const, weight: 2, speed: 1.8, size: 2.0, scareRadius: 240, description: "A monstrous crab creature from the deep trenches.", tint: null as string | null },
];

interface NpcShopItem {
  name: string;
  type: "chum" | "lure" | "rod";
  index: number;
  price: number;
  description: string;
  icon: string;
}

interface NpcMission {
  description: string;
  fishName: string;
  minSize: number;
  count: number;
  caught: number;
  reward: number;
  completed: boolean;
}

interface NpcRequest {
  description: string;
  fishName: string;
  count: number;
  fulfilled: number;
  reward: number;
  completed: boolean;
}

interface NpcDef {
  id: number;
  name: string;
  spriteFolder: string;
  idleFrames: number;
  walkFrames: number;
  worldX: number;
  role: "shopkeeper" | "requester" | "mission_giver";
  greeting: string;
  shopItems?: NpcShopItem[];
  request?: NpcRequest;
  mission?: NpcMission;
  dialogueLines: string[];
}

const NPC_DEFS: NpcDef[] = [
  {
    id: 1, name: "Old Pete", spriteFolder: "1", idleFrames: 6, walkFrames: 6,
    worldX: 0.52, role: "shopkeeper",
    greeting: "Welcome! I've got supplies for any angler.",
    shopItems: [
      { name: "Fish Scraps", type: "chum", index: 0, price: 12, description: "Basic chum. Cheap!", icon: "/assets/icons/Icons_01.png" },
      { name: "Bread Crumbs", type: "chum", index: 1, price: 18, description: "Attracts small fish.", icon: "/assets/icons/Icons_02.png" },
      { name: "Sardine Chunks", type: "chum", index: 7, price: 40, description: "Fast bites!", icon: "/assets/icons/Icons_09.png" },
      { name: "Nightcrawler", type: "lure", index: 1, price: 35, description: "Juicy wriggling bait.", icon: "/assets/lures/nightcrawler.png" },
    ],
    dialogueLines: ["The pier's been busy lately.", "Watch out for storms - fish bite different.", "Need chum? I got the good stuff."],
  },
  {
    id: 2, name: "Marina", spriteFolder: "3", idleFrames: 4, walkFrames: 6,
    worldX: 0.60, role: "requester",
    greeting: "Hey there! I need help with something...",
    request: { description: "Bring me 2 Perch for my stew.", fishName: "Perch", count: 2, fulfilled: 0, reward: 80, completed: false },
    dialogueLines: ["My grandmother's stew recipe needs fresh fish.", "The Perch around here are the tastiest.", "I'll pay well for your trouble!"],
  },
  {
    id: 3, name: "Captain Rex", spriteFolder: "6", idleFrames: 4, walkFrames: 6,
    worldX: 0.48, role: "mission_giver",
    greeting: "Ahoy! Got a challenge for a brave angler.",
    mission: { description: "Catch a Bass weighing at least 5 lbs.", fishName: "Bass", minSize: 5, count: 1, caught: 0, reward: 200, completed: false },
    dialogueLines: ["I've sailed these waters for decades.", "Only the best anglers take my missions.", "Prove your worth and you'll be rewarded."],
  },
  {
    id: 4, name: "Nelly", spriteFolder: "4", idleFrames: 4, walkFrames: 6,
    worldX: 0.70, role: "shopkeeper",
    greeting: "Looking for something special?",
    shopItems: [
      { name: "Blood Meal", type: "chum", index: 3, price: 35, description: "Attracts predators!", icon: "/assets/icons/Icons_04.png" },
      { name: "Leech", type: "lure", index: 2, price: 80, description: "Bottom dwellers love it.", icon: "/assets/lures/leech.png" },
      { name: "Crankbait", type: "lure", index: 6, price: 110, description: "Rattling diving lure.", icon: "/assets/lures/crankbait.png" },
      { name: "Crab Guts", type: "chum", index: 8, price: 50, description: "Attracts rare fish!", icon: "/assets/icons/Icons_10.png" },
    ],
    dialogueLines: ["These lures are imported, you know.", "Best deals on the dock, guaranteed.", "Come back when you need more gear."],
  },
  {
    id: 5, name: "Fisher Joe", spriteFolder: "2", idleFrames: 4, walkFrames: 6,
    worldX: 0.55, role: "requester",
    greeting: "Psst! I could use a hand...",
    request: { description: "Bring me 3 Minnows for bait.", fishName: "Minnow", count: 3, fulfilled: 0, reward: 50, completed: false },
    dialogueLines: ["I ran out of bait this morning.", "Minnows make the best live bait.", "Help me out and I'll make it worth your while."],
  },
];

const NPC_FRAME_SIZE = 48;

interface MarketEntry {
  recentSold: number;
  lastSoldTime: number;
}

interface FishingAttributes {
  Strength: number;
  Intellect: number;
  Vitality: number;
  Dexterity: number;
  Endurance: number;
  Wisdom: number;
  Agility: number;
  Tactics: number;
}

interface CatchHistoryEntry {
  name: string;
  rarity: string;
  size: number;
  weight: number;
  sellPrice: number;
  timestamp: number;
}

const FISHING_ATTR_DEFS: Record<keyof FishingAttributes, { description: string; color: string; gains: Record<string, { label: string; perPoint: number; unit: string }> }> = {
  Strength: {
    description: "Raw reeling power. Increases reel speed, catch zone, and Force Pool.",
    color: "#ef4444",
    gains: {
      reelPower: { label: "Reel Power", perPoint: 1.5, unit: "%" },
      forcePool: { label: "Force Pool", perPoint: 1, unit: "" },
      catchZone: { label: "Catch Zone", perPoint: 0.3, unit: "%" },
    }
  },
  Intellect: {
    description: "Fishing knowledge. Improves sell prices and reduces Force cost.",
    color: "#8b5cf6",
    gains: {
      sellBonus: { label: "Sell Price Bonus", perPoint: 1.2, unit: "%" },
      forceCostReduce: { label: "Force Cost", perPoint: 2, unit: "% off" },
      xpBonus: { label: "XP Gain", perPoint: 0.8, unit: "%" },
    }
  },
  Vitality: {
    description: "Stamina and persistence. Longer bite windows and faster Force regen.",
    color: "#22c55e",
    gains: {
      biteWindow: { label: "Bite Window", perPoint: 1.0, unit: "%" },
      forceRegen: { label: "Force Regen", perPoint: 0.1, unit: "/s" },
      comboKeep: { label: "Combo Sustain", perPoint: 0.4, unit: "%" },
    }
  },
  Dexterity: {
    description: "Precision and finesse. Better casting accuracy and hook control.",
    color: "#f59e0b",
    gains: {
      castAccuracy: { label: "Cast Accuracy", perPoint: 1.0, unit: "%" },
      hookControl: { label: "Hook Control", perPoint: 0.7, unit: "%" },
      critCatch: { label: "Perfect Catch", perPoint: 0.5, unit: "%" },
    }
  },
  Endurance: {
    description: "Physical resilience. Resist line breaks and fight longer.",
    color: "#78716c",
    gains: {
      lineResist: { label: "Break Resist", perPoint: 1.2, unit: "%" },
      fightDuration: { label: "Fight Stamina", perPoint: 0.8, unit: "%" },
      rodDurability: { label: "Rod Durability", perPoint: 0.5, unit: "%" },
    }
  },
  Wisdom: {
    description: "Deep ocean knowledge. Better rare fish attraction and lowers Force cost multiplier.",
    color: "#06b6d4",
    gains: {
      rarityBoost: { label: "Rarity Boost", perPoint: 1.0, unit: "%" },
      forceMult: { label: "Force Mult", perPoint: -0.1, unit: "" },
      weatherRead: { label: "Spawn Insight", perPoint: 0.4, unit: "%" },
    }
  },
  Agility: {
    description: "Speed and reflexes. Faster reeling, quicker reactions, and Force Pool.",
    color: "#a3e635",
    gains: {
      reelSpeed: { label: "Reel Speed", perPoint: 0.8, unit: "%" },
      forcePool: { label: "Force Pool", perPoint: 1, unit: "" },
      moveSpeed: { label: "Move Speed", perPoint: 0.5, unit: "%" },
    }
  },
  Tactics: {
    description: "Strategic mastery. Boosts all other stats and improves bounty rewards.",
    color: "#ec4899",
    gains: {
      allStatsBonus: { label: "All Stats Boost", perPoint: 0.5, unit: "%" },
      bountyBonus: { label: "Bounty Bonus", perPoint: 1.0, unit: "%" },
      comboMulti: { label: "Combo Multiplier", perPoint: 0.3, unit: "%" },
    }
  },
};

const ATTR_KEYS = Object.keys(FISHING_ATTR_DEFS) as (keyof FishingAttributes)[];

interface Bounty {
  fishName: string;
  minSize: number;
  reward: number;
  label: string;
}

type GameState = "intro" | "title" | "charSelect" | "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed" | "swimming" | "boarding" | "store" | "npcChat";

interface SwimmingFish {
  x: number;
  y: number;
  type: FishType;
  direction: number;
  frame: number;
  frameTimer: number;
  speed: number;
  wobblePhase: number;
  wobbleAmp: number;
  baseY: number;
  approachingHook: boolean;
  dirChangeTimer: number;
  sizeMultiplier: number;
}

interface Predator {
  x: number;
  y: number;
  type: typeof PREDATOR_TYPES[0];
  direction: number;
  frame: number;
  frameTimer: number;
  speed: number;
  wobblePhase: number;
  wobbleAmp: number;
  baseY: number;
  sizeMultiplier: number;
  state: "patrol" | "chase" | "attack" | "flee" | "hurt" | "death";
  stateTimer: number;
  targetFish: SwimmingFish | null;
  attackCooldown: number;
  health: number;
  opacity: number;
  stealTimer: number;
  deathTimer: number;
}

interface CaughtEntry {
  type: FishType | null;
  junk: typeof JUNK_ITEMS[0] | null;
  count: number;
  bestCombo: number;
  biggestSize: number;
  totalWeight: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: "splash" | "sparkle" | "bubble" | "text";
  text?: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export default function FishingGame() {
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); (window as any).__pwaInstallPrompt = e; };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef({
    gameState: "intro" as GameState,
    score: 0,
    combo: 0,
    bestCombo: 0,
    totalCaught: 0,
    hookX: 0,
    hookY: 0,
    hookTargetY: 0,
    castPower: 0,
    castDirection: 1,
    waitTimer: 0,
    biteTimer: 0,
    reelProgress: 0.5,
    reelTarget: 0.5,
    reelDirection: 1,
    reelGauge: 0.5,
    isReeling: false,
    isRightMouseDown: false,
    currentCatch: null as FishType | null,
    currentJunk: null as typeof JUNK_ITEMS[0] | null,
    swimmingFish: [] as SwimmingFish[],
    caughtCollection: new Map<string, CaughtEntry>(),
    particles: [] as Particle[],
    ripples: [] as Ripple[],
    waterOffset: 0,
    time: 0,
    bobberBob: 0,
    showCatchTimer: 0,
    rodLevel: 1,
    flashTimer: 0,
    lineWobble: 0,
    exclamationTimer: 0,
    missReason: "",
    starCount: 50,
    stars: [] as { x: number; y: number; size: number; twinkle: number }[],
    screenShake: 0,
    weather: "clear" as "clear" | "cloudy" | "rain" | "storm" | "fog",
    weatherTimer: 0,
    weatherTransition: 0,
    rainDrops: [] as { x: number; y: number; speed: number; length: number }[],
    lightningTimer: 0,
    lightningFlash: 0,
    celestialEvent: "none" as "none" | "red_sun" | "green_moon" | "tentacle_sun" | "blood_moon",
    celestialTimer: 0,
    celestialFade: 0,
    windSpeed: 0,
    windTarget: 0,
    bgBirds: [] as { x: number; y: number; frame: number; speed: number; wingPhase: number }[],
    bgShips: [] as { x: number; y: number; size: number; speed: number; type: number }[],
    shootingStars: [] as { x: number; y: number; vx: number; vy: number; life: number; trail: number[] }[],
    auroraPhase: 0,
    lastDayNight: "day" as "day" | "night",
    catchPopY: 0,
    mouseX: 0,
    mouseY: 0,
    aimX: 0,
    aimY: 0,
    hookedFishX: 0,
    hookedFishY: 0,
    hookedFishDir: 1,
    hookedFishFrame: 0,
    hookedFishFrameTimer: 0,
    hookedFishVX: 0,
    hookedFishSize: 1,
    playerX: 0,
    playerVX: 0,
    playerVY: 0,
    swimX: 0,
    swimY: 0,
    facingLeft: true,
    keysDown: new Set<string>(),
    isSwimming: false,
    jumpVY: 0,
    splashDone: false,
    showBoatPrompt: false,
    nearBoat: false,
    inBoat: false,
    boatStanding: false,
    boatRowing: false,
    boatX: 0,
    boardingPhase: 0 as number,
    boardingTargetX: 0,
    boardingTimer: 0,
    lastFishermanX: 0,
    lastFishermanY: 0,
    lastRodTipX: 0,
    lastRodTipY: 0,
    cameraX: 0,
    selectedCharacter: 0,
    characterSelected: false,
    playerName: "",
    equippedRod: 0,
    equippedLure: 0,
    ownedRods: [true, false, false, false, false] as boolean[],
    ownedLures: Array.from({ length: LURES.length }, (_, i) => i === 0) as boolean[],
    money: 50,
    marketPrices: new Map<string, MarketEntry>(),
    nearHut: false,
    showStorePrompt: false,
    storeTab: "rod" as "rod" | "lure" | "chum" | "eggs",
    billboardSlide: 0,
    billboardTimer: 0,
    billboardLeaderboard: [] as any[],
    billboardLeaderboardTimer: 0,
    bounties: [] as Bounty[],
    biggestCatchName: "",
    biggestCatchSize: 0,
    biggestCatchWeight: 0,
    sessionStartTime: Date.now(),
    sessionCatches: 0,
    showLeaderboard: false,
    leaderboardTab: "biggest" as "biggest" | "session" | "legendary",
    lastSellPrice: 0,
    lastFishWeight: 0,
    playerLevel: 1,
    playerXP: 0,
    playerXPToNext: 100,
    attributePoints: 3,
    attributes: { Strength: 1, Intellect: 1, Vitality: 1, Dexterity: 1, Endurance: 1, Wisdom: 1, Agility: 1, Tactics: 1 } as FishingAttributes,
    catchHistory: [] as CatchHistoryEntry[],
    forceBar: 11,
    forceBarMax: 11,
    resilience: 2,
    resilienceMax: 2,
    activeReelHeld: false,
    letOutLineCooldown: 0,
    hookedFishVY: 0,
    hookedFishDiveTimer: 0,
    hookLineMaxDist: 0,
    selectedHotbar: 1,
    binoculars: false,
    binoX: 0,
    binoY: 0,
    binoTargetX: 0,
    binoTargetY: 0,
    cameraY: 0,
    swimAngle: 0,
    swimAngleTarget: 0,
    jumpArc: 0,
    jumpPeakReached: false,
    showLurePopup: false,
    showChumPopup: false,
    ownedChum: Array.from({ length: 22 }, () => 0) as number[],
    equippedChum: -1,
    chumActiveTimer: 0,
    chumActiveType: -1,
    chumCooldown: 0,
    toolMode: "rod" as "rod" | "net",
    netCooldown: 0,
    netCastX: 0,
    netCastY: 0,
    netWidth: 0,
    netDepth: 0,
    netActive: false,
    netTimer: 0,
    catchPhase: 0 as number,
    catchPhaseTimer: 0,
    catchFishWorldX: 0,
    catchFishWorldY: 0,
    catchFishTargetY: 0,
    catchFishRotation: 0,
    catchSplashTimer: 0,
    slotSpinPhase: 0 as number,
    slotSpinTimer: 0,
    slotSpinValue: 0,
    slotSpinSpeed: 0,
    slotWeightRevealed: false,
    slotLengthRevealed: false,
    slotStarsRevealed: false,
    slotFinalWeight: 0,
    slotFinalLength: 0,
    slotFinalStars: 0,
    catchFishFlipTimer: 0,
    predators: [] as Predator[],
    predatorSpawnTimer: 0,
    predatorAlert: "" as string,
    predatorAlertTimer: 0,
    boatDamageShake: 0,
    adminOpen: false,
    adminTab: "assets" as "assets" | "gizmo" | "trace",
    gizmoEnabled: false,
    gizmoSelected: -1,
    gizmoDragging: false,
    gizmoDragOffX: 0,
    gizmoDragOffY: 0,
    gamePaused: false,
    traceMode: false,
    worldObjects: [
      { id: "barrel4", sprite: "/assets/objects/Fishbarrel4.png", x: 0, y: 0, scale: 2.2, label: "Fish Barrel 4" },
      { id: "barrel1", sprite: "/assets/objects/Fishbarrel1.png", x: 0, y: 0, scale: 2.2, label: "Fish Barrel 1" },
      { id: "barrel2", sprite: "/assets/objects/Fishbarrel2.png", x: 0, y: 0, scale: 2.2, label: "Fish Barrel 2" },
      { id: "fishrod", sprite: "/assets/objects/Fish-rod.png", x: 0, y: 0, scale: 2, label: "Fish Rod Stand" },
      { id: "stay", sprite: "/assets/objects/Stay.png", x: 0, y: 0, scale: 2.2, label: "Stay Sign" },
      { id: "grass1", sprite: "/assets/objects/Grass1.png", x: 0, y: 0, scale: 1.8, label: "Grass 1" },
      { id: "grass3", sprite: "/assets/objects/Grass3.png", x: 0, y: 0, scale: 1.5, label: "Grass 3" },
      { id: "grass2", sprite: "/assets/objects/Grass2.png", x: 0, y: 0, scale: 1.6, label: "Grass 2" },
      { id: "grass4", sprite: "/assets/objects/Grass4.png", x: 0, y: 0, scale: 1.4, label: "Grass 4" },
    ] as { id: string; sprite: string; x: number; y: number; scale: number; label: string }[],
    ropeSegments: [] as { x: number; y: number; ox: number; oy: number }[],
    castLineActive: false,
    castLineFlying: false,
    castLineLanded: false,
    castVelX: 0,
    castVelY: 0,
    npcs: NPC_DEFS.map(def => ({
      ...def,
      frame: 0,
      frameTimer: 0,
      facingLeft: def.worldX > 0.55,
    })),
    nearNpc: -1,
    activeNpc: -1,
    npcDialogueIndex: 0,
    npcTab: "talk" as "talk" | "shop" | "request" | "mission",
    headOfLegends: 0,
    ownedEggs: Array.from({ length: BETAXGRUDA_EGGS.length }, () => false) as boolean[],
    eggStock: BETAXGRUDA_EGGS.map(e => e.maxStock) as number[],
    legendsCaught: new Set<string>(),
    headOfLegendsNotif: "" as string,
    headOfLegendsNotifTimer: 0,
    showPromo: false,
    promoShown: false,
    underwaterPlants: [] as UnderwaterPlant[],
    plantsInitialized: false,
  });

  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [uiState, setUiState] = useState({
    gameState: "intro" as GameState,
    score: 0,
    combo: 0,
    totalCaught: 0,
    currentCatch: null as FishType | null,
    currentJunk: null as typeof JUNK_ITEMS[0] | null,
    reelProgress: 0.5,
    reelGauge: 0.5,
    reelTarget: 0.5,
    castPower: 0,
    rodLevel: 1,
    alignment: 0,
    bestCombo: 0,
    currentFishSize: 1,
    caughtCollection: [] as [string, CaughtEntry][],
    missReason: "",
    showCatchTimer: 0,
    showBoatPrompt: false,
    nearBoat: false,
    inBoat: false,
    selectedCharacter: 0,
    characterSelected: false,
    playerName: "",
    equippedRod: 0,
    equippedLure: 0,
    ownedRods: [true, false, false, false, false] as boolean[],
    ownedLures: Array.from({ length: LURES.length }, (_, i) => i === 0) as boolean[],
    money: 50,
    nearHut: false,
    showStorePrompt: false,
    storeTab: "rod" as "rod" | "lure" | "chum" | "eggs",
    billboardSlide: 0,
    billboardLeaderboard: [] as any[],
    billboardLeaderboardTimer: 0,
    bounties: [] as Bounty[],
    biggestCatchName: "",
    biggestCatchSize: 0,
    biggestCatchWeight: 0,
    lastSellPrice: 0,
    lastFishWeight: 0,
    playerLevel: 1,
    playerXP: 0,
    playerXPToNext: 100,
    attributePoints: 3,
    attributes: { Strength: 1, Intellect: 1, Vitality: 1, Dexterity: 1, Endurance: 1, Wisdom: 1, Agility: 1, Tactics: 1 } as FishingAttributes,
    catchHistory: [] as CatchHistoryEntry[],
    forceBar: 11,
    forceBarMax: 11,
    resilience: 2,
    resilienceMax: 2,
    selectedHotbar: 1,
    binoculars: false,
    binoX: 0,
    binoY: 0,
    binoTargetX: 0,
    binoTargetY: 0,
    swimAngle: 0,
    swimAngleTarget: 0,
    jumpArc: 0,
    jumpPeakReached: false,
    showLurePopup: false,
    showChumPopup: false,
    ownedChum: Array.from({ length: 22 }, () => 0) as number[],
    equippedChum: -1,
    chumActiveTimer: 0,
    chumActiveType: -1,
    toolMode: "rod" as "rod" | "net",
    netActive: false,
    adminOpen: false,
    adminTab: "assets" as "assets" | "gizmo" | "trace",
    gizmoEnabled: false,
    gamePaused: false,
    traceMode: false,
    nearNpc: -1,
    activeNpc: -1,
    npcDialogueIndex: 0,
    npcTab: "talk" as "talk" | "shop" | "request" | "mission",
    npcs: NPC_DEFS.map(def => ({
      ...def,
      request: def.request ? { ...def.request } : undefined,
      mission: def.mission ? { ...def.mission } : undefined,
    })),
    headOfLegends: 0,
    ownedEggs: Array.from({ length: BETAXGRUDA_EGGS.length }, () => false) as boolean[],
    eggStock: BETAXGRUDA_EGGS.map(e => e.maxStock) as number[],
    headOfLegendsNotif: "" as string,
    headOfLegendsNotifTimer: 0,
    showLeaderboard: false,
    leaderboardTab: "biggest" as "biggest" | "session" | "legendary",
    leaderboardData: [] as any[],
    leaderboardLoading: false,
    showInstallPrompt: false,
    showPromo: false,
    promoShown: false,
    underwaterPlants: [] as UnderwaterPlant[],
    plantsInitialized: false,
  });

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const existing = imagesRef.current.get(src);
      if (existing && existing.complete) { resolve(existing); return; }
      const img = new Image();
      img.onload = () => { imagesRef.current.set(src, img); resolve(img); };
      img.onerror = () => resolve(img);
      img.src = src;
    });
  }, []);

  const spawnFish = useCallback((canvasW: number, waterStartY: number, canvasH: number, spawnWorldX?: number) => {
    const s = stateRef.current;
    const shopCenterX = canvasW * 0.85 + (192 * 2.2) / 2;
    const centerX = spawnWorldX ?? (-s.cameraX + canvasW / 2);
    const distLeft = Math.max(0, shopCenterX - centerX);
    const distRight = Math.max(0, centerX - shopCenterX);
    const distRatio = Math.min(1, distLeft / (canvasW * 4));
    const rightRatio = Math.min(1, distRight / (canvasW * 4));

    const lure = LURES[s.equippedLure];
    const wisdomBoost = 1 + s.attributes.Wisdom * 0.01 * (1 + s.attributes.Tactics * 0.005);
    const chumRarityBoost = s.chumActiveType >= 0 ? CHUM_ITEMS[s.chumActiveType].rarityBoost : 1;
    const ce = s.celestialEvent;
    const ceFade = s.celestialFade;
    const celestialRare = ce === "red_sun" ? 1 + ceFade * 1.5 : 1;
    const celestialLegendary = ce === "green_moon" ? 1 + ceFade * 2.5 : ce === "blood_moon" ? 1 + ceFade * 1.5 : 1;
    const celestialUltra = ce === "tentacle_sun" ? 1 + ceFade * 3.5 : ce === "blood_moon" ? 1 + ceFade * 2 : 1;
    const adjustedWeights = FISH_TYPES.map(ft => {
      let w = ft.weight;
      if (rightRatio > 0.1) {
        if (ft.rarity === "ultra_rare") w *= Math.max(0.01, 1 - rightRatio * 3);
        else if (ft.rarity === "legendary") w *= Math.max(0.05, 1 - rightRatio * 2.5);
        else if (ft.rarity === "rare") w *= Math.max(0.1, 1 - rightRatio * 2);
        else if (ft.rarity === "uncommon") w *= 1 + rightRatio * 0.5;
        else w *= 1 + rightRatio * 2;
      } else {
        const rarityBoost = distRatio;
        if (ft.rarity === "ultra_rare") w *= (1 + rarityBoost * 25) * lure.rarityBoost * wisdomBoost * celestialUltra * chumRarityBoost;
        else if (ft.rarity === "legendary") w *= (1 + rarityBoost * 15) * lure.rarityBoost * wisdomBoost * celestialLegendary * chumRarityBoost;
        else if (ft.rarity === "rare") w *= (1 + rarityBoost * 8) * lure.rarityBoost * wisdomBoost * celestialRare * chumRarityBoost;
        else if (ft.rarity === "uncommon") w *= (1 + rarityBoost * 3) * (1 + (wisdomBoost - 1) * 0.5);
        else w *= Math.max(0.3, 1 - rarityBoost * 0.5);
      }
      if (lure.targetFish.includes(ft.name)) w *= lure.targetBonus;
      return { ft, w };
    });

    const totalWeight = adjustedWeights.reduce((a, f) => a + f.w, 0);
    let r = Math.random() * totalWeight;
    let fishType = FISH_TYPES[0];
    for (const { ft, w } of adjustedWeights) {
      r -= w;
      if (r <= 0) { fishType = ft; break; }
    }
    const waterRange = canvasH - waterStartY;
    const minY = waterStartY + waterRange * fishType.minDepth;
    const maxY = canvasH - 60;
    const y = minY + Math.random() * Math.max(10, maxY - minY);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const viewLeft = -s.cameraX - 100;
    const viewRight = -s.cameraX + canvasW + 100;
    const x = direction > 0 ? viewLeft - 80 : viewRight + 80;
    const baseSizeMult = 0.5 + Math.random() * Math.random() * 4.5;
    const ultraScale = fishType.baseScale || 1;
    const rightSizeReduction = rightRatio > 0.1 ? Math.max(0.3, 1 - rightRatio * 0.7) : 1;
    const sizeMultiplier = (baseSizeMult * (1 + distRatio * 0.8) + lure.sizeBoost) * ultraScale * rightSizeReduction;
    s.swimmingFish.push({
      x, y, baseY: y, type: fishType, direction, frame: 0, frameTimer: 0,
      speed: fishType.speed * (0.7 + Math.random() * 0.6),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 2 + Math.random() * 4,
      approachingHook: false,
      dirChangeTimer: 60 + Math.random() * 120,
      sizeMultiplier,
    });
  }, []);

  const spawnBeachCrab = useCallback((canvasW: number, waterStartY: number, canvasH: number) => {
    const s = stateRef.current;
    const centerX = -s.cameraX + canvasW / 2;
    const beachStart = canvasW * 3.0;
    if (centerX < beachStart - canvasW) return;

    const crabType = BEACH_CRABS[Math.floor(Math.random() * BEACH_CRABS.length)];
    const y = waterStartY + 5 + Math.random() * 40;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const viewLeft = -s.cameraX - 50;
    const viewRight = -s.cameraX + canvasW + 50;
    const x = direction > 0 ? viewLeft - 40 : viewRight + 40;
    const sizeMultiplier = 0.6 + Math.random() * 0.8;

    s.swimmingFish.push({
      x, y, baseY: y, type: crabType, direction, frame: 0, frameTimer: 0,
      speed: crabType.speed * (0.7 + Math.random() * 0.5),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 1 + Math.random() * 2,
      approachingHook: false,
      dirChangeTimer: 40 + Math.random() * 80,
      sizeMultiplier,
    });
  }, []);

  const spawnPredator = useCallback((canvasW: number, waterStartY: number, canvasH: number) => {
    const s = stateRef.current;
    const shopCenterX = canvasW * 0.85 + (192 * 2.2) / 2;
    const centerX = -s.cameraX + canvasW / 2;
    const distLeft = Math.max(0, shopCenterX - centerX);
    const distRight = Math.max(0, centerX - shopCenterX);
    const leftRatio = Math.min(1, distLeft / (canvasW * 4));
    const rightRatio = Math.min(1, distRight / (canvasW * 4));
    
    const spawnChance = rightRatio > 0.1 ? 0.01 : 0.01 + leftRatio * 0.24;
    if (Math.random() > spawnChance) return;
    
    const predType = leftRatio > 0.5 ? 
      PREDATOR_TYPES[Math.floor(Math.random() * 3)] :
      leftRatio > 0.2 ? 
        PREDATOR_TYPES[Math.random() < 0.7 ? 0 : Math.random() < 0.5 ? 2 : 1] :
        PREDATOR_TYPES[0];
    
    const waterRange = canvasH - waterStartY;
    const minY = waterStartY + waterRange * 0.4;
    const maxY = canvasH - 40;
    const y = minY + Math.random() * (maxY - minY);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const viewLeft = -s.cameraX - 200;
    const viewRight = -s.cameraX + canvasW + 200;
    const x = direction > 0 ? viewLeft - 150 : viewRight + 150;
    const sizeMultiplier = (0.8 + Math.random() * 0.6) * predType.size;
    
    const isMurky = s.weather === "storm" || s.weather === "rain" || s.weather === "fog";
    
    s.predators.push({
      x, y, baseY: y, type: predType, direction, frame: 0, frameTimer: 0,
      speed: predType.speed * (0.8 + Math.random() * 0.4),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 3 + Math.random() * 5,
      sizeMultiplier,
      state: "patrol",
      stateTimer: 120 + Math.random() * 180,
      targetFish: null,
      attackCooldown: 0,
      health: 3,
      opacity: isMurky ? 0.15 : 1.0,
      stealTimer: 0,
      deathTimer: 0,
    });
  }, []);

  const addParticles = useCallback((x: number, y: number, count: number, color: string, spread = 3, type: Particle["type"] = "splash") => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * spread,
        vy: type === "splash" ? -Math.random() * spread - 1 : (Math.random() - 0.5) * spread,
        life: 20 + Math.random() * 30,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 3,
        type,
      });
    }
  }, []);

  const addRipple = useCallback((x: number, y: number, maxR = 30) => {
    stateRef.current.ripples.push({ x, y, radius: 2, maxRadius: maxR, alpha: 0.6 });
  }, []);

  const generateBounties = useCallback(() => {
    const s = stateRef.current;
    const shuffled = [...FISH_TYPES].sort(() => Math.random() - 0.5);
    s.bounties = shuffled.slice(0, 3).map(ft => {
      const ms = Math.round((1.5 + Math.random() * 2) * 10) / 10;
      return {
        fishName: ft.name,
        minSize: ms,
        reward: Math.floor((ft.points * 2 + Math.random() * 100) / 10) * 10,
        label: `Catch a ${ft.name} (${ms.toFixed(1)}x+)`,
      };
    });
  }, []);

  const getSellPrice = useCallback((fishType: FishType | null, junk: typeof JUNK_ITEMS[0] | null, size: number) => {
    const s = stateRef.current;
    if (!fishType && !junk) return 0;
    const basePts = fishType?.points || junk?.points || 5;
    const rarityMult = fishType ? (fishType.rarity === "ultra_rare" ? 10 : fishType.rarity === "legendary" ? 5 : fishType.rarity === "rare" ? 3 : fishType.rarity === "uncommon" ? 1.8 : 1) : 0.5;
    const intBonus = 1 + s.attributes.Intellect * 0.012 * (1 + s.attributes.Tactics * 0.005);
    const basePrice = Math.floor(basePts * rarityMult * size * 0.4 * intBonus);
    const name = fishType?.name || junk?.name || "";
    const market = s.marketPrices.get(name);
    let demandMult = 1.0;
    if (market) {
      const timeSinceLast = s.time - market.lastSoldTime;
      const recovered = Math.min(market.recentSold, Math.floor(timeSinceLast / 600));
      const effectiveSold = Math.max(0, market.recentSold - recovered);
      demandMult = Math.max(0.3, 1 - effectiveSold * 0.12);
    }
    return Math.max(1, Math.floor(basePrice * demandMult));
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    s.stars = Array.from({ length: s.starCount }, () => ({
      x: Math.random(), y: Math.random() * 0.4, size: 1 + Math.random() * 2, twinkle: Math.random() * Math.PI * 2,
    }));
    s.weatherTimer = 3600 + Math.random() * 7200;
    s.bgBirds = Array.from({ length: 4 }, () => ({
      x: Math.random() * 1600, y: 30 + Math.random() * 60, frame: 0, speed: 0.3 + Math.random() * 0.5, wingPhase: Math.random() * Math.PI * 2,
    }));
    s.bgShips = Array.from({ length: 2 }, () => ({
      x: -200 - Math.random() * 400, y: 0, size: 0.5 + Math.random() * 0.5, speed: 0.08 + Math.random() * 0.1, type: Math.floor(Math.random() * 3),
    }));
    s.rainDrops = Array.from({ length: 200 }, () => ({
      x: Math.random() * 1600, y: Math.random() * 600, speed: 4 + Math.random() * 6, length: 4 + Math.random() * 8,
    }));

    const spriteNames = [
      "Fisherman_idle.png", "Fisherman_fish.png", "Fisherman_attack.png",
      "Fisherman_hurt.png", "Fisherman_walk.png", "Fisherman_swim.png",
      "Fisherman_swim2.png", "Fisherman_jump.png", "Fisherman_idle2.png",
      "Fisherman_row.png",
    ];
    const assets = [
      ...CHARACTER_VARIANTS.flatMap(cv => spriteNames.map(sn => `/assets/${cv.folder}/${sn}`)),
      "/assets/objects/Boat.png",
      "/assets/objects/Boat2.png",
      "/assets/objects/Water.png",
      "/assets/objects/Pier_Tiles.png",
      "/assets/objects/Fishing_hut.png",
      "/assets/objects/Stay.png",
      "/assets/objects/Fish-rod.png",
      "/assets/objects/Grass1.png",
      "/assets/objects/Grass2.png",
      "/assets/objects/Grass3.png",
      "/assets/objects/Grass4.png",
      "/assets/objects/Fishbarrel1.png",
      "/assets/objects/Fishbarrel2.png",
      "/assets/objects/Fishbarrel3.png",
      "/assets/objects/Fishbarrel4.png",
      ...FISH_TYPES.map(f => f.catchAsset),
      ...JUNK_ITEMS.map(j => j.asset),
      ...["1","2","3","4","5","6"].flatMap(n => [
        `/assets/creatures/${n}/Idle.png`,
        `/assets/creatures/${n}/Walk.png`,
      ]),
      ...Array.from({length: 17}, (_, i) => `/assets/icons/Icons_${String(i+1).padStart(2,'0')}.png`),
      ...["1","2","3"].flatMap(n => [
        `/assets/predators/${n}/Idle.png`,
        `/assets/predators/${n}/Walk.png`,
        `/assets/predators/${n}/Attack1.png`,
        `/assets/predators/${n}/Hurt.png`,
        `/assets/predators/${n}/Death.png`,
      ]),
      "/assets/logo.png",
      "/assets/icons/gbux.png",
      "/assets/icons/faction_fabled.png",
      "/assets/icons/faction_legion.png",
      "/assets/icons/faction_crusade.png",
      "/assets/char_fabled.png",
      "/assets/char_legion.png",
      "/assets/char_crusade.png",
    ];
    Promise.all(assets.map(a => loadImage(a)));
    generateBounties();
  }, [loadImage, generateBounties]);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    const alignDist = Math.abs(s.playerX - s.hookedFishX);
    const maxAlignDist = 400;
    const alignVal = Math.max(0, 1 - alignDist / maxAlignDist);
    setUiState({
      gameState: s.gameState,
      score: s.score,
      combo: s.combo,
      totalCaught: s.totalCaught,
      currentCatch: s.currentCatch,
      currentJunk: s.currentJunk,
      reelProgress: s.reelProgress,
      reelGauge: s.reelGauge,
      reelTarget: s.reelTarget,
      castPower: s.castPower,
      rodLevel: s.rodLevel,
      alignment: s.gameState === "reeling" ? alignVal : 0,
      bestCombo: s.bestCombo,
      currentFishSize: s.hookedFishSize,
      caughtCollection: Array.from(s.caughtCollection.entries()),
      missReason: s.missReason,
      showCatchTimer: s.showCatchTimer,
      showBoatPrompt: s.showBoatPrompt,
      nearBoat: s.nearBoat,
      inBoat: s.inBoat,
      selectedCharacter: s.selectedCharacter,
      characterSelected: s.characterSelected,
      playerName: s.playerName,
      equippedRod: s.equippedRod,
      equippedLure: s.equippedLure,
      ownedRods: [...s.ownedRods],
      ownedLures: [...s.ownedLures],
      money: s.money,
      nearHut: s.nearHut,
      showStorePrompt: s.showStorePrompt,
      storeTab: s.storeTab,
      billboardSlide: s.billboardSlide,
      bounties: [...s.bounties],
      biggestCatchName: s.biggestCatchName,
      biggestCatchSize: s.biggestCatchSize,
      biggestCatchWeight: s.biggestCatchWeight,
      lastSellPrice: s.lastSellPrice,
      lastFishWeight: s.lastFishWeight,
      playerLevel: s.playerLevel,
      playerXP: s.playerXP,
      playerXPToNext: s.playerXPToNext,
      attributePoints: s.attributePoints,
      attributes: { ...s.attributes },
      catchHistory: [...s.catchHistory],
      forceBar: s.forceBar,
      forceBarMax: s.forceBarMax,
      resilience: s.resilience,
      resilienceMax: s.resilienceMax,
      selectedHotbar: s.selectedHotbar,
      binoculars: s.binoculars,
      binoX: s.binoX,
      binoY: s.binoY,
      binoTargetX: s.binoTargetX,
      binoTargetY: s.binoTargetY,
      swimAngle: s.swimAngle,
      swimAngleTarget: s.swimAngleTarget,
      jumpArc: s.jumpArc,
      jumpPeakReached: s.jumpPeakReached,
      showLurePopup: s.showLurePopup,
      showChumPopup: s.showChumPopup,
      ownedChum: [...s.ownedChum],
      equippedChum: s.equippedChum,
      chumActiveTimer: s.chumActiveTimer,
      chumActiveType: s.chumActiveType,
      toolMode: s.toolMode,
      netActive: s.netActive,
      adminOpen: s.adminOpen,
      adminTab: s.adminTab,
      gizmoEnabled: s.gizmoEnabled,
      gamePaused: s.gamePaused,
      traceMode: s.traceMode,
      nearNpc: s.nearNpc,
      activeNpc: s.activeNpc,
      npcDialogueIndex: s.npcDialogueIndex,
      npcTab: s.npcTab,
      npcs: s.npcs.map(n => ({ ...n, request: n.request ? { ...n.request } : undefined, mission: n.mission ? { ...n.mission } : undefined })),
      headOfLegends: s.headOfLegends,
      ownedEggs: [...s.ownedEggs],
      eggStock: [...s.eggStock],
      headOfLegendsNotif: s.headOfLegendsNotif,
      headOfLegendsNotifTimer: s.headOfLegendsNotifTimer,
      showLeaderboard: s.showLeaderboard,
      leaderboardTab: s.leaderboardTab,
      leaderboardData: s.leaderboardData || [],
      leaderboardLoading: s.leaderboardLoading || false,
      showInstallPrompt: s.showInstallPrompt || false,
      showPromo: s.showPromo || false,
      underwaterPlants: s.underwaterPlants,
      plantsInitialized: s.plantsInitialized,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    if (!bgmRef.current) {
      const audio = new Audio(BGM_URL);
      audio.loop = true;
      audio.volume = 0.3;
      bgmRef.current = audio;
    }

    const onDocMouseMove = (e: MouseEvent) => {
      const st = stateRef.current;
      st.mouseX = e.clientX;
      st.mouseY = e.clientY;
    };
    const onDocMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        stateRef.current.isReeling = true;
      }
      if (e.button === 2) {
        stateRef.current.isRightMouseDown = true;
        const gs = stateRef.current.gameState;
        if (gs === "casting") {
          stateRef.current.gameState = "idle";
          stateRef.current.hookX = -100;
          stateRef.current.hookY = -100;
          stateRef.current.ropeSegments = [];
          stateRef.current.castLineActive = false;
          stateRef.current.castLineLanded = false;
        } else if (gs === "waiting") {
          stateRef.current.gameState = "idle";
          stateRef.current.hookX = -100;
          stateRef.current.hookY = -100;
          stateRef.current.ropeSegments = [];
          stateRef.current.castLineActive = false;
          stateRef.current.castLineLanded = false;
          stateRef.current.swimmingFish.forEach(f => { f.approachingHook = false; });
        }
      }
    };
    const onDocMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        stateRef.current.isReeling = false;
      }
      if (e.button === 2) stateRef.current.isRightMouseDown = false;
    };
    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };
    const onDocTouchStart = () => {
      stateRef.current.isReeling = true;
    };
    const onDocTouchEnd = () => {
      stateRef.current.isReeling = false;
    };
    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("mouseup", onDocMouseUp);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("touchstart", onDocTouchStart);
    document.addEventListener("touchend", onDocTouchEnd);

    const onKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.gameState === "charSelect" || stateRef.current.gameState === "intro") return;
      const key = e.key.toLowerCase();
      stateRef.current.keysDown.add(key);
      if (key === " " && stateRef.current.gameState === "reeling") {
        e.preventDefault();
        stateRef.current.activeReelHeld = true;
        return;
      }
      if (key === "s" && stateRef.current.gameState === "reeling" && stateRef.current.letOutLineCooldown <= 0 && stateRef.current.resilience > 0) {
        e.preventDefault();
        const st = stateRef.current;
        st.resilience--;
        st.reelTarget += (st.reelProgress - st.reelTarget) * 0.6;
        st.hookedFishVX *= 0.3;
        st.hookedFishVY *= 0.3;
        st.letOutLineCooldown = 30;
        return;
      }
      if (["a", "d", "w", "s", " ", "e"].includes(key)) e.preventDefault();
      if (key === "1") {
        stateRef.current.selectedHotbar = 1;
        stateRef.current.toolMode = "rod";
        stateRef.current.showLurePopup = false;
        stateRef.current.showChumPopup = false;
        stateRef.current.binoculars = false;
        syncUI();
        return;
      }
      if (key === "2") {
        stateRef.current.selectedHotbar = 2;
        stateRef.current.showLurePopup = !stateRef.current.showLurePopup;
        stateRef.current.showChumPopup = false;
        stateRef.current.binoculars = false;
        syncUI();
        return;
      }
      if (key === "3") {
        stateRef.current.selectedHotbar = 3;
        stateRef.current.showChumPopup = !stateRef.current.showChumPopup;
        stateRef.current.showLurePopup = false;
        stateRef.current.binoculars = false;
        syncUI();
        return;
      }
      if (key === "4") {
        stateRef.current.selectedHotbar = 4;
        stateRef.current.toolMode = "net";
        stateRef.current.showLurePopup = false;
        stateRef.current.showChumPopup = false;
        stateRef.current.binoculars = false;
        syncUI();
        return;
      }
      if (key === "5") {
        const st = stateRef.current;
        if (!st.binoculars && !["idle", "swimming"].includes(st.gameState)) return;
        st.binoculars = !st.binoculars;
        st.selectedHotbar = st.binoculars ? 5 : 1;
        st.showLurePopup = false;
        st.showChumPopup = false;
        if (st.binoculars) {
          const canvas = canvasRef.current;
          if (canvas) {
            st.binoX = -st.cameraX + canvas.width / 2;
            st.binoY = -st.cameraY + canvas.height / 2;
            st.binoTargetX = st.binoX;
            st.binoTargetY = st.binoY;
          }
        }
        syncUI();
        return;
      }
      if (key === "tab") {
        e.preventDefault();
        setShowCharPanel(prev => !prev);
        return;
      }
      if (key === "escape" && stateRef.current.gameState === "store") {
        stateRef.current.gameState = "idle";
        syncUI();
      }
      if (key === "escape" && stateRef.current.gameState === "npcChat") {
        stateRef.current.gameState = "idle";
        stateRef.current.activeNpc = -1;
        syncUI();
      }
      if (key === "e" && stateRef.current.gameState === "idle" && !stateRef.current.showBoatPrompt && !stateRef.current.showStorePrompt) {
        if (stateRef.current.inBoat) {
          const canvas = canvasRef.current;
          if (canvas) {
            const pierLeftBound = canvas.width * 0.45 - 80;
            const boatRight = stateRef.current.boatX + 74 * 2.5;
            const distToPier = Math.abs(boatRight - pierLeftBound);
            if (distToPier < 80) {
              stateRef.current.inBoat = false;
              stateRef.current.playerX = pierLeftBound + 20;
              stateRef.current.facingLeft = true;
              syncUI();
            }
          }
        } else if (stateRef.current.nearBoat) {
          stateRef.current.showBoatPrompt = true;
          syncUI();
        } else if (stateRef.current.nearHut) {
          stateRef.current.gameState = "store";
          stateRef.current.storeTab = "rod";
          syncUI();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === " ") stateRef.current.activeReelHeld = false;
      stateRef.current.keysDown.delete(e.key.toLowerCase());
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const PIER_Y_RATIO = 0.38;
    const WATER_START_RATIO = 0.42;
    const FISHERMAN_X_RATIO = 0.45;

    const getImg = (src: string) => imagesRef.current.get(src);

    const drawSprite = (src: string, frameIndex: number, totalFrames: number, x: number, y: number, scale: number, flipX = false, tint: string | null = null) => {
      const img = getImg(src);
      if (!img || !img.complete) return;
      const fw = img.width / totalFrames;
      const fh = img.height;
      ctx.save();
      if (flipX) {
        ctx.translate(x + fw * scale, y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, frameIndex * fw, 0, fw, fh, 0, 0, fw * scale, fh * scale);
        if (tint) {
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = tint;
          ctx.fillRect(0, 0, fw * scale, fh * scale);
          ctx.globalCompositeOperation = "source-over";
        }
      } else {
        ctx.drawImage(img, frameIndex * fw, 0, fw, fh, x, y, fw * scale, fh * scale);
        if (tint) {
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = tint;
          ctx.fillRect(x, y, fw * scale, fh * scale);
          ctx.globalCompositeOperation = "source-over";
        }
      }
      ctx.restore();
    };

    const drawImage = (src: string, x: number, y: number, scale: number) => {
      const img = getImg(src);
      if (!img || !img.complete) return;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };

    const drawStar = (ctx2: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number) => {
      ctx2.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r2 = i % 2 === 0 ? outerR : innerR;
        const sx = cx + Math.cos(angle) * r2;
        const sy = cy + Math.sin(angle) * r2;
        if (i === 0) ctx2.moveTo(sx, sy);
        else ctx2.lineTo(sx, sy);
      }
      ctx2.closePath();
      ctx2.fill();
    };

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    let lastTime = 0;
    const s = stateRef.current;

    const gameLoop = (timestamp: number) => {
      const rawDt = Math.min((timestamp - lastTime) / 16.67, 3);
      const dt = s.gamePaused ? 0 : rawDt;
      lastTime = timestamp;

      const inGameMode = s.gameState !== "intro" && s.gameState !== "title" && s.gameState !== "charSelect";
      if (bgmRef.current) {
        if (inGameMode && bgmRef.current.paused) {
          bgmRef.current.play().catch(() => {});
        } else if (!inGameMode && !bgmRef.current.paused) {
          bgmRef.current.pause();
          bgmRef.current.currentTime = 0;
        }
      }

      const W = canvas.width;
      const H = canvas.height;
      const pierY = H * PIER_Y_RATIO;
      const waterY = H * WATER_START_RATIO;
      const defaultFishermanX = W * FISHERMAN_X_RATIO;

      if (s.playerX === 0) s.playerX = defaultFishermanX;

      if (s.worldObjects[0].x === 0 && s.worldObjects[0].y === 0) {
        const initObjY = pierY - 2;
        const initHutX = W * 0.85;
        const initHutW = 192 * 2.2;
        s.worldObjects[0].x = defaultFishermanX + 160; s.worldObjects[0].y = initObjY - 25 * 2.2;
        s.worldObjects[1].x = defaultFishermanX + 210; s.worldObjects[1].y = initObjY - 11 * 2.2;
        s.worldObjects[2].x = defaultFishermanX + 245; s.worldObjects[2].y = initObjY - 15 * 2.2;
        s.worldObjects[3].x = defaultFishermanX + 290; s.worldObjects[3].y = initObjY - 26 * 2;
        s.worldObjects[4].x = defaultFishermanX + 320; s.worldObjects[4].y = initObjY - 15 * 2.2;
        s.worldObjects[5].x = initHutX - 15; s.worldObjects[5].y = initObjY - 33 * 1.8 + 5;
        s.worldObjects[6].x = initHutX + 30; s.worldObjects[6].y = initObjY - 24 * 1.5 + 3;
        s.worldObjects[7].x = initHutX + initHutW - 20; s.worldObjects[7].y = initObjY - 25 * 1.6 + 3;
        s.worldObjects[8].x = initHutX + initHutW + 5; s.worldObjects[8].y = initObjY - 23 * 1.4 + 2;
      }

      if (!s.plantsInitialized) {
        s.underwaterPlants = generateUnderwaterPlants(W, H, waterY, defaultFishermanX);
        s.plantsInitialized = true;
      }

      s.time += dt;
      s.waterOffset += 0.12 * dt;

      const dayAngle = (s.time * 0.0000582) % (Math.PI * 2);
      const rawDayPhase = dayAngle / (Math.PI * 2);
      const dayPhaseFull = rawDayPhase < 0.733 ? 
        0.5 + 0.5 * Math.sin(rawDayPhase / 0.733 * Math.PI) : 
        0.5 - 0.5 * Math.sin((rawDayPhase - 0.733) / 0.267 * Math.PI);

      s.billboardTimer += dt;
      if (s.billboardTimer > 400) {
        s.billboardTimer = 0;
        s.billboardSlide = (s.billboardSlide + 1) % 7;
      }
      s.billboardLeaderboardTimer += dt;
      if (s.billboardLeaderboardTimer > 1800) {
        s.billboardLeaderboardTimer = 0;
        fetch("/api/leaderboard/biggest_catch?limit=5")
          .then(r => { if (!r.ok) throw new Error(); return r.json(); })
          .then(data => { if (Array.isArray(data)) stateRef.current.billboardLeaderboard = data; })
          .catch(() => {});
      }

      const WALK_SPEED = 2.5;
      const SWIM_SPEED = 2.0;
      const pierLeftBound = defaultFishermanX - 80;

      if ((s.gameState === "idle" || s.gameState === "casting") && !s.inBoat && !s.binoculars) {
        let moving = false;
        if (s.keysDown.has("a")) {
          s.playerX -= WALK_SPEED * dt;
          s.facingLeft = true;
          moving = true;
        }
        if (s.keysDown.has("d")) {
          s.playerX += WALK_SPEED * dt;
          s.facingLeft = false;
          moving = true;
        }
        s.playerX = Math.max(pierLeftBound, Math.min(W * 4.8, s.playerX));

        const hutCheckX = W * 0.85 + (192 * 2.2) / 2;
        s.nearHut = !s.inBoat && Math.abs(s.playerX - hutCheckX) < 80 && s.gameState === "idle";

        s.nearNpc = -1;

        if (s.gameState === "casting") {
          s.aimX = Math.max(10, Math.min(W - 10, s.mouseX - s.cameraX));
          s.aimY = Math.max(waterY + 20, Math.min(H - 40, s.mouseY));
        }

        if (s.keysDown.has(" ") && s.gameState === "idle" && !s.inBoat) {
          s.keysDown.delete(" ");
          s.gameState = "swimming";
          s.isSwimming = true;
          s.swimX = s.playerX;
          s.swimY = pierY - FRAME_H * SCALE * 0.5 + 12;
          s.playerVY = 0;
          s.jumpVY = -4.5;
          s.jumpArc = 0;
          s.jumpPeakReached = false;
          s.splashDone = false;
          s.swimAngle = 0;
          s.swimAngleTarget = 0;
          syncUI();
        }
        if (s.keysDown.has(" ") && s.inBoat && s.gameState === "idle") {
          s.keysDown.delete(" ");
          s.boatStanding = !s.boatStanding;
        }
      }

      if (s.gameState === "reeling" && !s.inBoat) {
        const REEL_WALK_SPEED = 1.8;
        if (s.keysDown.has("a")) {
          s.playerX -= REEL_WALK_SPEED * dt;
        }
        if (s.keysDown.has("d")) {
          s.playerX += REEL_WALK_SPEED * dt;
        }
        s.playerX = Math.max(pierLeftBound, Math.min(W * 4.8, s.playerX));
      }

      if (s.gameState === "swimming") {
        if (s.jumpVY !== 0) {
          s.jumpArc += dt;
          const horizDir = s.facingLeft ? -1 : 1;
          s.swimX += horizDir * 2.2 * dt;
          s.swimY += s.jumpVY * dt;
          s.jumpVY += 0.18 * dt;
          if (s.jumpVY > 0 && !s.jumpPeakReached) {
            s.jumpPeakReached = true;
          }
          if (s.swimY >= waterY + 10) {
            s.swimY = waterY + 10;
            s.jumpVY = 0;
            s.jumpArc = 0;
            if (!s.splashDone) {
              addParticles(s.swimX, waterY, 25, "#5dade2", 5, "splash");
              addParticles(s.swimX - 15, waterY - 5, 8, "#88ccff", 3, "bubble");
              addParticles(s.swimX + 15, waterY - 5, 8, "#88ccff", 3, "bubble");
              addRipple(s.swimX, waterY, 50);
              s.screenShake = 4;
              s.splashDone = true;
            }
          }
        } else {
          if (s.keysDown.has("a")) { s.swimX -= SWIM_SPEED * dt; s.facingLeft = true; }
          if (s.keysDown.has("d")) { s.swimX += SWIM_SPEED * dt; s.facingLeft = false; }
          if (s.keysDown.has("w")) { s.swimY -= SWIM_SPEED * 0.7 * dt; }
          if (s.keysDown.has("s")) { s.swimY += SWIM_SPEED * 0.7 * dt; }

          s.swimX = Math.max(-(W * 3), Math.min(W * 5, s.swimX));
          s.swimY = Math.max(waterY + 5, Math.min(H - 30, s.swimY));

          const dockNearX = s.swimX > pierLeftBound - 40 && s.swimX < W * 4.8;
          const dockNearY = s.swimY < waterY + 60;
          if (s.keysDown.has(" ") && dockNearX && dockNearY) {
            s.keysDown.delete(" ");
            s.gameState = "idle";
            s.isSwimming = false;
            s.swimAngle = 0;
            s.swimAngleTarget = 0;
            s.jumpArc = 0;
            s.jumpPeakReached = false;
            s.playerX = Math.max(pierLeftBound, Math.min(W * 4.8, s.swimX));
            addParticles(s.swimX, waterY, 15, "#5dade2", 3, "splash");
            addRipple(s.swimX, waterY);
            syncUI();
          }
        }
      }

      const boatScale = 2.5;

      if (s.gameState === "boarding") {
        if (s.boardingPhase === 0) {
          const targetX = pierLeftBound - 10;
          const dx = targetX - s.playerX;
          if (Math.abs(dx) > 3) {
            s.playerX += Math.sign(dx) * 2.5 * dt;
            s.facingLeft = dx < 0;
          } else {
            s.boardingPhase = 1;
            s.jumpVY = -6;
            s.boardingTimer = 0;
            s.facingLeft = true;
          }
        } else if (s.boardingPhase === 1) {
          s.boardingTimer += dt;
          s.playerX -= 1.5 * dt;
          s.jumpVY += 0.2 * dt;
          s.playerVY += s.jumpVY * dt;
          if (s.boardingTimer > 18 || s.playerVY > 20) {
            s.boardingPhase = 2;
            s.boardingTimer = 0;
            s.playerVY = 0;
            s.jumpVY = 0;
          }
        } else if (s.boardingPhase === 2) {
          s.boardingTimer += dt;
          if (s.boardingTimer > 15) {
            s.inBoat = true;
            s.boatStanding = false;
            s.boatRowing = false;
            s.gameState = "idle";
            s.playerVY = 0;
            s.jumpVY = 0;
            s.facingLeft = true;
            syncUI();
          }
        }
      }

      const BOAT_SPEED = 2.0;
      const boatMinX = -(W * 3);
      const boatMaxX = pierLeftBound - 74 * boatScale - 30;
      if (s.inBoat && (s.gameState === "idle" || s.gameState === "casting")) {
        const boatMoving = s.keysDown.has("a") || s.keysDown.has("d");
        if (s.keysDown.has("a")) {
          s.boatX -= BOAT_SPEED * dt;
          s.facingLeft = true;
        }
        if (s.keysDown.has("d")) {
          s.boatX += BOAT_SPEED * dt;
          s.facingLeft = false;
        }
        s.boatRowing = boatMoving;
        if (boatMoving) s.boatStanding = false;
        s.boatX = Math.max(boatMinX, Math.min(boatMaxX, s.boatX));
        if (s.gameState === "casting") {
          s.aimX = Math.max(10, Math.min(W - 10, s.mouseX - s.cameraX));
          s.aimY = Math.max(waterY + 20, Math.min(H - 40, s.mouseY));
        }
      }
      if (s.inBoat && s.gameState === "reeling") {
        s.boatRowing = false;
        s.boatStanding = true;
        if (s.keysDown.has("a")) {
          s.boatX -= 1.5 * dt;
        }
        if (s.keysDown.has("d")) {
          s.boatX += 1.5 * dt;
        }
        s.boatX = Math.max(boatMinX, Math.min(boatMaxX, s.boatX));
      }

      // Boat drifts toward nearest fish (gentle 2D physics pull)
      if (s.inBoat && s.gameState === "idle" && !s.keysDown.has("a") && !s.keysDown.has("d")) {
        const boatCX = s.boatX + (74 * boatScale) / 2;
        let nearestDist = Infinity;
        let nearestX = boatCX;
        for (const fish of s.swimmingFish) {
          const dx = fish.x - boatCX;
          const dist = Math.abs(dx);
          if (dist < nearestDist && dist < 400) {
            nearestDist = dist;
            nearestX = fish.x;
          }
        }
        if (nearestDist < 400 && nearestDist > 20) {
          const driftForce = 0.15 * dt * Math.sign(nearestX - boatCX) * Math.min(1, 80 / nearestDist);
          s.boatX += driftForce;
          s.boatX = Math.max(boatMinX, Math.min(boatMaxX, s.boatX));
        }
      }

      const hookInWater = s.gameState === "waiting" || s.gameState === "bite" || s.gameState === "reeling";
      const nearBoatDist = Math.abs(s.playerX - pierLeftBound);
      s.nearBoat = nearBoatDist < 30 && !hookInWater && s.gameState === "idle" && !s.isSwimming && !s.inBoat;
      if (!s.nearBoat && s.showBoatPrompt) {
        s.showBoatPrompt = false;
      }

      const boatBobVal = Math.sin(s.time * 0.025) * 2;
      const boatDeckY = waterY - 10 * boatScale + boatBobVal + 4 * boatScale;
      let fishermanX: number;
      let fishermanY: number;
      if (s.isSwimming) {
        fishermanX = s.swimX;
        fishermanY = s.swimY - FRAME_H * SCALE * 0.5;
      } else if (s.inBoat) {
        const boatW = 74 * boatScale;
        fishermanX = s.boatX + boatW / 2 - (FRAME_H * SCALE) / 2;
        fishermanY = boatDeckY - FRAME_H * SCALE + 12;
        s.playerX = fishermanX;
      } else if (s.gameState === "boarding") {
        fishermanX = s.playerX;
        if (s.boardingPhase === 1) {
          fishermanY = pierY - FRAME_H * SCALE + 12 - s.playerVY;
        } else if (s.boardingPhase === 2) {
          const boatW = 74 * boatScale;
          fishermanY = boatDeckY - FRAME_H * SCALE + 12;
          s.playerX = s.boatX + boatW / 2 - (FRAME_H * SCALE) / 2;
          fishermanX = s.playerX;
        } else {
          fishermanY = pierY - FRAME_H * SCALE + 12;
        }
      } else {
        fishermanX = s.playerX;
        fishermanY = pierY - FRAME_H * SCALE + 12;
      }

      ctx.imageSmoothingEnabled = false;

      const calcWorldRight = W * 5 + 200;
      const calcWorldLeft = -(W * 3) - 200;
      let targetCameraX = 0;

      if (s.binoculars) {
        const BINO_SPEED = 4;
        if (s.keysDown.has("a")) s.binoTargetX -= BINO_SPEED * dt;
        if (s.keysDown.has("d")) s.binoTargetX += BINO_SPEED * dt;
        if (s.keysDown.has("w")) s.binoTargetY -= BINO_SPEED * dt;
        if (s.keysDown.has("s")) s.binoTargetY += BINO_SPEED * dt;
        s.binoTargetX = Math.max(calcWorldLeft, Math.min(calcWorldRight, s.binoTargetX));
        s.binoTargetY = Math.max(-H * 0.5, Math.min(H * 1.5, s.binoTargetY));
        s.binoX += (s.binoTargetX - s.binoX) * Math.min(1, 0.08 * dt);
        s.binoY += (s.binoTargetY - s.binoY) * Math.min(1, 0.08 * dt);
        targetCameraX = W / 2 - s.binoX;
        const targetCameraY = H / 2 - s.binoY;
        s.cameraY += (targetCameraY - s.cameraY) * Math.min(1, 0.08 * dt);
      } else if (s.inBoat || s.gameState === "boarding") {
        const boatCenterX = s.boatX + (74 * boatScale) / 2;
        targetCameraX = W / 2 - boatCenterX;
        s.cameraY += (0 - s.cameraY) * Math.min(1, 0.06 * dt);
      } else if (s.isSwimming) {
        targetCameraX = W / 2 - s.swimX;
        s.cameraY += (0 - s.cameraY) * Math.min(1, 0.06 * dt);
      } else {
        targetCameraX = W / 2 - s.playerX;
        s.cameraY += (0 - s.cameraY) * Math.min(1, 0.06 * dt);
      }
      if (Math.abs(s.cameraY) < 0.5) s.cameraY = 0;
      targetCameraX = Math.max(-(calcWorldRight - W), Math.min(-calcWorldLeft, targetCameraX));
      s.cameraX += (targetCameraX - s.cameraX) * Math.min(1, s.binoculars ? 0.08 * dt : 0.04 * dt);
      if (Math.abs(s.cameraX - targetCameraX) < 0.5) s.cameraX = targetCameraX;

      // Swim angle: tilt character based on vertical movement
      if (s.gameState === "swimming" && s.jumpVY === 0) {
        const movingUp = s.keysDown.has("w");
        const movingDown = s.keysDown.has("s");
        const movingHoriz = s.keysDown.has("a") || s.keysDown.has("d");
        if (movingUp && !movingDown) {
          s.swimAngleTarget = movingHoriz ? -0.35 : -0.55;
        } else if (movingDown && !movingUp) {
          s.swimAngleTarget = movingHoriz ? 0.35 : 0.55;
        } else {
          s.swimAngleTarget = 0;
        }
      } else if (s.gameState === "swimming" && s.jumpVY !== 0) {
        s.swimAngleTarget = Math.max(-1.2, Math.min(1.2, s.jumpVY * 0.15));
      } else {
        s.swimAngleTarget = 0;
      }
      s.swimAngle += (s.swimAngleTarget - s.swimAngle) * Math.min(1, 0.12 * dt);

      ctx.save();
      if (s.screenShake > 0) {
        s.screenShake -= dt;
        const shakeX = (Math.random() - 0.5) * s.screenShake * 2;
        const shakeY = (Math.random() - 0.5) * s.screenShake * 2;
        ctx.translate(shakeX, shakeY);
      }

      // === WEATHER & CELESTIAL UPDATE ===
      s.weatherTimer -= dt;
      if (s.weatherTimer <= 0) {
        const weathers: typeof s.weather[] = ["clear", "clear", "clear", "cloudy", "cloudy", "rain", "storm", "fog"];
        const prev = s.weather;
        s.weather = weathers[Math.floor(Math.random() * weathers.length)];
        if (s.weather !== prev) s.weatherTransition = 0;
        s.weatherTimer = 3600 + Math.random() * 7200;
      }
      const currentDayNight = dayPhaseFull > 0.5 ? "day" : "night";
      if (currentDayNight !== s.lastDayNight) {
        s.lastDayNight = currentDayNight;
        if (s.celestialEvent === "none" && Math.random() < (1/30)) {
          const nightEvents = ["green_moon", "blood_moon"] as ("none" | "red_sun" | "green_moon" | "tentacle_sun" | "blood_moon")[];
          const dayEvents = ["red_sun", "tentacle_sun"] as ("none" | "red_sun" | "green_moon" | "tentacle_sun" | "blood_moon")[];
          const events = currentDayNight === "day" ? dayEvents : nightEvents;
          s.celestialEvent = events[Math.floor(Math.random() * events.length)] ?? "none";
          s.celestialTimer = 800 + Math.random() * 600;
          s.celestialFade = 0;
        }
      }
      s.weatherTransition = Math.min(1, s.weatherTransition + 0.002 * dt);
      if (s.celestialEvent !== "none") {
        s.celestialTimer -= dt;
        s.celestialFade = s.celestialTimer > 100 ? Math.min(1, s.celestialFade + 0.005 * dt) : Math.max(0, s.celestialFade - 0.008 * dt);
        if (s.celestialTimer <= 0) { s.celestialEvent = "none"; s.celestialFade = 0; }
      }
      s.windTarget += (Math.random() - 0.5) * 0.01 * dt;
      s.windTarget = Math.max(-1.5, Math.min(1.5, s.windTarget));
      s.windSpeed += (s.windTarget - s.windSpeed) * 0.01 * dt;
      if (s.weather === "storm") s.windSpeed = Math.max(Math.abs(s.windSpeed), 0.8) * Math.sign(s.windSpeed || 1);
      s.auroraPhase += 0.003 * dt;
      if (s.lightningFlash > 0) s.lightningFlash -= 0.05 * dt;
      if (s.weather === "storm" && Math.random() < 0.003 * dt) { s.lightningFlash = 1; s.lightningTimer = 3; }

      for (const bird of s.bgBirds) {
        bird.x += bird.speed * dt + s.windSpeed * 0.3 * dt;
        bird.wingPhase += 0.08 * dt;
        if (bird.x > W + 100) { bird.x = -60; bird.y = 25 + Math.random() * 70; }
        if (bird.x < -100) { bird.x = W + 60; bird.y = 25 + Math.random() * 70; }
      }
      for (const ship of s.bgShips) {
        ship.x += ship.speed * dt;
        if (ship.x > W + 300) { ship.x = -250; ship.size = 0.4 + Math.random() * 0.5; ship.type = Math.floor(Math.random() * 3); }
      }
      if (Math.random() < 0.002 * dt && s.shootingStars.length < 3) {
        s.shootingStars.push({ x: Math.random() * W, y: Math.random() * waterY * 0.3, vx: 3 + Math.random() * 4, vy: 1.5 + Math.random() * 2, life: 40, trail: [] });
      }
      for (let i = s.shootingStars.length - 1; i >= 0; i--) {
        const ss = s.shootingStars[i];
        ss.trail.push(ss.x, ss.y);
        if (ss.trail.length > 20) ss.trail.splice(0, 2);
        ss.x += ss.vx * dt; ss.y += ss.vy * dt; ss.life -= dt;
        if (ss.life <= 0) s.shootingStars.splice(i, 1);
      }

      // Sky gradient - day/night cycle
      const dayPhase = dayPhaseFull;
      let skyR = Math.floor(30 + dayPhase * 105);
      let skyG = Math.floor(30 + dayPhase * 176);
      let skyB = Math.floor(62 + dayPhase * 173);
      const isStormy = s.weather === "storm" || s.weather === "rain";
      const stormDarken = isStormy ? s.weatherTransition * 0.4 : 0;
      const fogBrighten = s.weather === "fog" ? s.weatherTransition * 0.15 : 0;
      skyR = Math.floor(skyR * (1 - stormDarken) + skyR * fogBrighten * 0.3);
      skyG = Math.floor(skyG * (1 - stormDarken) + skyG * fogBrighten * 0.3);
      skyB = Math.floor(skyB * (1 - stormDarken * 0.6) + skyB * fogBrighten * 0.2);
      if (s.celestialEvent === "red_sun" && dayPhase > 0.5) {
        const cf = s.celestialFade * 0.5;
        skyR = Math.floor(skyR + (180 - skyR) * cf); skyG = Math.floor(skyG * (1 - cf * 0.4)); skyB = Math.floor(skyB * (1 - cf * 0.5));
      } else if (s.celestialEvent === "green_moon" && dayPhase <= 0.5) {
        const cf = s.celestialFade * 0.4;
        skyG = Math.floor(skyG + (80 - skyG) * cf); skyR = Math.floor(skyR * (1 - cf * 0.3)); skyB = Math.floor(skyB + (40 - skyB) * cf * 0.3);
      } else if (s.celestialEvent === "blood_moon" && dayPhase <= 0.5) {
        const cf = s.celestialFade * 0.4;
        skyR = Math.floor(skyR + (90 - skyR) * cf); skyG = Math.floor(skyG * (1 - cf * 0.5)); skyB = Math.floor(skyB * (1 - cf * 0.4));
      } else if (s.celestialEvent === "tentacle_sun" && dayPhase > 0.5) {
        const cf = s.celestialFade * 0.3;
        skyR = Math.floor(skyR + (60 - skyR) * cf); skyG = Math.floor(skyG * (1 - cf * 0.2)); skyB = Math.floor(skyB + (80 - skyB) * cf);
      }
      const skyGrad = ctx.createLinearGradient(0, 0, 0, waterY);
      skyGrad.addColorStop(0, `rgb(${skyR},${skyG},${skyB})`);
      skyGrad.addColorStop(0.4, `rgb(${Math.min(255, skyR + 20)},${Math.min(255, skyG + 15)},${Math.min(255, skyB + 10)})`);
      skyGrad.addColorStop(0.7, `rgb(${Math.min(255, skyR + 50)},${Math.min(255, skyG + 35)},${Math.min(255, skyB + 20)})`);
      skyGrad.addColorStop(1, `rgb(${Math.min(255, skyR + 80)},${Math.min(255, skyG + 50)},${Math.min(255, skyB + 30)})`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, waterY + 5);

      // Stars (visible when dark)
      if (dayPhase < 0.4 && !isStormy) {
        const starAlpha = (0.4 - dayPhase) / 0.4;
        for (const star of s.stars) {
          const twinkle = Math.sin(s.time * 0.05 + star.twinkle) * 0.5 + 0.5;
          ctx.globalAlpha = starAlpha * twinkle * (s.weather === "cloudy" ? 0.4 : 1);
          ctx.fillStyle = s.celestialEvent === "green_moon" ? `hsl(${120 + Math.sin(star.twinkle) * 30}, 80%, 80%)` :
            s.celestialEvent === "blood_moon" ? `hsl(${0 + Math.sin(star.twinkle) * 15}, 70%, 75%)` : "#ffffff";
          ctx.fillRect(star.x * W, star.y * H, star.size, star.size);
        }
        ctx.globalAlpha = 1;
      }

      // Shooting stars
      for (const ss of s.shootingStars) {
        if (dayPhase >= 0.4) continue;
        const alpha = Math.min(1, ss.life / 10) * ((0.4 - dayPhase) / 0.4);
        for (let t = 0; t < ss.trail.length - 2; t += 2) {
          ctx.globalAlpha = alpha * (t / ss.trail.length) * 0.6;
          ctx.fillStyle = "#ffffcc";
          ctx.fillRect(ss.trail[t], ss.trail[t + 1], 2, 1);
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#ffffee";
        ctx.fillRect(ss.x, ss.y, 3, 2);
        ctx.globalAlpha = 1;
      }

      // Aurora borealis (appears during green_moon or blood_moon)
      if ((s.celestialEvent === "green_moon" || s.celestialEvent === "blood_moon") && dayPhase < 0.4) {
        const auroraAlpha = s.celestialFade * 0.25 * ((0.4 - dayPhase) / 0.4);
        for (let band = 0; band < 5; band++) {
          ctx.globalAlpha = auroraAlpha * (0.6 + Math.sin(s.auroraPhase + band * 0.8) * 0.4);
          const baseHue = s.celestialEvent === "green_moon" ? 120 : 340;
          const hue = baseHue + band * 15 + Math.sin(s.auroraPhase * 0.7 + band) * 20;
          const bandY = 30 + band * 18 + Math.sin(s.auroraPhase + band * 1.5) * 10;
          const aGrad = ctx.createLinearGradient(0, bandY - 15, 0, bandY + 20);
          aGrad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
          aGrad.addColorStop(0.5, `hsla(${hue}, 80%, 60%, 0.6)`);
          aGrad.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
          ctx.fillStyle = aGrad;
          ctx.beginPath();
          ctx.moveTo(0, bandY - 15);
          for (let x = 0; x <= W; x += 10) {
            const wave = Math.sin(x * 0.008 + s.auroraPhase * 2 + band * 0.5) * 12 + Math.sin(x * 0.015 + s.auroraPhase) * 6;
            ctx.lineTo(x, bandY + wave);
          }
          ctx.lineTo(W, bandY + 30); ctx.lineTo(0, bandY + 30);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // === CELESTIAL BODIES ===
      const sunX = W * 0.82;
      const sunY = 45 + dayPhase * 35;
      const ceF = s.celestialFade;

      if (dayPhase > 0.5) {
        if (s.celestialEvent === "red_sun" && ceF > 0) {
          const pulse = Math.sin(s.time * 0.03) * 0.3 + 0.7;
          ctx.shadowColor = `rgba(255,40,20,${ceF * pulse})`;
          ctx.shadowBlur = 60 + pulse * 30;
          ctx.fillStyle = `rgb(${200 + Math.floor(55 * pulse)},${Math.floor(40 * (1 - ceF * 0.5))},${Math.floor(20 * (1 - ceF * 0.7))})`;
          ctx.beginPath(); ctx.arc(sunX, sunY, 28, 0, Math.PI * 2); ctx.fill();
          ctx.shadowColor = `rgba(255,80,0,${ceF * 0.5})`;
          ctx.shadowBlur = 40;
          for (let ray = 0; ray < 8; ray++) {
            const angle = (ray / 8) * Math.PI * 2 + s.time * 0.01;
            const rLen = 12 + Math.sin(s.time * 0.05 + ray) * 8;
            ctx.fillStyle = `rgba(255,${60 + Math.floor(Math.sin(s.time * 0.04 + ray * 0.7) * 40)},0,${ceF * 0.7})`;
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(angle) * 30, sunY + Math.sin(angle) * 30);
            ctx.lineTo(sunX + Math.cos(angle - 0.15) * (30 + rLen), sunY + Math.sin(angle - 0.15) * (30 + rLen));
            ctx.lineTo(sunX + Math.cos(angle + 0.15) * (30 + rLen), sunY + Math.sin(angle + 0.15) * (30 + rLen));
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        } else if (s.celestialEvent === "tentacle_sun" && ceF > 0) {
          const pulse = Math.sin(s.time * 0.02) * 0.2 + 0.8;
          ctx.shadowColor = `rgba(120,0,200,${ceF * pulse * 0.8})`;
          ctx.shadowBlur = 50 + pulse * 20;
          const grad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30);
          grad.addColorStop(0, `rgba(200,150,255,${ceF})`);
          grad.addColorStop(0.5, `rgba(140,40,200,${ceF * 0.9})`);
          grad.addColorStop(1, `rgba(80,0,120,${ceF * 0.6})`);
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(sunX, sunY, 26, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(30,0,40,${ceF * 0.8})`;
          ctx.beginPath(); ctx.arc(sunX, sunY, 10, 0, Math.PI * 2); ctx.fill();
          for (let t = 0; t < 6; t++) {
            const baseA = (t / 6) * Math.PI * 2 + s.time * 0.008;
            ctx.strokeStyle = `rgba(${140 + Math.floor(Math.sin(s.time * 0.03 + t) * 60)},${30 + Math.floor(Math.sin(s.time * 0.02 + t * 2) * 30)},${180 + Math.floor(Math.sin(s.time * 0.04 + t * 0.5) * 60)},${ceF * 0.7})`;
            ctx.lineWidth = 2 + Math.sin(s.time * 0.05 + t) * 1;
            ctx.beginPath();
            let tx = sunX + Math.cos(baseA) * 28;
            let ty = sunY + Math.sin(baseA) * 28;
            ctx.moveTo(tx, ty);
            for (let seg = 0; seg < 8; seg++) {
              const segA = baseA + Math.sin(s.time * 0.015 + t * 0.8 + seg * 0.3) * 0.6;
              const segLen = 6 + Math.sin(s.time * 0.02 + seg + t) * 2;
              tx += Math.cos(segA) * segLen; ty += Math.sin(segA) * segLen;
              ctx.lineTo(tx, ty);
            }
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1;
        } else {
          ctx.fillStyle = "#f39c12";
          ctx.shadowColor = "#f39c12";
          ctx.shadowBlur = 40 - (isStormy ? 20 * s.weatherTransition : 0);
          ctx.beginPath(); ctx.arc(sunX, sunY, 25, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else {
        const moonY = sunY + 20;
        if (s.celestialEvent === "green_moon" && ceF > 0) {
          const pulse = Math.sin(s.time * 0.025) * 0.3 + 0.7;
          ctx.shadowColor = `rgba(0,255,100,${ceF * pulse * 0.8})`;
          ctx.shadowBlur = 50 + pulse * 25;
          const mGrad = ctx.createRadialGradient(sunX, moonY, 0, sunX, moonY, 22);
          mGrad.addColorStop(0, `rgba(180,255,200,${ceF})`);
          mGrad.addColorStop(0.4, `rgba(80,220,120,${ceF * 0.9})`);
          mGrad.addColorStop(1, `rgba(20,160,60,${ceF * 0.7})`);
          ctx.fillStyle = mGrad;
          ctx.beginPath(); ctx.arc(sunX, moonY, 20, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(40,100,50,${ceF * 0.4})`;
          ctx.beginPath(); ctx.arc(sunX - 5, moonY - 4, 5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sunX + 6, moonY + 3, 3, 0, Math.PI * 2); ctx.fill();
          for (let sp = 0; sp < 12; sp++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 22 + Math.random() * 15;
            ctx.globalAlpha = ceF * 0.5 * Math.random();
            ctx.fillStyle = `hsl(${120 + Math.random() * 40}, 80%, 70%)`;
            ctx.fillRect(sunX + Math.cos(angle) * dist, moonY + Math.sin(angle) * dist, 2, 2);
          }
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        } else if (s.celestialEvent === "blood_moon" && ceF > 0) {
          const pulse = Math.sin(s.time * 0.02) * 0.25 + 0.75;
          ctx.shadowColor = `rgba(200,30,30,${ceF * pulse})`;
          ctx.shadowBlur = 45 + pulse * 20;
          const mGrad = ctx.createRadialGradient(sunX, moonY, 0, sunX, moonY, 20);
          mGrad.addColorStop(0, `rgba(220,80,60,${ceF})`);
          mGrad.addColorStop(0.6, `rgba(160,20,20,${ceF * 0.9})`);
          mGrad.addColorStop(1, `rgba(100,10,10,${ceF * 0.6})`);
          ctx.fillStyle = mGrad;
          ctx.beginPath(); ctx.arc(sunX, moonY, 20, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(80,0,0,${ceF * 0.3})`;
          ctx.beginPath(); ctx.arc(sunX - 4, moonY - 3, 4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sunX + 5, moonY + 4, 3, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          const stormFade = isStormy ? 1 - s.weatherTransition * 0.7 : 1;
          ctx.fillStyle = "#ecf0f1";
          ctx.shadowColor = "#bdc3c7";
          ctx.shadowBlur = 20 * stormFade;
          ctx.globalAlpha = stormFade;
          ctx.beginPath(); ctx.arc(sunX, moonY, 18, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      // === CLOUDS (weather-responsive) ===
      const cloudCount = s.weather === "clear" ? 4 : s.weather === "cloudy" ? 8 : s.weather === "fog" ? 10 : isStormy ? 12 : 6;
      const cloudAlphaBase = s.weather === "clear" ? 0.2 : s.weather === "cloudy" ? 0.5 : s.weather === "fog" ? 0.6 : 0.7;
      const cloudDrift = s.windSpeed * 0.1;
      const cloudBaseAlpha = (cloudAlphaBase + dayPhase * 0.1) * s.weatherTransition + (0.25 + dayPhase * 0.15) * (1 - s.weatherTransition);
      for (let i = 0; i < cloudCount; i++) {
        const cx = ((s.time * (0.02 + cloudDrift) + i * (W / cloudCount) * 1.3) % (W + 350)) - 175;
        const cy = 35 + (i % 5) * 28 + Math.sin(s.time * 0.006 + i * 1.7) * 5;
        const cScale = 0.8 + (i % 3) * 0.2;
        ctx.fillStyle = isStormy ? `rgb(${70 + dayPhase * 30},${75 + dayPhase * 30},${85 + dayPhase * 30})` :
          dayPhase > 0.5 ? "#ffffff" : "#8899aa";
        ctx.globalAlpha = cloudBaseAlpha;
        ctx.beginPath(); ctx.ellipse(cx, cy, (50 + i * 6) * cScale, (14 + i * 2) * cScale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 35 * cScale, cy - 4 * cScale, (35 + i * 4) * cScale, (10 + i) * cScale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - 20 * cScale, cy + 2 * cScale, (30 + i * 3) * cScale, (10 + i * 0.5) * cScale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = cloudBaseAlpha * 0.3;
        ctx.beginPath(); ctx.ellipse(cx, cy, (55 + i * 7) * cScale, (18 + i * 3) * cScale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 40 * cScale, cy - 2 * cScale, (40 + i * 5) * cScale, (14 + i * 2) * cScale, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // === RAIN & STORM EFFECTS ===
      if ((s.weather === "rain" || s.weather === "storm") && s.weatherTransition > 0.3) {
        const rainAlpha = s.weatherTransition * (s.weather === "storm" ? 0.5 : 0.3);
        ctx.strokeStyle = `rgba(170,190,220,${rainAlpha})`;
        ctx.lineWidth = 1;
        const dropCount = s.weather === "storm" ? 200 : 120;
        for (let i = 0; i < Math.min(dropCount, s.rainDrops.length); i++) {
          const drop = s.rainDrops[i];
          drop.y += drop.speed * dt;
          drop.x += s.windSpeed * 2 * dt;
          if (drop.y > waterY) { drop.y = -10 - Math.random() * 20; drop.x = Math.random() * W; }
          if (drop.x > W + 20) drop.x = -10;
          if (drop.x < -20) drop.x = W + 10;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + s.windSpeed * 2, drop.y + drop.length);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      }

      // === FOG EFFECT ===
      if (s.weather === "fog" && s.weatherTransition > 0.2) {
        const fogAlpha = s.weatherTransition * 0.35;
        const fogGrad = ctx.createLinearGradient(0, waterY * 0.3, 0, waterY + 30);
        fogGrad.addColorStop(0, `rgba(180,190,200,${fogAlpha * 0.3})`);
        fogGrad.addColorStop(0.5, `rgba(180,190,200,${fogAlpha})`);
        fogGrad.addColorStop(1, `rgba(180,190,200,${fogAlpha * 0.5})`);
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, W, waterY + 30);
        for (let i = 0; i < 4; i++) {
          const fx = ((s.time * 0.08 + i * 400) % (W + 500)) - 250;
          const fy = waterY * 0.6 + i * 20 + Math.sin(s.time * 0.004 + i) * 8;
          ctx.globalAlpha = fogAlpha * 0.5;
          ctx.fillStyle = `rgba(200,210,220,0.4)`;
          ctx.beginPath(); ctx.ellipse(fx, fy, 120, 25, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(fx + 80, fy + 5, 90, 20, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // === FAR BACKGROUND: MOUNTAINS (parallax 20%) ===
      const hillParallax = s.cameraX * 0.2;
      const hillR = Math.floor(40 + dayPhase * 60 - (isStormy ? 15 * s.weatherTransition : 0));
      const hillG = Math.floor(50 + dayPhase * 80 - (isStormy ? 20 * s.weatherTransition : 0));
      const hillB = Math.floor(60 + dayPhase * 80 - (isStormy ? 10 * s.weatherTransition : 0));
      ctx.fillStyle = `rgba(${hillR}, ${hillG}, ${hillB}, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      for (let x = 0; x <= W; x += 10) {
        const wx = x - hillParallax;
        const hillY = waterY - 25 - Math.sin(wx * 0.003) * 35 - Math.sin(wx * 0.007 + 2) * 18 - Math.sin(wx * 0.012 + 5) * 8;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(W, waterY);
      ctx.fill();
      ctx.fillStyle = `rgba(${hillR + 15}, ${hillG + 10}, ${hillB + 10}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      for (let x = 0; x <= W; x += 10) {
        const wx = x - hillParallax * 0.6;
        const hillY = waterY - 15 - Math.sin(wx * 0.005 + 1) * 22 - Math.sin(wx * 0.009 + 4) * 12;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(W, waterY);
      ctx.fill();

      // === FAR BACKGROUND: DISTANT SHIPS ===
      for (const ship of s.bgShips) {
        const sy = waterY - 8 * ship.size;
        const sz = ship.size;
        ctx.globalAlpha = 0.25 * sz;
        ctx.fillStyle = dayPhase > 0.5 ? `rgba(80,60,40,0.6)` : `rgba(40,40,50,0.5)`;
        ctx.fillRect(ship.x, sy - 6 * sz, 20 * sz, 6 * sz);
        ctx.fillStyle = dayPhase > 0.5 ? `rgba(200,180,160,0.5)` : `rgba(120,120,140,0.4)`;
        if (ship.type === 0) {
          ctx.beginPath();
          ctx.moveTo(ship.x + 10 * sz, sy - 6 * sz);
          ctx.lineTo(ship.x + 10 * sz, sy - 25 * sz);
          ctx.lineTo(ship.x + 22 * sz, sy - 8 * sz);
          ctx.fill();
        } else {
          ctx.fillRect(ship.x + 8 * sz, sy - 20 * sz, 2 * sz, 14 * sz);
          ctx.fillRect(ship.x + 4 * sz, sy - 18 * sz, 10 * sz, 3 * sz);
        }
        ctx.globalAlpha = 1;
      }

      // === FAR BACKGROUND: BIRDS ===
      for (const bird of s.bgBirds) {
        const by = bird.y + Math.sin(bird.wingPhase * 0.5) * 3;
        ctx.strokeStyle = dayPhase > 0.5 ? "rgba(30,30,30,0.4)" : "rgba(150,150,170,0.35)";
        ctx.lineWidth = 1.5;
        const wingUp = Math.sin(bird.wingPhase) * 5;
        ctx.beginPath();
        ctx.moveTo(bird.x - 6, by + wingUp);
        ctx.quadraticCurveTo(bird.x - 3, by + wingUp * 0.3, bird.x, by);
        ctx.quadraticCurveTo(bird.x + 3, by + wingUp * 0.3, bird.x + 6, by + wingUp);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // === CELESTIAL EVENT INDICATOR (subtle hint text) ===
      if (s.celestialEvent !== "none" && s.celestialFade > 0.5 && s.gameState !== "intro" && s.gameState !== "charSelect") {
        const hintAlpha = (s.celestialFade - 0.5) * 0.6;
        const hintMap: Record<string, { text: string; color: string }> = {
          red_sun: { text: "The sun burns crimson...", color: `rgba(255,100,80,${hintAlpha})` },
          green_moon: { text: "An eerie green glow...", color: `rgba(100,255,150,${hintAlpha})` },
          tentacle_sun: { text: "Something writhes in the sky...", color: `rgba(180,100,255,${hintAlpha})` },
          blood_moon: { text: "The moon bleeds red...", color: `rgba(220,60,60,${hintAlpha})` },
        };
        const hint = hintMap[s.celestialEvent];
        if (hint) {
          ctx.font = "italic 11px monospace";
          ctx.fillStyle = hint.color;
          ctx.textAlign = "center";
          ctx.fillText(hint.text, W / 2, 18);
          ctx.textAlign = "start";
        }
      }

      // Lightning flash overlay (renders last to wash out all sky elements)
      if (s.lightningFlash > 0) {
        ctx.fillStyle = `rgba(255,255,240,${s.lightningFlash * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Apply camera offset for all world-space rendering
      ctx.save();
      ctx.translate(s.cameraX, s.cameraY);

      // Water - extends across entire world width
      const worldLeft = -(W * 3) - 200;
      const worldRight = W * 5 + 200;
      const viewL = -s.cameraX;
      const viewR = -s.cameraX + W;
      const waterH = H - waterY;

      // --- ORGANIC WATER SURFACE EDGE (wavy top, no hard line) ---
      const wDeep = dayPhase > 0.5 ? 0 : 20;
      const waterGrad = ctx.createLinearGradient(0, waterY - 8, 0, H);
      waterGrad.addColorStop(0, `rgba(${41 - wDeep},${128 - wDeep * 2},${185 - wDeep},0)`);
      waterGrad.addColorStop(0.02, `rgba(${41 - wDeep},${128 - wDeep * 2},${185 - wDeep},0.45)`);
      waterGrad.addColorStop(0.06, `rgba(${36 - wDeep},${120 - wDeep * 2},${175 - wDeep},0.85)`);
      waterGrad.addColorStop(0.12, `rgb(${30 - wDeep},${115 - wDeep * 2},${168 - wDeep})`);
      waterGrad.addColorStop(0.4, `rgb(${26 - wDeep},${111 - wDeep * 2},${160 - wDeep})`);
      waterGrad.addColorStop(0.7, `rgb(${20 - wDeep},${85 - wDeep * 2},${128 - wDeep})`);
      waterGrad.addColorStop(1, `rgb(${13 - wDeep},${59 - wDeep},${94 - wDeep})`);
      ctx.fillStyle = waterGrad;

      ctx.beginPath();
      ctx.moveTo(worldLeft, waterY - 8);
      for (let x = worldLeft; x <= worldRight; x += 4) {
        const wv = Math.sin((x + s.waterOffset * 2) * 0.02) * 3
                 + Math.sin((x + s.waterOffset * 1.5) * 0.035 + 1.2) * 2
                 + Math.sin((x + s.waterOffset * 3) * 0.008 + 0.5) * 4;
        ctx.lineTo(x, waterY + wv - 6);
      }
      ctx.lineTo(worldRight, H);
      ctx.lineTo(worldLeft, H);
      ctx.closePath();
      ctx.fill();

      // --- UNDERWATER BACKGROUND IMAGE ---
      const uwBgImg = getImg("/assets/underwater_bg.png");
      if (uwBgImg && uwBgImg.complete && uwBgImg.naturalWidth > 0) {
        const bgTileW = uwBgImg.naturalWidth * 0.6;
        const bgTileH = uwBgImg.naturalHeight * 0.6;
        const bgStartX = Math.floor(viewL / bgTileW) * bgTileW;
        ctx.globalAlpha = 0.18;
        ctx.save();
        ctx.filter = "hue-rotate(25deg) saturate(0.7)";
        for (let bx = bgStartX; bx < viewR; bx += bgTileW) {
          ctx.drawImage(uwBgImg, bx, waterY, bgTileW, waterH);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // --- DRAW UNDERWATER PLANTS (behind fish layer) ---
      const plantSheet = getImg("/assets/plants_sheet.png");
      if (plantSheet && plantSheet.complete) {
        for (const plant of s.underwaterPlants) {
          if (plant.inFront) continue;
          const px = plant.worldX;
          if (px < viewL - 200 || px > viewR + 200) continue;
          const pt = PLANT_TYPES[plant.typeIdx];
          const drawW = pt.sw * plant.scale;
          const drawH = pt.sh * plant.scale;
          const sway = Math.sin(s.time * plant.swaySpeed + plant.phase) * plant.swayAmp * plant.scale;
          const drawY = plant.baseY - drawH;
          if (drawY < waterY) continue;
          ctx.save();
          ctx.globalAlpha = 0.85;
          const sliceCount = Math.max(4, Math.min(16, Math.floor(drawH / 8)));
          const sliceH = drawH / sliceCount;
          const srcSliceH = pt.sh / sliceCount;
          for (let sl = 0; sl < sliceCount; sl++) {
            const t = sl / sliceCount;
            const offsetX = sway * t * t;
            ctx.drawImage(
              plantSheet,
              pt.sx, pt.sy + sl * srcSliceH, pt.sw, srcSliceH,
              px - drawW / 2 + offsetX, drawY + sl * sliceH, drawW, sliceH + 1
            );
          }
          ctx.restore();
        }
      }

      // --- CLOUDY MURK LAYER 1: large slow-drifting turbidity blobs ---
      for (let m = 0; m < 18; m++) {
        const seed = m * 137.5 + 42;
        const mx = viewL + ((seed + s.time * 0.06 * (0.5 + (m % 3) * 0.3)) % (W + 200)) - 100;
        const my = waterY + 25 + (m * 53) % Math.max(1, waterH * 0.8);
        const mDepth = (my - waterY) / waterH;
        const mr = 30 + Math.sin(s.time * 0.005 + m * 1.9) * 12 + m * 3;
        const mAlpha = (0.04 + mDepth * 0.03) * (0.7 + Math.sin(s.time * 0.007 + m * 2.1) * 0.3);
        const cg = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
        const murkR = Math.floor(20 + mDepth * 15);
        const murkG = Math.floor(60 + mDepth * 20 - wDeep);
        const murkB = Math.floor(90 + mDepth * 30 - wDeep);
        cg.addColorStop(0, `rgba(${murkR},${murkG},${murkB},${mAlpha})`);
        cg.addColorStop(0.5, `rgba(${murkR},${murkG},${murkB},${mAlpha * 0.4})`);
        cg.addColorStop(1, `rgba(${murkR},${murkG},${murkB},0)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
      }

      // --- CLOUDY MURK LAYER 2: sediment haze bands ---
      for (let band = 0; band < 5; band++) {
        const bandY = waterY + waterH * (0.15 + band * 0.18);
        const bandH = 40 + band * 15;
        const bandAlpha = 0.04 + band * 0.012;
        const bandOff = Math.sin(s.time * 0.004 + band * 1.7) * 15;
        const hazeGrad = ctx.createLinearGradient(0, bandY - bandH / 2 + bandOff, 0, bandY + bandH / 2 + bandOff);
        hazeGrad.addColorStop(0, `rgba(30,70,90,0)`);
        hazeGrad.addColorStop(0.3, `rgba(25,65,85,${bandAlpha})`);
        hazeGrad.addColorStop(0.5, `rgba(20,55,75,${bandAlpha * 1.2})`);
        hazeGrad.addColorStop(0.7, `rgba(25,65,85,${bandAlpha})`);
        hazeGrad.addColorStop(1, `rgba(30,70,90,0)`);
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(viewL, bandY - bandH / 2 + bandOff, W, bandH);
      }

      // --- DEPTH ZONE OVERLAYS with soft cloudy edges ---
      const shopX = W * 0.85;
      const zone2Left = -(W * 1);
      const zone2Right = 0;
      const zone3Left = -(W * 3) - 200;
      const zone3Right = -(W * 1);

      const z2Grad = ctx.createLinearGradient(zone2Right - 200, 0, zone2Right + 80, 0);
      z2Grad.addColorStop(0, `rgba(5,15,40,${0.15 + (1 - dayPhase) * 0.1})`);
      z2Grad.addColorStop(0.85, `rgba(5,15,40,${0.06})`);
      z2Grad.addColorStop(1, "rgba(5,15,40,0)");
      ctx.fillStyle = z2Grad;
      ctx.fillRect(zone2Left, waterY, zone2Right - zone2Left + 80, waterH);

      const z3Grad = ctx.createLinearGradient(zone3Right - 200, 0, zone3Right + 120, 0);
      z3Grad.addColorStop(0, `rgba(3,8,25,${0.3 + (1 - dayPhase) * 0.15})`);
      z3Grad.addColorStop(0.8, `rgba(5,12,30,${0.1})`);
      z3Grad.addColorStop(1, "rgba(5,15,40,0)");
      ctx.fillStyle = z3Grad;
      ctx.fillRect(zone3Left, waterY, zone3Right - zone3Left + 120, waterH);

      // Zone transition murk clouds
      for (let zt = 0; zt < 8; zt++) {
        const ztX = zone2Right + Math.sin(s.time * 0.003 + zt * 2.5) * 60 - 30;
        const ztY = waterY + 20 + (zt * 41) % Math.max(1, waterH * 0.85);
        const ztR = 40 + Math.sin(s.time * 0.006 + zt) * 15;
        const ztA = 0.06 + Math.sin(s.time * 0.008 + zt * 1.3) * 0.02;
        const ztg = ctx.createRadialGradient(ztX, ztY, 0, ztX, ztY, ztR);
        ztg.addColorStop(0, `rgba(8,20,45,${ztA})`);
        ztg.addColorStop(1, "rgba(8,20,45,0)");
        ctx.fillStyle = ztg;
        ctx.beginPath(); ctx.arc(ztX, ztY, ztR, 0, Math.PI * 2); ctx.fill();
      }
      for (let zt = 0; zt < 6; zt++) {
        const ztX = zone3Right + Math.sin(s.time * 0.004 + zt * 3.1) * 80 - 40;
        const ztY = waterY + 15 + (zt * 59) % Math.max(1, waterH * 0.9);
        const ztR = 50 + Math.sin(s.time * 0.005 + zt * 0.9) * 20;
        const ztA = 0.08 + Math.sin(s.time * 0.007 + zt * 1.6) * 0.03;
        const ztg = ctx.createRadialGradient(ztX, ztY, 0, ztX, ztY, ztR);
        ztg.addColorStop(0, `rgba(4,10,28,${ztA})`);
        ztg.addColorStop(1, "rgba(4,10,28,0)");
        ctx.fillStyle = ztg;
        ctx.beginPath(); ctx.arc(ztX, ztY, ztR, 0, Math.PI * 2); ctx.fill();
      }

      // --- WEATHER MURK (cloudy sediment swirls) ---
      if (s.weather !== "clear") {
        const murkyAlpha = s.weatherTransition * (
          s.weather === "storm" ? 0.35 : 
          s.weather === "rain" ? 0.2 : 
          s.weather === "fog" ? 0.25 : 
          s.weather === "cloudy" ? 0.08 : 0
        );
        if (murkyAlpha > 0) {
          for (let mc = 0; mc < 20; mc++) {
            const mcX = viewL + ((mc * 89 + s.time * 0.15) % (W + 120)) - 60;
            const mcY = waterY + 10 + (mc * 37) % Math.max(1, waterH * 0.85);
            const mcR = 25 + Math.sin(s.time * 0.008 + mc * 1.7) * 12 + mc * 2;
            const mcA = murkyAlpha * (0.3 + Math.sin(s.time * 0.01 + mc * 2.3) * 0.15);
            const mcg = ctx.createRadialGradient(mcX, mcY, 0, mcX, mcY, mcR);
            mcg.addColorStop(0, `rgba(75,95,55,${mcA})`);
            mcg.addColorStop(0.4, `rgba(65,80,45,${mcA * 0.5})`);
            mcg.addColorStop(1, "rgba(55,70,35,0)");
            ctx.fillStyle = mcg;
            ctx.beginPath(); ctx.arc(mcX, mcY, mcR, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = murkyAlpha * 0.2;
          for (let sw = 0; sw < 8; sw++) {
            const swX = viewL + ((sw * 117 + s.time * 0.2) % (W + 80)) - 40;
            const swY = waterY + 20 + sw * 22 + Math.sin(s.time * 0.012 + sw * 2.3) * 10;
            const swR = 20 + Math.sin(s.time * 0.01 + sw) * 8;
            ctx.strokeStyle = `rgba(90,110,70,0.25)`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(swX, swY, swR, s.time * 0.015 + sw, s.time * 0.015 + sw + Math.PI * 1.3);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.lineWidth = 1;
        }
      }

      // --- SURFACE FOAM (organic irregular shapes instead of hard line) ---
      for (let i = 0; i < 40; i++) {
        const fx = viewL + ((i * 57.3 + s.waterOffset * 2.5) % (W + 60)) - 30;
        const fWave = Math.sin((fx + s.waterOffset * 2) * 0.02) * 3
                    + Math.sin((fx + s.waterOffset * 1.5) * 0.035 + 1.2) * 2;
        const fy = waterY + fWave - 4 + Math.sin(s.time * 0.025 + i * 1.7) * 2;
        const fr = 3 + Math.sin(i * 2.3 + s.time * 0.01) * 2;
        const fAlpha = 0.06 + Math.sin(s.time * 0.02 + i * 1.1) * 0.03;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        fg.addColorStop(0, `rgba(180,220,240,${fAlpha})`);
        fg.addColorStop(0.6, `rgba(150,200,230,${fAlpha * 0.4})`);
        fg.addColorStop(1, "rgba(136,204,238,0)");
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
      }

      // --- SUBSURFACE LIGHT SCATTER (soft glow just below surface) ---
      const scatterGrad = ctx.createLinearGradient(0, waterY - 4, 0, waterY + 35);
      scatterGrad.addColorStop(0, "rgba(100,180,220,0)");
      scatterGrad.addColorStop(0.2, `rgba(100,180,220,${0.06 + dayPhase * 0.04})`);
      scatterGrad.addColorStop(0.5, `rgba(80,150,200,${0.04 + dayPhase * 0.02})`);
      scatterGrad.addColorStop(1, "rgba(60,120,170,0)");
      ctx.fillStyle = scatterGrad;
      ctx.fillRect(worldLeft, waterY - 4, worldRight - worldLeft, 39);

      // Surface shimmer - organic dappled highlights
      for (let i = 0; i < 25; i++) {
        const sx = viewL + ((i * 73.7 + s.waterOffset * 3) % (W + 40)) - 20;
        const sWave = Math.sin((sx + s.waterOffset * 2) * 0.02) * 3;
        const sy = waterY + sWave - 3 + Math.sin(s.time * 0.02 + i * 2.1) * 2;
        const sr = 4 + Math.sin(i * 1.3 + s.time * 0.015) * 2;
        const shimmerAlpha = 0.04 + Math.sin(s.time * 0.03 + i * 0.9) * 0.025;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        sg.addColorStop(0, `rgba(200,230,245,${shimmerAlpha})`);
        sg.addColorStop(1, "rgba(200,230,245,0)");
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      }

      // --- INTERNAL WAVE TEXTURE (cloudy undulating bands, not hard lines) ---
      for (let row = 0; row < 7; row++) {
        const wy = waterY + row * 30 + 15;
        const depth = row / 7;
        const waveAlpha = 0.035 * (1 - depth * 0.5);

        for (let wx = viewL; wx < viewR; wx += 18) {
          const wave = Math.sin((wx + s.waterOffset * 2.5 + row * 50) * 0.015) * (4 - depth * 2)
                     + Math.sin((wx + s.waterOffset * 1.8 + row * 30) * 0.028) * (2.5 - depth);
          const cloudR = 8 + Math.sin(wx * 0.05 + row + s.time * 0.01) * 3;
          const ca = waveAlpha * (0.6 + Math.sin(wx * 0.03 + s.time * 0.008 + row * 1.2) * 0.4);
          const wcg = ctx.createRadialGradient(wx, wy + wave, 0, wx, wy + wave, cloudR);
          const wR = 80 + row * 10;
          const wG = 160 - row * 12;
          const wB = 210 - row * 8;
          wcg.addColorStop(0, `rgba(${wR},${wG},${wB},${ca})`);
          wcg.addColorStop(1, `rgba(${wR},${wG},${wB},0)`);
          ctx.fillStyle = wcg;
          ctx.beginPath(); ctx.arc(wx, wy + wave, cloudR, 0, Math.PI * 2); ctx.fill();
        }
      }

      // --- CAUSTIC LIGHT PATCHES (larger, softer, more organic) ---
      for (let i = 0; i < 16; i++) {
        const cx = viewL + ((i * 127 + s.waterOffset * 1.2) % (W + 80)) - 40;
        const cy = waterY + 25 + (i * 67) % Math.max(1, waterH * 0.7);
        const cr = 18 + Math.sin(s.time * 0.012 + i * 2.3) * 10;
        const cDepth = (cy - waterY) / waterH;
        const ca = (0.025 - cDepth * 0.01) * (0.6 + Math.sin(s.time * 0.01 + i * 1.7) * 0.4);
        if (ca > 0) {
          ctx.globalAlpha = ca;
          const cGrad = ctx.createRadialGradient(cx, cy, cr * 0.15, cx, cy, cr);
          cGrad.addColorStop(0, dayPhase > 0.5 ? "rgba(255,255,200,0.8)" : "rgba(140,190,255,0.6)");
          cGrad.addColorStop(0.5, dayPhase > 0.5 ? "rgba(255,255,210,0.3)" : "rgba(120,170,240,0.2)");
          cGrad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = cGrad;
          ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // --- GOD RAYS (tapered beams, soft edges) ---
      if (dayPhase > 0.3) {
        const rayAlpha = (dayPhase - 0.3) * 0.1;
        for (let r = 0; r < 6; r++) {
          const rayX = viewL + ((r * 193 + s.time * 0.12) % (W + 200)) - 100;
          const rayTopW = 8 + Math.sin(s.time * 0.008 + r * 1.7) * 4;
          const rayBotW = 35 + Math.sin(s.time * 0.006 + r * 2.1) * 12;
          const rayAngle = 0.12 + Math.sin(s.time * 0.004 + r * 2) * 0.04;
          const rayLen = waterH * (0.5 + Math.sin(s.time * 0.005 + r * 1.3) * 0.15);
          const rAlpha = rayAlpha * (0.5 + Math.sin(s.time * 0.008 + r * 0.8) * 0.35);

          ctx.globalAlpha = rAlpha;
          ctx.save();
          ctx.translate(rayX, waterY + 8);
          ctx.rotate(rayAngle);

          const rGrad = ctx.createLinearGradient(0, 0, 0, rayLen);
          rGrad.addColorStop(0, "rgba(180,220,255,0.18)");
          rGrad.addColorStop(0.2, "rgba(160,210,250,0.1)");
          rGrad.addColorStop(0.6, "rgba(140,190,240,0.04)");
          rGrad.addColorStop(1, "rgba(120,170,230,0)");
          ctx.fillStyle = rGrad;
          ctx.beginPath();
          ctx.moveTo(-rayTopW / 2, 0);
          ctx.lineTo(-rayBotW / 2, rayLen);
          ctx.lineTo(rayBotW / 2, rayLen);
          ctx.lineTo(rayTopW / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      // --- UNDERWATER BUBBLES (varied sizes, soft glow) ---
      for (let i = 0; i < 15; i++) {
        const bx = viewL + (i * 137 + s.time * 0.18) % W;
        const by = waterY + 35 + ((i * 97 + s.time * 0.1) % Math.max(1, waterH - 45));
        const br = 1.5 + Math.sin(s.time * 0.03 + i) * 0.8 + (i % 3) * 0.5;
        const bAlpha = 0.08 + Math.sin(s.time * 0.025 + i * 1.5) * 0.04;
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2);
        bg.addColorStop(0, `rgba(140,200,255,${bAlpha})`);
        bg.addColorStop(0.5, `rgba(120,180,240,${bAlpha * 0.4})`);
        bg.addColorStop(1, "rgba(100,160,220,0)");
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(bx, by, br * 2, 0, Math.PI * 2); ctx.fill();
      }

      // --- FLOATING PLANKTON & DEBRIS (soft glowing particles) ---
      for (let p = 0; p < 22; p++) {
        const px = viewL + ((p * 83 + s.time * 0.18 + p * 17) % (W + 40)) - 20;
        const py = waterY + 18 + ((p * 47 + s.time * 0.07) % Math.max(1, waterH - 25));
        const pSize = 1.5 + (p % 3) * 0.6;
        const pDepth = (py - waterY) / waterH;
        const pAlpha = (0.1 - pDepth * 0.05) * (0.6 + Math.sin(s.time * 0.02 + p * 1.4) * 0.4);

        const worldPX = px;
        const isDeep = worldPX < -(W * 1);
        const isMid = worldPX < 0;

        if (pAlpha > 0) {
          const pColor = isDeep ? [70,110,170] : isMid ? [110,160,200] : [150,195,225];
          const pg = ctx.createRadialGradient(px, py, 0, px, py, pSize * 2.5);
          pg.addColorStop(0, `rgba(${pColor[0]},${pColor[1]},${pColor[2]},${pAlpha})`);
          pg.addColorStop(1, `rgba(${pColor[0]},${pColor[1]},${pColor[2]},0)`);
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.arc(px, py, pSize * 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // --- DEPTH FOG (thick cloudy bottom haze) ---
      const depthFogGrad = ctx.createLinearGradient(0, H - 100, 0, H);
      depthFogGrad.addColorStop(0, "rgba(5,10,20,0)");
      depthFogGrad.addColorStop(0.4, `rgba(4,8,18,${0.12 + (1 - dayPhase) * 0.08})`);
      depthFogGrad.addColorStop(1, `rgba(3,6,15,${0.35 + (1 - dayPhase) * 0.2})`);
      ctx.fillStyle = depthFogGrad;
      ctx.fillRect(viewL, H - 100, W, 100);

      for (let df = 0; df < 10; df++) {
        const dfX = viewL + ((df * 113 + s.time * 0.05) % (W + 100)) - 50;
        const dfY = H - 60 + Math.sin(s.time * 0.003 + df * 2.7) * 20;
        const dfR = 35 + Math.sin(s.time * 0.004 + df * 1.3) * 12;
        const dfA = 0.08 + (1 - dayPhase) * 0.04;
        const dfg = ctx.createRadialGradient(dfX, dfY, 0, dfX, dfY, dfR);
        dfg.addColorStop(0, `rgba(5,10,22,${dfA})`);
        dfg.addColorStop(1, "rgba(5,10,22,0)");
        ctx.fillStyle = dfg;
        ctx.beginPath(); ctx.arc(dfX, dfY, dfR, 0, Math.PI * 2); ctx.fill();
      }

      // Pier using Pier_Tiles.png tileset
      const pierTiles = getImg("/assets/objects/Pier_Tiles.png");
      const pierScale = 2.5;
      const pierStartX = defaultFishermanX - 80;
      const pierRight = W * 2.8;
      const pierThickness = 20 * pierScale;

      if (pierTiles && pierTiles.complete) {
        // Draw pier planks using the top portion of the tileset (horizontal planks)
        const plankSrcW = 64;
        const plankSrcH = 16;
        const plankDrawW = plankSrcW * pierScale;
        const plankDrawH = plankSrcH * pierScale;

        for (let px = pierStartX; px < pierRight; px += plankDrawW) {
          const drawW = Math.min(plankDrawW, pierRight - px);
          const srcW = drawW / pierScale;
          ctx.drawImage(pierTiles, 0, 0, srcW, plankSrcH, px, pierY, drawW, plankDrawH);
        }

      } else {
        const pierWidth = pierRight - pierStartX;
        const plankColors = ["#6b4423", "#5a3a1a", "#7a5030", "#634020", "#6b4423"];
        for (let py = 0; py < 5; py++) {
          ctx.fillStyle = plankColors[py];
          ctx.fillRect(pierStartX, pierY + py * 8, pierWidth, 8);
        }
      }

      // Pier shadow in water
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#000000";
      ctx.fillRect(pierStartX, waterY, pierRight - pierStartX, 12);
      ctx.globalAlpha = 1;

      const hutScale = 2.2;
      const hutW = 192 * hutScale;
      const hutH = 122 * hutScale;
      const hutX = W * 0.85;
      const hutY = pierY - hutH + 50 * hutScale;
      drawImage("/assets/objects/Fishing_hut.png", hutX, hutY, hutScale);

      // Digital Billboard - large display near hut
      if (s.gameState !== "title" && s.gameState !== "charSelect") {
        const bbW = 350;
        const bbH = 250;
        const bbX = hutX + hutW + 20;
        const bbY = waterY - bbH - 40;
        const bbCx = bbX + bbW / 2;
        const bbT = (s.billboardTimer + s.billboardSlide * 400) * 0.001;

        // Support posts
        ctx.fillStyle = "#37474f";
        ctx.fillRect(bbX + 20, bbY + bbH, 12, 60);
        ctx.fillRect(bbX + bbW - 32, bbY + bbH, 12, 60);
        ctx.fillStyle = "#263238";
        ctx.fillRect(bbX + 20, bbY + bbH, 12, 4);
        ctx.fillRect(bbX + bbW - 32, bbY + bbH, 12, 4);

        // Outer frame
        ctx.save();
        ctx.shadowColor = "rgba(79,195,247,0.4)";
        ctx.shadowBlur = 30;
        drawRoundRect(bbX - 4, bbY - 4, bbW + 8, bbH + 8, 8);
        ctx.fillStyle = "#1a1a2e";
        ctx.fill();
        ctx.restore();

        // Inner screen
        ctx.save();
        drawRoundRect(bbX, bbY, bbW, bbH, 6);
        ctx.clip();

        // Animated gradient background per slide
        const slide = s.billboardSlide % 7;
        const pulse = Math.sin(bbT * 2) * 0.15 + 0.85;
        let grad: CanvasGradient;
        if (slide === 0) {
          grad = ctx.createLinearGradient(bbX, bbY, bbX + bbW, bbY + bbH);
          grad.addColorStop(0, `rgba(13,71,161,${pulse})`);
          grad.addColorStop(0.5, `rgba(21,101,192,${pulse * 0.8})`);
          grad.addColorStop(1, `rgba(1,87,155,${pulse})`);
        } else if (slide === 1) {
          grad = ctx.createLinearGradient(bbX, bbY, bbX + bbW, bbY + bbH);
          grad.addColorStop(0, `rgba(136,14,79,${pulse})`);
          grad.addColorStop(0.5, `rgba(74,20,140,${pulse * 0.8})`);
          grad.addColorStop(1, `rgba(49,27,146,${pulse})`);
        } else if (slide === 2) {
          grad = ctx.createLinearGradient(bbX, bbY, bbX, bbY + bbH);
          grad.addColorStop(0, `rgba(27,94,32,${pulse})`);
          grad.addColorStop(0.5, `rgba(46,125,50,${pulse * 0.7})`);
          grad.addColorStop(1, `rgba(0,77,64,${pulse})`);
        } else if (slide === 3) {
          grad = ctx.createRadialGradient(bbCx, bbY + bbH / 2, 20, bbCx, bbY + bbH / 2, bbW * 0.6);
          grad.addColorStop(0, `rgba(183,28,28,${pulse})`);
          grad.addColorStop(0.5, `rgba(136,14,79,${pulse * 0.8})`);
          grad.addColorStop(1, `rgba(74,20,140,${pulse * 0.6})`);
        } else if (slide === 4) {
          grad = ctx.createLinearGradient(bbX, bbY, bbX + bbW, bbY + bbH);
          grad.addColorStop(0, `rgba(230,81,0,${pulse})`);
          grad.addColorStop(0.5, `rgba(245,127,23,${pulse * 0.7})`);
          grad.addColorStop(1, `rgba(255,111,0,${pulse})`);
        } else if (slide === 5) {
          grad = ctx.createLinearGradient(bbX, bbY, bbX + bbW, bbY);
          grad.addColorStop(0, `rgba(62,39,35,${pulse})`);
          grad.addColorStop(0.5, `rgba(78,52,46,${pulse * 0.8})`);
          grad.addColorStop(1, `rgba(93,64,55,${pulse})`);
        } else {
          grad = ctx.createRadialGradient(bbCx, bbY + bbH / 2, 30, bbCx, bbY + bbH / 2, bbW * 0.7);
          grad.addColorStop(0, `rgba(0,96,100,${pulse})`);
          grad.addColorStop(0.5, `rgba(0,77,64,${pulse * 0.8})`);
          grad.addColorStop(1, `rgba(0,37,26,${pulse})`);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(bbX, bbY, bbW, bbH);

        // Animated particle dots in background
        for (let p = 0; p < 12; p++) {
          const px = bbX + ((p * 97 + bbT * 40) % bbW);
          const py = bbY + ((p * 53 + bbT * 25) % bbH);
          const pa = 0.15 + 0.1 * Math.sin(bbT * 3 + p);
          ctx.fillStyle = `rgba(255,255,255,${pa})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Scanline overlay
        ctx.fillStyle = "rgba(0,0,0,0.06)";
        for (let sy = 0; sy < bbH; sy += 3) {
          ctx.fillRect(bbX, bbY + sy, bbW, 1);
        }

        // Top header bar
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(bbX, bbY, bbW, 28);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(bbX, bbY + 27, bbW, 1);

        // Slide titles
        ctx.textAlign = "center";
        ctx.font = "bold 10px 'Press Start 2P', monospace";
        const slideLabels = ["GLOBAL LEADERBOARD", "PERSONAL BEST", "RECENT CATCHES", "STORE DEALS", "LIMITED EGGS", "ACTIVE BOUNTIES", "GRUDGE ANGELER"];
        const titleColors = ["#4fc3f7", "#e040fb", "#66bb6a", "#ff7043", "#f59e0b", "#a1887f", "#00e5ff"];
        ctx.fillStyle = titleColors[slide];
        ctx.fillText(slideLabels[slide], bbCx, bbY + 18);

        // Slide indicator dots
        for (let d = 0; d < 7; d++) {
          ctx.fillStyle = d === slide ? "#ffffff" : "rgba(255,255,255,0.25)";
          ctx.beginPath();
          ctx.arc(bbCx - 24 + d * 8, bbY + bbH - 10, d === slide ? 3 : 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Content area
        const contentY = bbY + 38;
        const contentH = bbH - 58;
        ctx.font = "7px 'Press Start 2P', monospace";

        if (slide === 0) {
          // Global Leaderboard - top 5
          const lb = s.billboardLeaderboard;
          if (lb.length === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "8px 'Press Start 2P', monospace";
            ctx.fillText("Loading rankings...", bbCx, contentY + contentH / 2);
          } else {
            const medalColors = ["#ffd54f", "#b0bec5", "#cd7f32", "#78909c", "#78909c"];
            const medalLabels = ["1ST", "2ND", "3RD", "4TH", "5TH"];
            ctx.textAlign = "left";
            for (let i = 0; i < Math.min(lb.length, 5); i++) {
              const ey = contentY + 8 + i * 34;
              // Row background
              ctx.fillStyle = i < 3 ? `rgba(255,255,255,0.06)` : `rgba(255,255,255,0.02)`;
              drawRoundRect(bbX + 12, ey - 6, bbW - 24, 28, 4);
              ctx.fill();
              // Medal
              ctx.fillStyle = medalColors[i];
              ctx.font = "bold 8px 'Press Start 2P', monospace";
              ctx.fillText(medalLabels[i], bbX + 20, ey + 6);
              // Name
              ctx.fillStyle = i < 3 ? "#e0e0e0" : "#90a4ae";
              ctx.font = "7px 'Press Start 2P', monospace";
              const pName = (lb[i].playerName || "???").substring(0, 12);
              ctx.fillText(pName, bbX + 70, ey + 6);
              // Fish + Weight
              ctx.fillStyle = "#78909c";
              ctx.font = "5px 'Press Start 2P', monospace";
              ctx.fillText((lb[i].fishName || "").substring(0, 14), bbX + 70, ey + 16);
              ctx.fillStyle = titleColors[0];
              ctx.textAlign = "right";
              ctx.font = "bold 7px 'Press Start 2P', monospace";
              ctx.fillText((lb[i].value || 0).toFixed(1) + " lb", bbX + bbW - 18, ey + 6);
              ctx.textAlign = "left";
            }
          }
        } else if (slide === 1) {
          // Personal Best
          ctx.textAlign = "center";
          if (s.biggestCatchName) {
            // Big fish name
            ctx.fillStyle = "#e040fb";
            ctx.font = "bold 14px 'Press Start 2P', monospace";
            ctx.fillText(s.biggestCatchName, bbCx, contentY + 30);
            // Stats
            ctx.fillStyle = "#e0e0e0";
            ctx.font = "9px 'Press Start 2P', monospace";
            ctx.fillText("Size: " + s.biggestCatchSize.toFixed(1) + "x", bbCx, contentY + 55);
            ctx.fillText("Weight: " + s.biggestCatchWeight.toFixed(1) + " lb", bbCx, contentY + 72);
            // Session stats
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "6px 'Press Start 2P', monospace";
            ctx.fillText("Session Catches: " + s.sessionCatches, bbCx, contentY + 100);
            ctx.fillText("Level " + s.playerLevel + " Angler", bbCx, contentY + 115);
            // Decorative line
            ctx.strokeStyle = "rgba(224,64,251,0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bbX + 40, contentY + 85);
            ctx.lineTo(bbX + bbW - 40, contentY + 85);
            ctx.stroke();
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "8px 'Press Start 2P', monospace";
            ctx.fillText("No catches yet!", bbCx, contentY + 40);
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.font = "6px 'Press Start 2P', monospace";
            ctx.fillText("Cast your line to", bbCx, contentY + 65);
            ctx.fillText("set a record!", bbCx, contentY + 80);
          }
        } else if (slide === 2) {
          // Recent Catches - last 5
          ctx.textAlign = "left";
          const hist = s.catchHistory.slice(0, 5);
          if (hist.length === 0) {
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "8px 'Press Start 2P', monospace";
            ctx.fillText("No recent catches", bbCx, contentY + contentH / 2);
          } else {
            const rarityColors: Record<string, string> = { common: "#90a4ae", uncommon: "#66bb6a", rare: "#42a5f5", legendary: "#ffa726", ultra_rare: "#ff4060" };
            for (let i = 0; i < hist.length; i++) {
              const ey = contentY + 6 + i * 32;
              ctx.fillStyle = "rgba(255,255,255,0.04)";
              drawRoundRect(bbX + 12, ey - 4, bbW - 24, 26, 4);
              ctx.fill();
              // Rarity dot
              ctx.fillStyle = rarityColors[hist[i].rarity] || "#78909c";
              ctx.beginPath();
              ctx.arc(bbX + 24, ey + 8, 4, 0, Math.PI * 2);
              ctx.fill();
              // Fish name
              ctx.fillStyle = rarityColors[hist[i].rarity] || "#e0e0e0";
              ctx.font = "7px 'Press Start 2P', monospace";
              ctx.fillText(hist[i].name.substring(0, 14), bbX + 36, ey + 10);
              // Weight + price
              ctx.fillStyle = "#78909c";
              ctx.font = "5px 'Press Start 2P', monospace";
              ctx.fillText(hist[i].weight.toFixed(1) + " lb", bbX + 36, ey + 20);
              ctx.fillStyle = "#f1c40f";
              ctx.textAlign = "right";
              ctx.font = "6px 'Press Start 2P', monospace";
              ctx.fillText(hist[i].sellPrice + "g", bbX + bbW - 18, ey + 10);
              ctx.textAlign = "left";
            }
          }
        } else if (slide === 3) {
          // Store Deals
          ctx.textAlign = "center";
          ctx.fillStyle = "#ff7043";
          ctx.font = "bold 11px 'Press Start 2P', monospace";
          ctx.fillText("HOT DEALS", bbCx, contentY + 20);
          // Show actual rod/lure prices
          ctx.textAlign = "left";
          const deals = [
            { name: "Storm Rod", price: 500, color: "#42a5f5" },
            { name: "Shark Fang", price: 350, color: "#ef5350" },
            { name: "Golden Lure", price: 800, color: "#ffd54f" },
          ];
          for (let i = 0; i < deals.length; i++) {
            const dy = contentY + 40 + i * 32;
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            drawRoundRect(bbX + 20, dy - 4, bbW - 40, 26, 4);
            ctx.fill();
            ctx.fillStyle = deals[i].color;
            ctx.font = "7px 'Press Start 2P', monospace";
            ctx.fillText(deals[i].name, bbX + 32, dy + 10);
            ctx.fillStyle = "#f1c40f";
            ctx.textAlign = "right";
            ctx.font = "bold 7px 'Press Start 2P', monospace";
            ctx.fillText(deals[i].price + "g", bbX + bbW - 28, dy + 10);
            ctx.textAlign = "left";
          }
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "5px 'Press Start 2P', monospace";
          ctx.fillText("Visit the shop near the hut!", bbCx, contentY + contentH - 8);
        } else if (slide === 4) {
          // Limited Eggs
          ctx.textAlign = "center";
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 11px 'Press Start 2P', monospace";
          ctx.fillText("LIMITED EDITION", bbCx, contentY + 18);
          // Beta eggs
          ctx.fillStyle = "rgba(168,85,247,0.15)";
          drawRoundRect(bbX + 15, contentY + 28, (bbW - 40) / 2, 100, 6);
          ctx.fill();
          ctx.fillStyle = "#ec4899";
          ctx.font = "bold 8px 'Press Start 2P', monospace";
          ctx.fillText("BETA EGGS", bbX + 15 + (bbW - 40) / 4, contentY + 46);
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 18px 'Press Start 2P', monospace";
          const betaRemaining = s.eggStock ? s.eggStock.filter((e: any) => e.type === "beta").reduce((sum: number, e: any) => sum + e.remaining, 0) : BETA_EGG_MAX_STOCK * 4;
          ctx.fillText("" + betaRemaining, bbX + 15 + (bbW - 40) / 4, contentY + 72);
          ctx.fillStyle = "#78909c";
          ctx.font = "5px 'Press Start 2P', monospace";
          ctx.fillText("remaining", bbX + 15 + (bbW - 40) / 4, contentY + 86);
          ctx.fillText("1 Head each", bbX + 15 + (bbW - 40) / 4, contentY + 100);
          // Warlord eggs
          const wX = bbX + 25 + (bbW - 40) / 2;
          ctx.fillStyle = "rgba(239,68,68,0.15)";
          drawRoundRect(wX, contentY + 28, (bbW - 40) / 2, 100, 6);
          ctx.fill();
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 8px 'Press Start 2P', monospace";
          ctx.fillText("WARLORDS", wX + (bbW - 40) / 4, contentY + 46);
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 18px 'Press Start 2P', monospace";
          const warlordRemaining = s.eggStock ? s.eggStock.filter((e: any) => e.type === "warlord").reduce((sum: number, e: any) => sum + e.remaining, 0) : WARLORD_EGG_MAX_STOCK * 3;
          ctx.fillText("" + warlordRemaining, wX + (bbW - 40) / 4, contentY + 72);
          ctx.fillStyle = "#78909c";
          ctx.font = "5px 'Press Start 2P', monospace";
          ctx.fillText("remaining", wX + (bbW - 40) / 4, contentY + 86);
          ctx.fillText("2 Heads each", wX + (bbW - 40) / 4, contentY + 100);
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "5px 'Press Start 2P', monospace";
          ctx.fillText("Once sold out, gone forever!", bbCx, contentY + contentH - 8);
        } else if (slide === 5) {
          // Active Bounties
          ctx.textAlign = "center";
          if (s.bounties.length === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "8px 'Press Start 2P', monospace";
            ctx.fillText("No active bounties", bbCx, contentY + contentH / 2);
          } else {
            ctx.textAlign = "left";
            for (let i = 0; i < Math.min(s.bounties.length, 4); i++) {
              const by = contentY + 8 + i * 38;
              ctx.fillStyle = "rgba(255,255,255,0.05)";
              drawRoundRect(bbX + 12, by - 4, bbW - 24, 32, 4);
              ctx.fill();
              // Target fish
              ctx.fillStyle = "#a1887f";
              ctx.font = "bold 7px 'Press Start 2P', monospace";
              ctx.fillText("TARGET:", bbX + 22, by + 8);
              ctx.fillStyle = "#e0e0e0";
              ctx.font = "7px 'Press Start 2P', monospace";
              ctx.fillText(s.bounties[i].fishName, bbX + 90, by + 8);
              // Reward
              ctx.fillStyle = "#78909c";
              ctx.font = "5px 'Press Start 2P', monospace";
              ctx.fillText("Min size: " + (s.bounties[i].minSize || 1).toFixed(1) + "x", bbX + 22, by + 20);
              ctx.fillStyle = "#f1c40f";
              ctx.textAlign = "right";
              ctx.font = "bold 7px 'Press Start 2P', monospace";
              const gbuxBB = getImg("/assets/icons/gbux.png");
              if (gbuxBB) ctx.drawImage(gbuxBB, bbX + bbW - 68, by + 12, 10, 10);
              ctx.fillText(s.bounties[i].reward + "g", bbX + bbW - 20, by + 20);
              ctx.textAlign = "left";
            }
          }
        } else {
          // Grudge Angeler branding
          ctx.textAlign = "center";
          ctx.fillStyle = "#00e5ff";
          ctx.font = "bold 20px 'Press Start 2P', monospace";
          ctx.fillText("GRUDGE", bbCx, contentY + 35);
          ctx.fillStyle = "#4fc3f7";
          ctx.font = "bold 16px 'Press Start 2P', monospace";
          ctx.fillText("ANGELER", bbCx, contentY + 60);
          // Tagline
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = "6px 'Press Start 2P', monospace";
          ctx.fillText("Cast. Catch. Conquer.", bbCx, contentY + 82);
          // Version
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "5px 'Press Start 2P', monospace";
          ctx.fillText("v1.0 - Beta Season", bbCx, contentY + 100);
          // Animated glow ring
          ctx.strokeStyle = `rgba(0,229,255,${0.15 + 0.1 * Math.sin(bbT * 4)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(bbCx, contentY + 48, 50 + 5 * Math.sin(bbT * 2), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Screen edge glow
        ctx.strokeStyle = `rgba(79,195,247,${0.3 + 0.1 * Math.sin(bbT * 3)})`;
        ctx.lineWidth = 2;
        drawRoundRect(bbX, bbY, bbW, bbH, 6);
        ctx.stroke();

        ctx.restore();
        ctx.textAlign = "left";
      }

      // Boat floating on water (subtle bob)
      const boatBob = boatBobVal;
      const boatDrawX = s.inBoat || s.gameState === "boarding" ? s.boatX : pierStartX - 74 * boatScale - 30;
      drawImage("/assets/objects/Boat.png", boatDrawX, waterY - 10 * boatScale + boatBob, boatScale);

      // Decorative objects on pier - positioned from worldObjects array
      s.worldObjects.forEach((obj, i) => {
        drawImage(obj.sprite, obj.x, obj.y, obj.scale);
        if (s.gizmoEnabled && s.adminOpen) {
          const img = getImg(obj.sprite);
          if (img && img.complete) {
            const w = img.width * obj.scale;
            const h = img.height * obj.scale;
            ctx.strokeStyle = s.gizmoSelected === i ? "#f1c40f" : "rgba(79,195,247,0.5)";
            ctx.lineWidth = s.gizmoSelected === i ? 2 : 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(obj.x, obj.y, w, h);
            ctx.setLineDash([]);
            if (s.gizmoSelected === i) {
              ctx.fillStyle = "#f1c40f";
              ctx.fillRect(obj.x + w/2 - 4, obj.y - 12, 8, 8);
              ctx.strokeStyle = "#f1c40f";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(obj.x + w/2, obj.y - 4);
              ctx.lineTo(obj.x + w/2, obj.y + h + 4);
              ctx.moveTo(obj.x - 4, obj.y + h/2);
              ctx.lineTo(obj.x + w + 4, obj.y + h/2);
              ctx.stroke();
            }
          }
        }
      });

      // NPC rendering disabled

      // Docks area objects (right side scenes)
      const dockObjY = pierY - 2;
      drawImage("/assets/objects/Stay.png", W * 1.6, dockObjY - 15 * 2, 2);
      drawImage("/assets/objects/Fishbarrel1.png", W * 1.8, dockObjY - 11 * 1.8, 1.8);
      drawImage("/assets/objects/Grass1.png", W * 2.0, dockObjY - 33 * 1.2, 1.2);
      drawImage("/assets/objects/Fish-rod.png", W * 2.2, dockObjY - 26 * 1.6, 1.6);
      drawImage("/assets/objects/Fishbarrel2.png", W * 2.5, dockObjY - 15 * 1.5, 1.5);
      drawImage("/assets/objects/Stay.png", W * 2.8, dockObjY - 15 * 1.8, 1.8);
      drawImage("/assets/objects/Grass3.png", W * 3.1, dockObjY - 24 * 1.0, 1.0);

      // Beach area (right side)
      const beachStart = W * 3.0;
      const beachEnd = W * 5 + 200;
      const sandGrad = ctx.createLinearGradient(0, pierY - 5, 0, H);
      sandGrad.addColorStop(0, "#d4a76a");
      sandGrad.addColorStop(0.3, "#c49a5e");
      sandGrad.addColorStop(0.7, "#b8905a");
      sandGrad.addColorStop(1, "#a07840");
      ctx.fillStyle = sandGrad;
      ctx.beginPath();
      ctx.moveTo(beachStart, pierY + 10);
      for (let bx = beachStart; bx <= beachEnd; bx += 5) {
        const progress = (bx - beachStart) / (beachEnd - beachStart);
        const beachY = pierY + 10 + progress * 30;
        ctx.lineTo(bx, beachY);
      }
      ctx.lineTo(beachEnd, H);
      ctx.lineTo(beachStart, H);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = "#fff8e7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let bx = beachStart; bx <= beachEnd; bx += 3) {
        const progress = (bx - beachStart) / (beachEnd - beachStart);
        const shoreY = pierY + 10 + progress * 30 + Math.sin(s.time * 0.03 + bx * 0.02) * 3;
        if (bx === beachStart) ctx.moveTo(bx, shoreY);
        else ctx.lineTo(bx, shoreY);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (let ri = 0; ri < 8; ri++) {
        const rx = beachStart + 100 + ri * 180 + Math.sin(ri * 2.7) * 40;
        const progress = (rx - beachStart) / (beachEnd - beachStart);
        const ry = pierY + 15 + progress * 28;
        ctx.fillStyle = ri % 2 === 0 ? "#8a7c6b" : "#9e9080";
        ctx.beginPath();
        ctx.ellipse(rx, ry, 4 + ri % 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ripples
      for (let i = s.ripples.length - 1; i >= 0; i--) {
        const rp = s.ripples[i];
        rp.radius += 0.4 * dt;
        rp.alpha -= 0.01 * dt;
        if (rp.alpha <= 0 || rp.radius >= rp.maxRadius) {
          s.ripples.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = rp.alpha;
        ctx.strokeStyle = "#88ccee";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.radius, rp.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Swimming fish
      if (s.gameState !== "title" && s.gameState !== "charSelect") {
        if (s.swimmingFish.length < 10 && Math.random() < 0.012 * dt) {
          spawnFish(W, waterY, H);
        }
        if (Math.random() < 0.008 * dt) {
          spawnBeachCrab(W, waterY, H);
        }
      }

      // Predator spawning
      s.predatorSpawnTimer -= dt;
      if (s.predatorSpawnTimer <= 0 && s.predators.length < 3) {
        spawnPredator(W, waterY, H);
        s.predatorSpawnTimer = 300 + Math.random() * 600;
      }

      // Predator alert timer
      if (s.predatorAlertTimer > 0) s.predatorAlertTimer -= dt;
      if (s.headOfLegendsNotifTimer > 0) s.headOfLegendsNotifTimer -= dt;

      // Predator boat damage shake
      if (s.boatDamageShake > 0) s.boatDamageShake -= 0.1 * dt;

      for (let i = s.swimmingFish.length - 1; i >= 0; i--) {
        const fish = s.swimmingFish[i];

        if (fish.approachingHook && (s.gameState === "waiting")) {
          const dx = s.hookX - fish.x;
          const dy = s.hookY - fish.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 8) {
            fish.x += (dx / dist) * fish.speed * 1.5 * dt;
            fish.y += (dy / dist) * fish.speed * 1.0 * dt;
            fish.direction = dx > 0 ? 1 : -1;
          } else {
            s.gameState = "bite";
            const vitBonus = 1 + s.attributes.Vitality * 0.01 * (1 + s.attributes.Tactics * 0.005);
            s.biteTimer = (120 + Math.random() * 80) * vitBonus;
            s.exclamationTimer = 0;
            s.currentCatch = fish.type;
            s.hookedFishX = fish.x;
            s.hookedFishY = fish.y;
            s.hookedFishDir = fish.direction;
            s.hookedFishFrame = 0;
            s.hookedFishFrameTimer = 0;
            s.hookedFishVX = (Math.random() > 0.5 ? 1 : -1) * fish.speed;
            s.hookedFishSize = fish.sizeMultiplier;
            if (Math.random() < 0.08) {
              s.currentCatch = null;
              s.currentJunk = JUNK_ITEMS[Math.floor(Math.random() * JUNK_ITEMS.length)];
            } else { s.currentJunk = null; }
            addParticles(s.hookX, waterY, 10, "#5dade2", 2.5, "splash");
            addRipple(s.hookX, waterY);
            s.screenShake = 3;
            s.swimmingFish.splice(i, 1);
            syncUI();
            continue;
          }
        } else {
          fish.dirChangeTimer -= dt;
          if (fish.dirChangeTimer <= 0 && !fish.approachingHook) {
            if (Math.random() < 0.3) {
              fish.direction *= -1;
            }
            fish.speed = fish.type.speed * (0.7 + Math.random() * 0.6);
            fish.wobbleAmp = 2 + Math.random() * 4;
            fish.dirChangeTimer = 60 + Math.random() * 120;
          }
          fish.x += fish.direction * fish.speed * dt;
          fish.wobblePhase += 0.04 * dt;
          fish.y = fish.baseY + Math.sin(fish.wobblePhase) * fish.wobbleAmp;
        }

        fish.frameTimer += dt;
        const frameSpeed = 4 + (1.0 / Math.max(0.3, fish.speed)) * 4;
        if (fish.frameTimer > frameSpeed) {
          fish.frameTimer = 0;
          fish.frame = (fish.frame + 1) % fish.type.walkFrames;
        }

        const cullLeft = -s.cameraX - 300;
        const cullRight = -s.cameraX + W + 300;
        if ((fish.direction > 0 && fish.x > cullRight) || (fish.direction < 0 && fish.x < cullLeft)) {
          if (!fish.approachingHook) {
            s.swimmingFish.splice(i, 1);
            continue;
          }
        }

        const fishDepth = (fish.y - waterY) / (H - waterY);
        const depthAlpha = 0.9 - fishDepth * 0.3;
        const weatherVisibility = s.weather === "storm" ? 0.4 : s.weather === "rain" ? 0.6 : s.weather === "fog" ? 0.5 : s.weather === "cloudy" ? 0.85 : 1.0;
        const finalAlpha = depthAlpha * (weatherVisibility * s.weatherTransition + 1 * (1 - s.weatherTransition));
        ctx.globalAlpha = finalAlpha;

        const creatureScale = SCALE * 0.65 * fish.sizeMultiplier;
        if (fish.type.spriteSheet && fish.type.spriteRow !== undefined) {
          const crabImg = getImg(fish.type.spriteSheet);
          if (crabImg && crabImg.complete) {
            const fs = fish.type.spriteFrameSize || CRAB_FRAME;
            const crabScale = SCALE * 1.2 * fish.sizeMultiplier;
            const sx = fish.frame * fs;
            const sy = fish.type.spriteRow * fs;
            ctx.save();
            if (fish.direction < 0) {
              ctx.translate(fish.x + fs * crabScale, fish.y);
              ctx.scale(-1, 1);
              ctx.drawImage(crabImg, sx, sy, fs, fs, 0, 0, fs * crabScale, fs * crabScale);
            } else {
              ctx.drawImage(crabImg, sx, sy, fs, fs, fish.x, fish.y, fs * crabScale, fs * crabScale);
            }
            ctx.restore();
          }
        } else {
          drawSprite(
            `/assets/creatures/${fish.type.creatureFolder}/Walk.png`,
            fish.frame, fish.type.walkFrames,
            fish.x, fish.y, creatureScale,
            fish.direction < 0,
            fish.type.tint || null
          );
        }
        if (fish.type.rarity === "ultra_rare") {
          const glowPulse = 0.3 + Math.sin(s.time * 0.06 + fish.x * 0.01) * 0.15;
          const tintColor = fish.type.tint || "#ff2d55";
          ctx.globalAlpha = glowPulse;
          ctx.shadowColor = tintColor;
          ctx.shadowBlur = 25 + Math.sin(s.time * 0.04) * 8;
          
          const glowX = fish.x + (FRAME_H * creatureScale * 0.5);
          const glowY = fish.y + (FRAME_H * creatureScale * 0.3);
          ctx.fillStyle = tintColor;
          ctx.beginPath();
          ctx.ellipse(glowX, glowY, creatureScale * 20, creatureScale * 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          for (let sp = 0; sp < 4; sp++) {
            const angle = s.time * 0.04 + sp * Math.PI * 0.5 + fish.x * 0.01;
            const orbitR = creatureScale * 18 + Math.sin(s.time * 0.08 + sp) * 4;
            const spX = glowX + Math.cos(angle) * orbitR;
            const spY = glowY + Math.sin(angle) * orbitR * 0.6;
            ctx.globalAlpha = 0.5 + Math.sin(s.time * 0.1 + sp * 1.5) * 0.3;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(spX, spY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = 1;
      }

      // Predator update and rendering
      for (let pi = s.predators.length - 1; pi >= 0; pi--) {
        const pred = s.predators[pi];
        
        // State timer
        pred.stateTimer -= dt;
        pred.attackCooldown = Math.max(0, pred.attackCooldown - dt);
        
        // Death state
        if (pred.state === "death") {
          pred.deathTimer += dt;
          pred.frameTimer += dt;
          if (pred.frameTimer > 6) {
            pred.frameTimer = 0;
            pred.frame = Math.min(pred.frame + 1, pred.type.deathFrames - 1);
          }
          pred.opacity -= 0.005 * dt;
          pred.y += 0.3 * dt;
          if (pred.opacity <= 0 || pred.deathTimer > 180) {
            s.predators.splice(pi, 1);
            continue;
          }
        } else if (pred.state === "hurt") {
          pred.frameTimer += dt;
          if (pred.frameTimer > 6) {
            pred.frameTimer = 0;
            pred.frame = (pred.frame + 1) % pred.type.hurtFrames;
          }
          if (pred.stateTimer <= 0) {
            if (pred.health <= 0) {
              pred.state = "death";
              pred.frame = 0;
              pred.frameTimer = 0;
              pred.deathTimer = 0;
            } else {
              pred.state = "flee";
              pred.stateTimer = 120 + Math.random() * 60;
              pred.direction = pred.x > (-s.cameraX + W / 2) ? 1 : -1;
              pred.speed = pred.type.speed * 2;
            }
          }
        } else if (pred.state === "flee") {
          pred.x += pred.direction * pred.speed * 1.5 * dt;
          pred.frameTimer += dt;
          if (pred.frameTimer > 5) {
            pred.frameTimer = 0;
            pred.frame = (pred.frame + 1) % pred.type.walkFrames;
          }
          if (pred.stateTimer <= 0) {
            pred.state = "patrol";
            pred.stateTimer = 120 + Math.random() * 180;
            pred.speed = pred.type.speed * (0.8 + Math.random() * 0.4);
          }
        } else if (pred.state === "attack") {
          pred.frameTimer += dt;
          if (pred.frameTimer > 5) {
            pred.frameTimer = 0;
            pred.frame = (pred.frame + 1) % pred.type.attackFrames;
          }
          if (pred.stateTimer <= 0) {
            pred.state = "patrol";
            pred.stateTimer = 120 + Math.random() * 180;
            pred.attackCooldown = 300;
          }
        } else if (pred.state === "chase") {
          if (s.gameState === "reeling" || s.gameState === "waiting" || s.gameState === "bite") {
            const targetX = s.hookX;
            const targetY = s.hookY;
            const dx = targetX - pred.x;
            const dy = targetY - pred.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            pred.direction = dx > 0 ? 1 : -1;
            if (dist > 30) {
              pred.x += (dx / dist) * pred.speed * 1.8 * dt;
              pred.y += (dy / dist) * pred.speed * 1.2 * dt;
            } else if (pred.attackCooldown <= 0) {
              pred.state = "attack";
              pred.stateTimer = 40;
              pred.frame = 0;
              pred.frameTimer = 0;
              pred.attackCooldown = 300;
              
              if (s.gameState === "reeling" || s.gameState === "bite") {
                s.predatorAlert = `${pred.type.name} stole your catch!`;
                s.predatorAlertTimer = 180;
                s.gameState = "idle";
                s.currentCatch = null;
                s.currentJunk = null;
                s.combo = 0;
                s.screenShake = 8;
                addParticles(pred.x, pred.y, 15, "#ff4444", 3, "splash");
              }
            }
          } else {
            pred.state = "patrol";
            pred.stateTimer = 120 + Math.random() * 180;
          }
          pred.frameTimer += dt;
          if (pred.frameTimer > 4) {
            pred.frameTimer = 0;
            pred.frame = (pred.frame + 1) % pred.type.walkFrames;
          }
        } else {
          // Patrol
          pred.wobblePhase += 0.03 * dt;
          pred.y = pred.baseY + Math.sin(pred.wobblePhase) * pred.wobbleAmp;
          pred.x += pred.direction * pred.speed * 0.7 * dt;
          
          pred.frameTimer += dt;
          if (pred.frameTimer > 6) {
            pred.frameTimer = 0;
            pred.frame = (pred.frame + 1) % pred.type.walkFrames;
          }
          
          if (pred.stateTimer <= 0) {
            if (Math.random() < 0.3) pred.direction *= -1;
            pred.stateTimer = 120 + Math.random() * 180;
          }
          
          // Check if should chase hooked fish
          if (pred.attackCooldown <= 0 && (s.gameState === "reeling" || s.gameState === "waiting" || s.gameState === "bite")) {
            const dx = s.hookX - pred.x;
            const dy = s.hookY - pred.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 350) {
              pred.state = "chase";
              pred.stateTimer = 300;
            }
          }
          
          // Scare nearby fish
          for (const fish of s.swimmingFish) {
            const dx = fish.x - pred.x;
            const dy = fish.y - pred.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pred.type.scareRadius) {
              fish.direction = dx > 0 ? 1 : -1;
              fish.speed = fish.type.speed * 2.5;
              fish.dirChangeTimer = 60;
              fish.approachingHook = false;
            }
          }
          
          // Predator might bite the hook itself if no fish on line
          if (pred.attackCooldown <= 0 && s.gameState === "waiting") {
            const dx = s.hookX - pred.x;
            const dy = s.hookY - pred.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80 && Math.random() < 0.005 * dt) {
              s.gameState = "bite";
              const vitBonus = 1 + s.attributes.Vitality * 0.01 * (1 + s.attributes.Tactics * 0.005);
              s.biteTimer = (120 + Math.random() * 80) * vitBonus;
              s.exclamationTimer = 0;
              s.currentCatch = { 
                name: pred.type.name, catchAsset: pred.type.catchAsset, catchW: pred.type.catchW, catchH: pred.type.catchH, 
                creatureFolder: pred.type.folder, idleFrames: pred.type.idleFrames, walkFrames: pred.type.walkFrames, 
                points: pred.type.points, rarity: pred.type.rarity, weight: pred.type.weight, 
                minDepth: 0.5, speed: pred.type.speed, description: pred.type.description, 
                tint: pred.type.tint, baseScale: pred.type.size 
              } as FishType;
              s.hookedFishX = pred.x;
              s.hookedFishY = pred.y;
              s.hookedFishDir = pred.direction;
              s.hookedFishFrame = 0;
              s.hookedFishFrameTimer = 0;
              s.hookedFishVX = (Math.random() > 0.5 ? 1 : -1) * pred.speed;
              s.hookedFishSize = pred.sizeMultiplier;
              s.currentJunk = null;
              addParticles(s.hookX, waterY, 10, "#ff4444", 2.5, "splash");
              addRipple(s.hookX, waterY);
              s.screenShake = 6;
              s.predators.splice(pi, 1);
              continue;
            }
          }
          
          // Stealth attack on boat in murky weather
          const isMurky = s.weather === "storm" || s.weather === "rain" || s.weather === "fog";
          if (isMurky && s.inBoat && pred.attackCooldown <= 0) {
            const boatDist = Math.abs(pred.x - s.boatX) + Math.abs(pred.y - waterY);
            if (boatDist < 120 && Math.random() < 0.002 * dt) {
              pred.state = "attack";
              pred.stateTimer = 50;
              pred.frame = 0;
              pred.frameTimer = 0;
              pred.attackCooldown = 600;
              s.boatDamageShake = 15;
              s.screenShake = 12;
              s.predatorAlert = `${pred.type.name} attacks your boat!`;
              s.predatorAlertTimer = 180;
              addParticles(s.boatX, waterY, 20, "#5dade2", 4, "splash");
              addRipple(s.boatX, waterY);
            }
          }
          
          // Stealth push at dock in murky weather
          if (isMurky && !s.inBoat && !s.isSwimming && pred.attackCooldown <= 0) {
            const playerDist = Math.abs(pred.x - s.playerX) + Math.abs(pred.y - waterY);
            if (playerDist < 100 && Math.random() < 0.001 * dt) {
              pred.state = "attack";
              pred.stateTimer = 40;
              pred.frame = 0;
              pred.frameTimer = 0;
              pred.attackCooldown = 600;
              s.screenShake = 10;
              s.predatorAlert = `${pred.type.name} lurches from the depths!`;
              s.predatorAlertTimer = 180;
              addParticles(s.playerX, waterY, 15, "#5dade2", 3, "splash");
              addRipple(s.playerX, waterY);
            }
          }
        }
        
        // Murky visibility
        const isMurkyNow = s.weather === "storm" || s.weather === "rain" || s.weather === "fog";
        if (isMurkyNow) {
          pred.opacity = Math.max(0.08, pred.opacity - 0.003 * dt);
        } else {
          pred.opacity = Math.min(1.0, pred.opacity + 0.01 * dt);
        }
        
        // Cull offscreen predators
        const predCullLeft = -s.cameraX - 500;
        const predCullRight = -s.cameraX + W + 500;
        if ((pred.direction > 0 && pred.x > predCullRight + 200) || (pred.direction < 0 && pred.x < predCullLeft - 200)) {
          if (pred.state === "patrol" || pred.state === "flee") {
            s.predators.splice(pi, 1);
            continue;
          }
        }
        
        // Render predator
        const predDepth = (pred.y - waterY) / (H - waterY);
        const predDepthAlpha = 0.9 - predDepth * 0.3;
        const predWeatherVis = isMurkyNow ? (s.weather === "storm" ? 0.3 : s.weather === "fog" ? 0.4 : 0.5) : 1.0;
        ctx.globalAlpha = predDepthAlpha * pred.opacity * predWeatherVis;
        
        const predScale = SCALE * 0.8 * pred.sizeMultiplier;
        const PRED_FRAME = 96;
        let predSpriteSheet = `/assets/predators/${pred.type.folder}/Walk.png`;
        let predFrameCount = pred.type.walkFrames;
        
        if (pred.state === "attack") {
          predSpriteSheet = `/assets/predators/${pred.type.folder}/Attack1.png`;
          predFrameCount = pred.type.attackFrames;
        } else if (pred.state === "hurt") {
          predSpriteSheet = `/assets/predators/${pred.type.folder}/Hurt.png`;
          predFrameCount = pred.type.hurtFrames;
        } else if (pred.state === "death") {
          predSpriteSheet = `/assets/predators/${pred.type.folder}/Death.png`;
          predFrameCount = pred.type.deathFrames;
        } else if (pred.state === "patrol") {
          predSpriteSheet = `/assets/predators/${pred.type.folder}/Walk.png`;
          predFrameCount = pred.type.walkFrames;
        }
        
        // Draw predator sprite (96x96 frames)
        const predImg = imagesRef.current.get(predSpriteSheet);
        if (predImg) {
          ctx.save();
          const drawX = pred.direction < 0 ? pred.x + PRED_FRAME * predScale : pred.x;
          ctx.translate(drawX, pred.y);
          if (pred.direction < 0) ctx.scale(-1, 1);
          ctx.drawImage(
            predImg,
            pred.frame * PRED_FRAME, 0, PRED_FRAME, PRED_FRAME,
            0, 0, PRED_FRAME * predScale, PRED_FRAME * predScale
          );
          ctx.restore();
        }
        
        // Danger glow for predators
        if (pred.state !== "death" && pred.state !== "hurt") {
          const glowPulse = 0.15 + Math.sin(s.time * 0.05 + pred.x * 0.01) * 0.08;
          ctx.globalAlpha = glowPulse * pred.opacity;
          ctx.fillStyle = pred.type.name === "Shark" ? "#ff4444" : pred.type.name === "Kraken" ? "#6644ff" : "#ff6633";
          ctx.beginPath();
          const gx = pred.x + PRED_FRAME * predScale * 0.5;
          const gy = pred.y + PRED_FRAME * predScale * 0.4;
          ctx.ellipse(gx, gy, predScale * 30, predScale * 18, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.globalAlpha = 1;
      }

      // --- DRAW UNDERWATER PLANTS (in front of fish layer) ---
      if (plantSheet && plantSheet.complete) {
        for (const plant of s.underwaterPlants) {
          if (!plant.inFront) continue;
          const px = plant.worldX;
          if (px < viewL - 200 || px > viewR + 200) continue;
          const pt = PLANT_TYPES[plant.typeIdx];
          const drawW = pt.sw * plant.scale;
          const drawH = pt.sh * plant.scale;
          const sway = Math.sin(s.time * plant.swaySpeed + plant.phase) * plant.swayAmp * plant.scale;
          const drawY = plant.baseY - drawH;
          if (drawY < waterY) continue;
          ctx.save();
          ctx.globalAlpha = 0.7;
          const sliceCount = Math.max(4, Math.min(16, Math.floor(drawH / 8)));
          const sliceH = drawH / sliceCount;
          const srcSliceH = pt.sh / sliceCount;
          for (let sl = 0; sl < sliceCount; sl++) {
            const t = sl / sliceCount;
            const offsetX = sway * t * t;
            ctx.drawImage(
              plantSheet,
              pt.sx, pt.sy + sl * srcSliceH, pt.sw, srcSliceH,
              px - drawW / 2 + offsetX, drawY + sl * sliceH, drawW, sliceH + 1
            );
          }
          ctx.restore();
        }
      }

      // Predator alert text
      if (s.predatorAlertTimer > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const alertAlpha = Math.min(1, s.predatorAlertTimer / 30);
        ctx.globalAlpha = alertAlpha;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ff4444";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(s.predatorAlert, W / 2, 60);
        ctx.fillText(s.predatorAlert, W / 2, 60);
        ctx.restore();
      }

      if (s.headOfLegendsNotifTimer > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const notifAlpha = Math.min(1, s.headOfLegendsNotifTimer / 40);
        const notifY = 90 - Math.max(0, (300 - s.headOfLegendsNotifTimer) * 0.15);
        ctx.globalAlpha = notifAlpha;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#a855f7";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText("HEAD OF LEGENDS EARNED!", W / 2, notifY);
        ctx.fillText("HEAD OF LEGENDS EARNED!", W / 2, notifY);
        ctx.font = "10px monospace";
        ctx.fillStyle = "#fbbf24";
        ctx.strokeText("First catch: " + s.headOfLegendsNotif, W / 2, notifY + 18);
        ctx.fillText("First catch: " + s.headOfLegendsNotif, W / 2, notifY + 18);
        ctx.restore();
      }

      // Fisherman sprite with per-frame rod tip tracking (coordinates in un-flipped sprite space, facing right)
      const SPRITE_FRAME_W = 48;
      const fishRodTips: Record<string, [number, number][]> = {
        idle: [[43, 24], [43, 24], [43, 24], [43, 24]],
        fish: [[43, 24], [42, 24], [42, 25], [43, 24]],
        hook: [[43, 24], [36, 19], [35, 17], [34, 7], [27, 4], [25, 3]],
      };

      let fishermanFrame = Math.floor(s.time * 0.07) % 4;
      const charFolder = CHARACTER_VARIANTS[s.selectedCharacter].folder;
      let fishermanSprite = `/assets/${charFolder}/Fisherman_idle.png`;
      let fishermanFrameCount = 4;
      let rodTipKey = "idle";
      let isWalking = false;
      let fishingFlip = s.facingLeft;
      const charCenterX = fishermanX + (SPRITE_FRAME_W * SCALE) / 2;
      if (s.gameState === "casting") {
        fishingFlip = s.aimX < charCenterX;
      } else if (s.gameState === "waiting" || s.gameState === "bite" || s.gameState === "reeling" || s.gameState === "caught" || s.gameState === "missed") {
        fishingFlip = s.hookX < charCenterX;
      }

      if (s.gameState === "swimming") {
        const isMoving = s.keysDown.has("a") || s.keysDown.has("d") || s.keysDown.has("w") || s.keysDown.has("s");
        if (s.jumpVY !== 0) {
          fishermanSprite = `/assets/${charFolder}/Fisherman_jump.png`;
          fishermanFrameCount = 6;
          fishermanFrame = Math.max(0, Math.min(Math.floor((s.swimY - waterY + 50) / 15), 5));
        } else if (isMoving) {
          fishermanSprite = `/assets/${charFolder}/Fisherman_swim.png`;
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.12) % 6;
        } else {
          fishermanSprite = `/assets/${charFolder}/Fisherman_swim2.png`;
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.06) % 6;
        }
        rodTipKey = "";

        const swimmerDepth = (s.swimY - waterY) / (H - waterY);
        const swimAlpha = s.jumpVY !== 0 ? 1 : Math.max(0.3, 0.95 - swimmerDepth * 0.4);
        ctx.globalAlpha = swimAlpha;

        const spriteW = SPRITE_FRAME_W * SCALE;
        const spriteH = FRAME_H * SCALE;
        const pivotX = fishermanX + spriteW / 2;
        const pivotY = fishermanY + spriteH / 2;
        const angle = s.facingLeft ? -s.swimAngle : s.swimAngle;
        if (Math.abs(s.swimAngle) > 0.01) {
          ctx.save();
          ctx.translate(pivotX, pivotY);
          ctx.rotate(angle);
          ctx.translate(-pivotX, -pivotY);
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);
          ctx.restore();
        } else {
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);
        }

        if (isMoving && s.jumpVY === 0 && Math.random() < 0.06 * dt) {
          addParticles(s.swimX + (s.facingLeft ? -20 : 20), s.swimY, 2, "#88ccff", 1.5, "bubble");
        }
        ctx.globalAlpha = 1;
      } else if (s.gameState === "boarding") {
        if (s.boardingPhase === 0) {
          fishermanSprite = `/assets/${charFolder}/Fisherman_walk.png`;
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.12) % 6;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);
        } else if (s.boardingPhase === 1) {
          fishermanSprite = `/assets/${charFolder}/Fisherman_jump.png`;
          fishermanFrameCount = 6;
          fishermanFrame = Math.min(Math.floor(s.boardingTimer / 4), 5);
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, true);
        } else {
          fishermanSprite = `/assets/${charFolder}/Fisherman_idle.png`;
          fishermanFrameCount = 4;
          fishermanFrame = 0;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, true);
        }
        rodTipKey = "";
      } else if (s.gameState === "idle") {
        const moving = s.keysDown.has("a") || s.keysDown.has("d");
        if (s.inBoat) {
          if (s.boatRowing) {
            fishermanSprite = `/assets/${charFolder}/Fisherman_row.png`;
            fishermanFrameCount = 6;
            fishermanFrame = Math.floor(s.time * 0.14) % 6;
            rodTipKey = "";
          } else if (s.boatStanding) {
            fishermanSprite = `/assets/${charFolder}/Fisherman_idle.png`;
            fishermanFrameCount = 4;
            fishermanFrame = Math.floor(s.time * 0.04) % 4;
          } else {
            fishermanSprite = `/assets/${charFolder}/Fisherman_row.png`;
            fishermanFrameCount = 6;
            fishermanFrame = 0;
            rodTipKey = "";
          }
          const clipH = Math.floor(SPRITE_FRAME_W * SCALE * 0.2);
          ctx.save();
          ctx.beginPath();
          ctx.rect(fishermanX - 5, fishermanY, SPRITE_FRAME_W * SCALE + 10, SPRITE_FRAME_W * SCALE - clipH);
          ctx.clip();
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.boatRowing ? s.facingLeft : fishingFlip);
          ctx.restore();
        } else if (moving) {
          fishermanSprite = `/assets/${charFolder}/Fisherman_walk.png`;
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.12) % 6;
          isWalking = true;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);
        } else {
          fishermanSprite = `/assets/${charFolder}/Fisherman_idle.png`;
          fishermanFrameCount = 4;
          fishermanFrame = Math.floor(s.time * 0.04) % 4;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, fishingFlip);
        }
      } else {
        if (s.gameState === "casting") {
          fishermanSprite = `/assets/${charFolder}/Fisherman_attack.png`;
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.08) % 6;
          rodTipKey = "hook";
        } else if (s.gameState === "waiting") {
          fishermanSprite = `/assets/${charFolder}/Fisherman_fish.png`;
          fishermanFrameCount = 4;
          fishermanFrame = Math.floor(s.time * 0.05) % 4;
          rodTipKey = "fish";
        } else if (s.gameState === "bite") {
          fishermanSprite = `/assets/${charFolder}/Fisherman_hurt.png`;
          fishermanFrameCount = 2;
          fishermanFrame = Math.floor(s.time * 0.2) % 2;
          rodTipKey = "fish";
        } else if (s.gameState === "reeling") {
          fishermanSprite = `/assets/${charFolder}/Fisherman_fish.png`;
          fishermanFrameCount = 4;
          fishermanFrame = Math.floor(s.time * 0.15) % 4;
          rodTipKey = "fish";
        } else if (s.gameState === "caught") {
          fishermanSprite = `/assets/${charFolder}/Fisherman_fish.png`;
          fishermanFrameCount = 4;
          fishermanFrame = 3;
          rodTipKey = "fish";
        }
        if (s.inBoat) {
          const clipH = Math.floor(SPRITE_FRAME_W * SCALE * 0.2);
          ctx.save();
          ctx.beginPath();
          ctx.rect(fishermanX - 5, fishermanY, SPRITE_FRAME_W * SCALE + 10, SPRITE_FRAME_W * SCALE - clipH);
          ctx.clip();
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, fishingFlip);
          ctx.restore();
        } else {
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, fishingFlip);
        }
      }

      // Calculate rod tip position in screen coords from sprite-local coords
      // When flipped (facing left toward water), mirror the X coordinate
      let rodTipX = fishermanX + 10 * SCALE;
      let rodTipY = fishermanY + 8 * SCALE;
      if (rodTipKey && fishRodTips[rodTipKey]) {
        const tips = fishRodTips[rodTipKey];
        const tipLocal = tips[Math.min(fishermanFrame, tips.length - 1)];
        if (fishingFlip) {
          rodTipX = fishermanX + (SPRITE_FRAME_W - 1 - tipLocal[0]) * SCALE;
        } else {
          rodTipX = fishermanX + tipLocal[0] * SCALE;
        }
        rodTipY = fishermanY + tipLocal[1] * SCALE;
      }

      s.lastFishermanX = fishermanX;
      s.lastFishermanY = fishermanY;
      s.lastRodTipX = rodTipX;
      s.lastRodTipY = rodTipY;

      if (s.castLineActive && s.ropeSegments.length > 0) {
        s.ropeSegments[0].x = rodTipX;
        s.ropeSegments[0].y = rodTipY;
      }

      // Fishing line, bobber, hook, and hooked fish
      if (s.castLineFlying && s.ropeSegments.length > 0) {
        const lead = s.ropeSegments[s.ropeSegments.length - 1];
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(lead.x + 3, lead.y, 3.5, -0.3, Math.PI + 0.3);
        ctx.stroke();
        ctx.fillStyle = "#bbb";
        ctx.fillRect(lead.x + 2, lead.y - 4, 1.5, 4);
      }
      if (s.gameState === "waiting") {
        s.bobberBob = Math.sin(s.time * 0.08) * 2.5;
        const bobberX = s.hookX;
        let bobberY = waterY + s.bobberBob;
        s.lineWobble *= 0.93;

        const midX = (rodTipX + bobberX) / 2 + s.lineWobble;
        const sagAmount = Math.max(15, Math.abs(rodTipX - bobberX) * 0.08);
        const sagY = Math.max(rodTipY, bobberY) + sagAmount + Math.sin(s.time * 0.04) * 2;
        const drawLineCurve = () => {
          ctx.beginPath();
          ctx.moveTo(rodTipX, rodTipY);
          ctx.bezierCurveTo(
            rodTipX + (midX - rodTipX) * 0.4, rodTipY + sagAmount * 0.3,
            midX, sagY,
            bobberX, bobberY
          );
          ctx.stroke();
        };
        if (s.ropeSegments.length > 0) {
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(s.ropeSegments[0].x, s.ropeSegments[0].y);
          for (let i = 1; i < s.ropeSegments.length; i++) {
            ctx.lineTo(s.ropeSegments[i].x, s.ropeSegments[i].y);
          }
          ctx.stroke();
          ctx.strokeStyle = "rgba(200,190,170,0.95)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.ropeSegments[0].x, s.ropeSegments[0].y);
          for (let i = 1; i < s.ropeSegments.length; i++) {
            ctx.lineTo(s.ropeSegments[i].x, s.ropeSegments[i].y);
          }
          ctx.stroke();
        } else {
          drawLineCurve();
        }

        const bobberSize = 5;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bobberX, bobberY - 1, bobberSize, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(bobberX, bobberY + 1, bobberSize, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(bobberX - 1.5, bobberY - bobberSize - 4, 3, 5);

        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#88ccee";
        ctx.lineWidth = 0.8;
        const rSize = bobberSize + 2 + Math.sin(s.time * 0.06) * 1.5;
        ctx.beginPath();
        ctx.ellipse(bobberX, bobberY + 2, rSize, rSize * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = "rgba(180,170,150,0.5)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bobberX, bobberY + bobberSize + 1);
        ctx.lineTo(s.hookX, s.hookY);
        ctx.stroke();

        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(s.hookX + 3, s.hookY, 3.5, -0.3, Math.PI + 0.3);
        ctx.stroke();
        ctx.fillStyle = "#bbb";
        ctx.fillRect(s.hookX + 2, s.hookY - 4, 1.5, 4);
      }

      if (s.gameState === "bite" || s.gameState === "reeling") {
        const creatureScale = SCALE * 0.65 * s.hookedFishSize;
        const fishSpriteW = 48 * creatureScale;
        const fishMouthX = s.hookedFishX + (s.hookedFishDir > 0 ? fishSpriteW * 0.8 : fishSpriteW * 0.2);
        const fishMouthY = s.hookedFishY + 12 * creatureScale;

        s.lineWobble = s.gameState === "bite" ? Math.sin(s.time * 0.25) * 6 : Math.sin(s.time * 0.15) * 2;

        const midX = (rodTipX + fishMouthX) / 2 + s.lineWobble;
        const sagAmount = Math.max(10, Math.abs(rodTipX - fishMouthX) * 0.06);
        const sagY = Math.min(waterY + 5, Math.max(rodTipY, fishMouthY - 20)) + sagAmount;
        const drawFightLine = () => {
          ctx.beginPath();
          ctx.moveTo(rodTipX, rodTipY);
          ctx.bezierCurveTo(
            rodTipX + (midX - rodTipX) * 0.3, rodTipY + sagAmount * 0.2,
            midX, sagY,
            fishMouthX, fishMouthY
          );
          ctx.stroke();
        };
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = s.gameState === "bite" ? 5 : 4;
        drawFightLine();
        ctx.strokeStyle = s.gameState === "bite" ? "rgba(220,180,120,0.95)" : "rgba(200,190,170,0.95)";
        ctx.lineWidth = s.gameState === "bite" ? 3 : 2;
        drawFightLine();

        if (s.gameState === "bite") {
          if (Math.random() < 0.1 * dt) addRipple(fishMouthX + (Math.random() - 0.5) * 10, waterY);
        }

        const fishDepth = (s.hookedFishY - waterY) / (H - waterY);
        const depthAlpha = 0.9 - fishDepth * 0.25;
        ctx.globalAlpha = depthAlpha;

        const creatureFolder = s.currentCatch?.creatureFolder || "1";
        const walkFrames = s.currentCatch?.walkFrames || 4;
        drawSprite(
          `/assets/creatures/${creatureFolder}/Walk.png`,
          s.hookedFishFrame, walkFrames,
          s.hookedFishX, s.hookedFishY, creatureScale,
          s.hookedFishDir < 0,
          s.currentCatch?.tint || null
        );
        if (s.currentCatch?.rarity === "ultra_rare") {
          ctx.globalAlpha = 0.2 + Math.sin(s.time * 0.1) * 0.1;
          ctx.shadowColor = s.currentCatch.tint || "#ff2d55";
          ctx.shadowBlur = 25;
          drawSprite(
            `/assets/creatures/${creatureFolder}/Walk.png`,
            s.hookedFishFrame, walkFrames,
            s.hookedFishX, s.hookedFishY, creatureScale,
            s.hookedFishDir < 0
          );
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;

        if (s.gameState === "bite") {
          s.exclamationTimer += dt;
          const bounce = Math.abs(Math.sin(s.exclamationTimer * 0.15)) * 8;
          const exScale = 1 + Math.sin(s.exclamationTimer * 0.2) * 0.15;

          ctx.save();
          ctx.translate(fishMouthX, s.hookedFishY - 20 - bounce);
          ctx.scale(exScale, exScale);

          ctx.fillStyle = "rgba(0,0,0,0.6)";
          drawRoundRect(-22, -15, 44, 30, 8);
          ctx.fill();

          ctx.fillStyle = "#f1c40f";
          ctx.font = "bold 22px 'Press Start 2P', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("!", 0, 0);

          ctx.restore();
        }
      }

      // Crosshair and aim line during casting
      if (s.gameState === "casting") {
        ctx.strokeStyle = "rgba(200,190,170,0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        ctx.lineTo(s.aimX, s.aimY);
        ctx.stroke();
        ctx.setLineDash([]);

        const crossSize = 10;
        const pulse = 0.7 + Math.sin(s.time * 0.1) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.aimX - crossSize, s.aimY);
        ctx.lineTo(s.aimX + crossSize, s.aimY);
        ctx.moveTo(s.aimX, s.aimY - crossSize);
        ctx.lineTo(s.aimX, s.aimY + crossSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.aimX, s.aimY, crossSize + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }


      // Trace mode overlay - show rod tip, hook, rope segment markers
      if (s.traceMode) {
        ctx.fillStyle = "#ff2d55";
        ctx.beginPath();
        ctx.arc(rodTipX, rodTipY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ff2d55";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rodTipX - 12, rodTipY);
        ctx.lineTo(rodTipX + 12, rodTipY);
        ctx.moveTo(rodTipX, rodTipY - 12);
        ctx.lineTo(rodTipX, rodTipY + 12);
        ctx.stroke();
        ctx.fillStyle = "#ff2d55";
        ctx.font = "bold 7px monospace";
        ctx.fillText(`ROD TIP (${Math.round(rodTipX)},${Math.round(rodTipY)})`, rodTipX + 10, rodTipY - 8);

        if (s.gameState === "waiting" || s.gameState === "bite" || s.gameState === "reeling") {
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath();
          ctx.arc(s.hookX, s.hookY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText(`HOOK (${Math.round(s.hookX)},${Math.round(s.hookY)})`, s.hookX + 8, s.hookY - 6);
        }

        if (s.ropeSegments.length > 0) {
          s.ropeSegments.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? "#f1c40f" : i === s.ropeSegments.length - 1 ? "#e74c3c" : "#4fc3f7";
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "5px monospace";
            ctx.fillText(`${i}`, seg.x + 5, seg.y - 3);
          });
        }
      }

      // Show dock climb indicator when swimming near dock
      if (s.gameState === "swimming" && s.jumpVY === 0) {
        const nearDockX = s.swimX > pierStartX - 40 && s.swimX < W * 4.8;
        const nearDockY = s.swimY < waterY + 60;
        if (nearDockX && nearDockY) {
          const indicatorAlpha = 0.4 + Math.sin(s.time * 0.08) * 0.2;
          ctx.globalAlpha = indicatorAlpha;
          ctx.fillStyle = "#2ecc71";
          ctx.font = "bold 10px 'Press Start 2P', monospace";
          ctx.textAlign = "center";
          ctx.fillText("SPACE", s.swimX, pierY - 8);
          ctx.globalAlpha = 1;
        }
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.type === "splash") p.vy += 0.06 * dt;
        if (p.type === "sparkle") p.vy -= 0.02 * dt;
        p.life -= dt;
        if (p.life <= 0) { s.particles.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.3));
        ctx.fillStyle = p.color;
        if (p.type === "sparkle") {
          const sparkleSize = p.size * (1 + Math.sin(s.time * 0.3 + i) * 0.5);
          ctx.fillRect(p.x - sparkleSize / 2, p.y - 0.5, sparkleSize, 1);
          ctx.fillRect(p.x - 0.5, p.y - sparkleSize / 2, 1, sparkleSize);
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;

      // World-space catch fish rendering during cinematic phases
      if (s.gameState === "caught") {
        const catchAsset = s.currentCatch?.catchAsset || s.currentJunk?.asset;
        if (catchAsset) {
          const catchImg = getImg(catchAsset);
          if (catchImg && catchImg.complete) {
            const cs = 3 + Math.min(3, s.hookedFishSize);
            
            ctx.save();
            ctx.translate(s.catchFishWorldX, s.catchFishWorldY);
            ctx.rotate(s.catchFishRotation);
            
            if (s.catchPhase === 0) {
              const flopScale = 1 + Math.sin(s.catchFishFlipTimer * 0.5) * 0.1;
              ctx.scale(flopScale, 1 / flopScale);
            }
            
            if (s.currentCatch?.tint) {
              ctx.globalAlpha = 0.9;
            }

            if (s.currentCatch?.beachCrab && s.currentCatch?.spriteRow !== undefined) {
              const cfs = s.currentCatch.spriteFrameSize || CRAB_FRAME;
              const crabCS = cs * 2;
              const dw = cfs * crabCS;
              const dh = cfs * crabCS;
              ctx.drawImage(catchImg, 0, s.currentCatch.spriteRow * cfs, cfs, cfs, -dw / 2, -dh / 2, dw, dh);
            } else {
              const imgW = catchImg.width * cs;
              const imgH = catchImg.height * cs;
              ctx.drawImage(catchImg, -imgW / 2, -imgH / 2, imgW, imgH);
            }
            
            if (s.currentCatch?.rarity === "ultra_rare" && s.currentCatch?.tint) {
              ctx.globalAlpha = 0.3 + Math.sin(s.time * 0.08) * 0.15;
              ctx.shadowColor = s.currentCatch.tint;
              ctx.shadowBlur = 25;
              if (s.currentCatch?.beachCrab && s.currentCatch?.spriteRow !== undefined) {
                const cfs = s.currentCatch.spriteFrameSize || CRAB_FRAME;
                const crabCS = cs * 2;
                const dw = cfs * crabCS;
                const dh = cfs * crabCS;
                ctx.drawImage(catchImg, 0, s.currentCatch.spriteRow * cfs, cfs, cfs, -dw / 2, -dh / 2, dw, dh);
              } else {
                const imgW = catchImg.width * cs;
                const imgH = catchImg.height * cs;
                ctx.drawImage(catchImg, -imgW / 2, -imgH / 2, imgW, imgH);
              }
              ctx.shadowBlur = 0;
            }
            
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }
      }

      // End camera transform - everything after this is screen-space UI
      ctx.restore();

      // Game state logic - skip all updates when paused
      if (s.gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
      }

      if (s.gameState === "casting") {
        s.castPower += s.castDirection * 1.8 * dt;
        if (s.castPower >= 100) { s.castPower = 100; s.castDirection = -1; }
        if (s.castPower <= 0) { s.castPower = 0; s.castDirection = 1; }
      }

      if (s.gameState === "waiting") {
        s.waitTimer -= dt;
        s.hookY = Math.min(s.hookY + 0.4 * dt, s.hookTargetY);

        if (s.waitTimer <= 0) {
          const hasApproaching = s.swimmingFish.some(f => f.approachingHook);
          if (!hasApproaching) {
            const hookRange = 300;
            const nearbyFish = s.swimmingFish.filter(f =>
              Math.abs(f.x - s.hookX) < hookRange && !f.approachingHook
            );
            if (nearbyFish.length > 0) {
              const closest = nearbyFish.reduce((a, b) =>
                Math.abs(a.x - s.hookX) < Math.abs(b.x - s.hookX) ? a : b
              );
              closest.approachingHook = true;
            } else if (Math.random() < 0.15) {
              spawnFish(W, waterY, H);
              const newFish = s.swimmingFish[s.swimmingFish.length - 1];
              if (newFish) {
                newFish.x = s.hookX + (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 100);
                newFish.y = s.hookY + (Math.random() - 0.5) * 60;
                newFish.baseY = newFish.y;
                newFish.approachingHook = true;
              }
            }
            const vitWaitReduction = 1 + s.attributes.Vitality * 0.006 * (1 + s.attributes.Tactics * 0.005);
            const chumSpeedBoost = s.chumActiveType >= 0 ? CHUM_ITEMS[s.chumActiveType].biteSpeedBoost : 1;
            s.waitTimer = (30 + Math.random() * 50) / (LURES[s.equippedLure].speedBoost * vitWaitReduction * chumSpeedBoost);
          }
        }
      }

      // Rope physics simulation
      if (s.castLineActive && s.ropeSegments.length > 0) {
        const gravity = 0.3;
        const damping = 0.98;
        const segLen = ROPE_SEG_LEN;

        if (s.castLineFlying) {
          const lead = s.ropeSegments[s.ropeSegments.length - 1];
          s.castVelY += gravity * dt * 0.5;
          lead.ox = lead.x;
          lead.oy = lead.y;
          lead.x += s.castVelX * dt;
          lead.y += s.castVelY * dt;

          if (lead.y >= waterY) {
            lead.y = waterY;
            s.castLineFlying = false;
            s.castLineLanded = true;
            s.hookX = lead.x;
            s.hookY = waterY + 10;
            addParticles(lead.x, waterY, 15, "#5dade2", 3, "splash");
            addRipple(lead.x, waterY);
          }
        }

        const anchor = s.ropeSegments[0];
        anchor.x = s.lastRodTipX;
        anchor.y = s.lastRodTipY;

        for (let i = 1; i < s.ropeSegments.length - (s.castLineFlying ? 0 : 1); i++) {
          const seg = s.ropeSegments[i];
          const vx = (seg.x - seg.ox) * damping;
          const vy = (seg.y - seg.oy) * damping + gravity * 0.3;
          seg.ox = seg.x;
          seg.oy = seg.y;
          seg.x += vx;
          seg.y += vy;
        }

        for (let iter = 0; iter < 3; iter++) {
          for (let i = 0; i < s.ropeSegments.length - 1; i++) {
            const a = s.ropeSegments[i];
            const b = s.ropeSegments[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > segLen) {
              const diff = (dist - segLen) / dist * 0.5;
              if (i > 0) {
                a.x += dx * diff;
                a.y += dy * diff;
              }
              if (s.castLineFlying || i + 1 < s.ropeSegments.length - 1) {
                b.x -= dx * diff;
                b.y -= dy * diff;
              }
            }
          }
          s.ropeSegments[0].x = anchor.x;
          s.ropeSegments[0].y = anchor.y;
        }

        if (s.castLineLanded) {
          const lastSeg = s.ropeSegments[s.ropeSegments.length - 1];
          lastSeg.x = s.hookX;
          lastSeg.y = waterY + s.bobberBob;
        }
      }

      if (s.gameState === "bite") {
        s.biteTimer -= dt;
        if (s.biteTimer <= 0) {
          s.gameState = "missed";
          s.missReason = "Too slow! The fish escaped...";
          s.combo = 0;
          s.showCatchTimer = 100;
          syncUI();
        }
      }

      if (s.gameState === "reeling") {
        const a = s.attributes;
        const tacticsGlobal = 1 + a.Tactics * 0.005;

        const strMod = 1 + (a.Strength * 0.015 * tacticsGlobal);
        const agiMod = 1 + (a.Agility * 0.008 * tacticsGlobal);
        const dexMod = 1 + (a.Dexterity * 0.010 * tacticsGlobal);
        const endMod = 1 + (a.Endurance * 0.012 * tacticsGlobal);

        const rarityDiff = s.currentCatch
          ? (s.currentCatch.rarity === "ultra_rare" ? 2.2 : s.currentCatch.rarity === "legendary" ? 1.8 : s.currentCatch.rarity === "rare" ? 1.4 : s.currentCatch.rarity === "uncommon" ? 1.15 : 1)
          : 1;
        const sizeDiff = 1 + (s.hookedFishSize - 1) * 0.08;
        const difficultyMult = rarityDiff * Math.min(1.5, sizeDiff);

        const fishMass = difficultyMult * (0.8 + s.hookedFishSize * 0.2);
        const fishMoveSpeed = (s.currentCatch?.speed || 1.0) * 1.2 * difficultyMult;

        const dragForce = strMod * 0.6;
        const fishEscapeForce = fishMass * 0.4;
        const netForce = dragForce - fishEscapeForce;
        const dragDecel = Math.max(0, netForce * 0.02);

        s.hookedFishVX *= Math.max(0.85, 1 - dragDecel * dt * 0.01);
        s.hookedFishVY *= Math.max(0.88, 1 - dragDecel * dt * 0.008);
        s.hookedFishX += s.hookedFishVX * dt;
        s.hookedFishY += s.hookedFishVY * dt;
        s.hookedFishFrameTimer += dt;
        if (s.hookedFishFrameTimer > 6) {
          s.hookedFishFrameTimer = 0;
          s.hookedFishFrame = (s.hookedFishFrame + 1) % (s.currentCatch?.walkFrames || 4);
        }
        s.hookedFishDiveTimer -= dt;
        const dirChangeChance = (0.012 * difficultyMult) / (1 + a.Dexterity * 0.03 * tacticsGlobal);
        if (Math.random() < dirChangeChance * dt) {
          const burstForce = fishMoveSpeed * (0.5 + Math.random() * 0.8);
          const roll = Math.random();
          if (roll < 0.40) {
            s.hookedFishVX = (Math.random() > 0.5 ? 1 : -1) * burstForce / strMod;
          } else if (roll < 0.65) {
            s.hookedFishVY = burstForce * 0.6 / strMod;
            s.hookedFishDiveTimer = 30 + Math.random() * 40;
          } else if (roll < 0.85) {
            s.hookedFishVY = -burstForce * 0.5 / strMod;
          } else {
            s.hookedFishVX *= -1.2;
            s.hookedFishVY *= -0.8;
          }
        }
        s.hookedFishDir = s.hookedFishVX > 0 ? 1 : -1;
        s.hookedFishX = Math.max(worldLeft + 20, Math.min(worldRight - 20, s.hookedFishX));
        s.hookedFishY = Math.max(waterY + 15, Math.min(H - 30, s.hookedFishY));
        if (s.hookLineMaxDist > 0) {
          const dx = s.hookedFishX - s.playerX;
          const dy = s.hookedFishY - waterY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > s.hookLineMaxDist) {
            const ratio = s.hookLineMaxDist / dist;
            s.hookedFishX = s.playerX + dx * ratio;
            s.hookedFishY = waterY + dy * ratio;
          }
        }
        s.letOutLineCooldown = Math.max(0, s.letOutLineCooldown - dt);

        if (Math.random() < 0.03 * dt) {
          addParticles(s.hookedFishX, s.hookedFishY - 5, 2, "#88ccff", 1, "bubble");
        }

        const alignDist = Math.abs(s.playerX - s.hookedFishX);
        const maxAlignDist = W * 0.4;
        const alignment = Math.max(0, 1 - alignDist / maxAlignDist);
        const alignmentBonus = 0.6 + alignment * 0.4;

        const shopWorldX = W * 0.85 + (192 * 2.2) / 2;
        const distFromDock = Math.abs(s.playerX - shopWorldX);
        const maxDist = W * 4;
        const distRatio = Math.min(1, distFromDock / maxDist);
        const distanceMult = 0.5 + distRatio * 0.5;
        const fishSpeed = (0.004 + s.rodLevel * 0.0005) * difficultyMult * (1.0 / alignmentBonus) * distanceMult / (1 + a.Dexterity * 0.007 * tacticsGlobal);
        s.reelTarget += s.reelDirection * fishSpeed * dt;
        if (Math.random() < (0.008 * difficultyMult) * dt) s.reelDirection *= -1;
        if (s.reelTarget >= 0.88) { s.reelTarget = 0.88; s.reelDirection = -1; }
        if (s.reelTarget <= 0.12) { s.reelTarget = 0.12; s.reelDirection = 1; }

        const dtSec = dt / 60;

        const reelMoveSpeed = 0.40 * agiMod;
        if (s.isReeling) {
          s.reelProgress = Math.min(0.95, s.reelProgress + reelMoveSpeed * dtSec);
        } else if (s.isRightMouseDown) {
          s.reelProgress = Math.max(0.05, s.reelProgress - reelMoveSpeed * dtSec);
        } else {
          const driftRight = 0.05 * (1.0 / alignmentBonus) * dtSec / dexMod;
          s.reelProgress = Math.min(0.95, s.reelProgress + driftRight);
        }

        const rod = RODS[s.equippedRod];
        const catchZoneHalf = (0.08 + s.rodLevel * 0.015 + rod.catchZoneBonus + a.Strength * 0.003 * tacticsGlobal);
        const fishInZone = s.reelTarget >= (s.reelProgress - catchZoneHalf) && s.reelTarget <= (s.reelProgress + catchZoneHalf);

        let gaugeGainRate = 0.003 * alignmentBonus * rod.reelSpeedMult * strMod;
        if (fishInZone) {
          if (s.activeReelHeld && s.forceBar > 0) {
            const wisdomReduction = Math.max(0.5, 5 - a.Wisdom * 0.1);
            const baseForceCost = s.playerLevel * wisdomReduction;
            const intReduction = 1 - Math.min(0.9, a.Intellect * 0.02);
            const forceCostPerSec = baseForceCost * intReduction;
            const dtSec2 = dt / 60;
            s.forceBar = Math.max(0, s.forceBar - forceCostPerSec * dtSec2);
            gaugeGainRate *= 2.0;
            const pullForce = 0.5 * strMod;
            s.hookedFishX += (s.playerX - s.hookedFishX) * 0.002 * pullForce * dt;
            if (Math.random() < 0.06 * dt) addParticles(s.hookedFishX, s.hookedFishY, 3, "#3b82f6", 2, "sparkle");
          }
          s.reelGauge = Math.min(1.0, s.reelGauge + gaugeGainRate * dt);
          const liftForce = 0.3 * strMod;
          s.hookedFishY -= liftForce * dt;
          if (Math.random() < 0.04 * dt) addParticles(s.hookedFishX, s.hookedFishY, 2, "#2ecc71", 1.5, "sparkle");
        } else {
          const gaugeDrain = 0.004 * difficultyMult / (rod.lineStrength * endMod);
          s.reelGauge = Math.max(0, s.reelGauge - gaugeDrain * dt);
          const sinkForce = 0.15 / endMod;
          s.hookedFishY += sinkForce * dt;
        }
        if (!s.activeReelHeld || !fishInZone) {
          const forceRegenPerSec = 0.1 + 0.1 * a.Vitality;
          const dtSec3 = dt / 60;
          s.forceBar = Math.min(s.forceBarMax, s.forceBar + forceRegenPerSec * dtSec3);
        }

        if (s.reelGauge >= 1.0) {
          s.gameState = "caught";
          s.catchPhase = 0;
          s.catchPhaseTimer = 120;
          s.catchFishWorldX = s.hookedFishX;
          s.catchFishWorldY = s.hookedFishY;
          s.catchFishRotation = 0;
          s.catchSplashTimer = 0;
          s.catchFishFlipTimer = 0;
          s.showCatchTimer = 0;
          s.catchPopY = 0;
          s.combo++;
          if (s.combo > s.bestCombo) s.bestCombo = s.combo;
          s.totalCaught++;
          const sizeBonus = s.hookedFishSize;
          const pts = (s.currentCatch?.points || s.currentJunk?.points || 10) * sizeBonus * (1 + (s.combo - 1) * 0.15);
          s.score += Math.floor(pts);

          const fishWeight = Math.round(sizeBonus * (s.currentCatch?.points || 5) * 0.3 * 10) / 10;
          const name = s.currentCatch?.name || s.currentJunk?.name || "Unknown";
          const existing = s.caughtCollection.get(name);
          if (existing) {
            existing.count++;
            if (s.combo > existing.bestCombo) existing.bestCombo = s.combo;
            if (sizeBonus > existing.biggestSize) existing.biggestSize = sizeBonus;
            existing.totalWeight += fishWeight;
          } else {
            s.caughtCollection.set(name, { type: s.currentCatch, junk: s.currentJunk, count: 1, bestCombo: s.combo, biggestSize: sizeBonus, totalWeight: fishWeight });
          }

          const sellPrice = getSellPrice(s.currentCatch, s.currentJunk, sizeBonus);
          s.money += sellPrice;
          s.lastSellPrice = sellPrice;
          s.lastFishWeight = fishWeight;

          const mName = s.currentCatch?.name || s.currentJunk?.name || "";
          const mEntry = s.marketPrices.get(mName);
          if (mEntry) {
            mEntry.recentSold++;
            mEntry.lastSoldTime = s.time;
          } else {
            s.marketPrices.set(mName, { recentSold: 1, lastSoldTime: s.time });
          }

          if (s.currentCatch?.rarity === "ultra_rare" && !s.legendsCaught.has(name)) {
            s.legendsCaught.add(name);
            s.headOfLegends++;
            s.headOfLegendsNotif = name;
            s.headOfLegendsNotifTimer = 300;
          }

          if (sizeBonus > s.biggestCatchSize) {
            s.biggestCatchSize = sizeBonus;
            s.biggestCatchName = name;
            s.biggestCatchWeight = fishWeight;
          }

          s.sessionCatches++;

          if (s.playerName && s.currentCatch) {
            const submitData = {
              playerName: s.playerName,
              fishName: name,
              fishRarity: s.currentCatch.rarity,
              value: fishWeight,
              score: s.score,
              category: "biggest_catch",
            };
            fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(submitData),
            }).catch(() => {});

            const sessionMinutes = (Date.now() - s.sessionStartTime) / 60000;
            if (sessionMinutes <= 20) {
              fetch("/api/leaderboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  playerName: s.playerName,
                  fishName: null,
                  fishRarity: null,
                  value: s.sessionCatches,
                  score: s.score,
                  category: "session_catches",
                }),
              }).catch(() => {});
            }

            if (s.currentCatch.rarity === "legendary" || s.currentCatch.rarity === "ultra_rare") {
              fetch("/api/leaderboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  playerName: s.playerName,
                  fishName: name,
                  fishRarity: s.currentCatch.rarity,
                  value: fishWeight,
                  score: s.score,
                  category: "legendary_catches",
                }),
              }).catch(() => {});
            }
          }

          const bountyIdx = s.bounties.findIndex(b => b.fishName === name && sizeBonus >= b.minSize);
          if (bountyIdx >= 0) {
            const bountyTacticsBonus = 1 + s.attributes.Tactics * 0.01;
            s.money += Math.floor(s.bounties[bountyIdx].reward * bountyTacticsBonus);
            s.bounties.splice(bountyIdx, 1);
            if (s.bounties.length === 0) generateBounties();
          }

          for (const npc of s.npcs) {
            if (npc.request && !npc.request.completed && npc.request.fishName === name) {
              npc.request.fulfilled = Math.min(npc.request.fulfilled + 1, npc.request.count);
              if (npc.request.fulfilled >= npc.request.count) {
                npc.request.completed = true;
                s.money += npc.request.reward;
              }
            }
            if (npc.mission && !npc.mission.completed && npc.mission.fishName === name && fishWeight >= npc.mission.minSize) {
              npc.mission.caught = Math.min(npc.mission.caught + 1, npc.mission.count);
              if (npc.mission.caught >= npc.mission.count) {
                npc.mission.completed = true;
                s.money += npc.mission.reward;
              }
            }
          }

          if (s.totalCaught % 5 === 0 && s.rodLevel < 5) s.rodLevel++;

          const rarityXP: Record<string, number> = { common: 10, uncommon: 25, rare: 50, legendary: 100, ultra_rare: 200 };
          const intXPBonus = 1 + s.attributes.Intellect * 0.008 * (1 + s.attributes.Tactics * 0.005);
          const xpGain = Math.floor((rarityXP[s.currentCatch?.rarity || "common"] || 10) * sizeBonus * intXPBonus);
          s.playerXP += xpGain;
          while (s.playerXP >= s.playerXPToNext) {
            s.playerXP -= s.playerXPToNext;
            s.playerLevel++;
            s.attributePoints += 2;
            s.playerXPToNext = Math.floor(100 * Math.pow(1.15, s.playerLevel - 1));
          }

          s.catchHistory.unshift({ name, rarity: s.currentCatch?.rarity || "junk", size: sizeBonus, weight: fishWeight, sellPrice, timestamp: Date.now() });
          if (s.catchHistory.length > 50) s.catchHistory.length = 50;

          if (Math.random() < 0.05) {
            const catchableChumIdx = Math.random() < 0.5 ? 20 : 21;
            s.ownedChum[catchableChumIdx]++;
          }

          if (s.currentCatch?.beachCrab) {
            const baitCount = 1 + Math.floor(Math.random() * 2);
            for (let bi = 0; bi < baitCount; bi++) {
              const baitIdx = Math.random() < 0.5 ? 20 : 21;
              s.ownedChum[baitIdx]++;
            }
            const bonusXP = Math.floor(5 + Math.random() * 10);
            s.playerXP += bonusXP;
            while (s.playerXP >= s.playerXPToNext) {
              s.playerXP -= s.playerXPToNext;
              s.playerLevel++;
              s.attributePoints += 2;
              s.playerXPToNext = Math.floor(100 * Math.pow(1.15, s.playerLevel - 1));
            }
            s.money += Math.floor(3 + Math.random() * 8);
          }

          const fishWtSlot = Math.round(s.hookedFishSize * (s.currentCatch?.points || 5) * 0.3 * 10) / 10;
          const fishLengthSlot = Math.round(s.hookedFishSize * (s.currentCatch?.catchW || 20) * 0.8 * 10) / 10;
          const rarityStars = s.currentCatch?.rarity === "ultra_rare" ? 5 : s.currentCatch?.rarity === "legendary" ? 4 : s.currentCatch?.rarity === "rare" ? 3 : s.currentCatch?.rarity === "uncommon" ? 2 : 1;
          s.slotFinalWeight = fishWtSlot;
          s.slotFinalLength = fishLengthSlot;
          s.slotFinalStars = rarityStars;
          s.slotSpinPhase = 0;
          s.slotSpinTimer = 0;
          s.slotSpinSpeed = 0;
          s.slotSpinValue = 0;
          s.slotWeightRevealed = false;
          s.slotLengthRevealed = false;
          s.slotStarsRevealed = false;

          addParticles(s.hookedFishX, waterY, 25, "#f1c40f", 5, "sparkle");
          addParticles(s.hookedFishX, waterY, 15, "#ffffff", 3, "splash");
          addRipple(s.hookedFishX, waterY, 50);
          s.flashTimer = 12;
          s.screenShake = 5;
          syncUI();
        } else if (s.reelGauge <= 0) {
          s.gameState = "missed";
          s.missReason = "The fish broke free!";
          s.combo = 0;
          s.showCatchTimer = 100;
          syncUI();
        }

        if (s.time % 2 === 0) syncUI();
      }

      if (s.chumActiveTimer > 0) {
        s.chumActiveTimer -= dt;
        if (Math.random() < 0.05 * dt) {
          addParticles(s.playerX + (Math.random() - 0.5) * 40, waterY + 5, 1, "#88ffcc", 1, "bubble");
        }
        if (s.chumActiveTimer <= 0) {
          s.chumActiveType = -1;
          s.chumActiveTimer = 0;
        }
      }
      if (s.chumCooldown > 0) s.chumCooldown -= dt;
      if (s.netCooldown > 0) s.netCooldown -= dt;

      if (s.netActive) {
        s.netTimer -= dt;
        if (s.netTimer <= 0) {
          const netLeft = s.netCastX - s.netWidth / 2;
          const netRight = s.netCastX + s.netWidth / 2;
          const netTop = s.netCastY;
          const netBottom = s.netCastY + s.netDepth;
          const caughtFish = s.swimmingFish.filter(f =>
            f.x >= netLeft && f.x <= netRight && f.y >= netTop && f.y <= netBottom &&
            (f.type.rarity === "common" || f.type.rarity === "uncommon")
          );
          for (const fish of caughtFish) {
            const idx = s.swimmingFish.indexOf(fish);
            if (idx >= 0) s.swimmingFish.splice(idx, 1);
            const sz = fish.sizeMultiplier;
            const halfPrice = Math.floor(getSellPrice(fish.type, null, sz) * 0.5);
            s.money += halfPrice;
            s.totalCaught++;
            s.score += Math.floor(fish.type.points * sz * 0.5);
            const fishWeight = Math.round(sz * fish.type.points * 0.3 * 10) / 10;
            const existing = s.caughtCollection.get(fish.type.name);
            if (existing) { existing.count++; existing.totalWeight += fishWeight; }
            else { s.caughtCollection.set(fish.type.name, { type: fish.type, junk: null, count: 1, bestCombo: 0, biggestSize: sz, totalWeight: fishWeight }); }
            addParticles(fish.x, fish.y, 5, "#5dade2", 2, "splash");
          }
          if (Math.random() < 0.10) {
            const catchableChumIdx = Math.random() < 0.5 ? 20 : 21;
            s.ownedChum[catchableChumIdx]++;
          }
          s.netActive = false;
          s.netCooldown = 600;
          syncUI();
        }
      }

      if (s.gameState === "missed") {
        s.showCatchTimer -= dt;
        if (s.showCatchTimer <= 0) {
          s.gameState = "idle";
          s.currentCatch = null;
          s.currentJunk = null;
          s.ropeSegments = [];
          s.castLineActive = false;
          s.castLineLanded = false;
          if (s.inBoat) { s.boatStanding = false; s.boatRowing = false; }
          syncUI();
        }
      }

      if (s.gameState === "caught") {
        s.catchPhaseTimer -= dt;
        
        if (s.catchPhase === 0) {
          s.catchFishWorldY -= 0.3 * dt;
          s.catchFishRotation = Math.sin(s.time * 0.3) * 0.4;
          s.catchFishFlipTimer += dt;
          s.catchSplashTimer -= dt;
          if (s.catchSplashTimer <= 0) {
            addParticles(s.catchFishWorldX, s.catchFishWorldY, 3, "#5dade2", 3, "splash");
            addRipple(s.catchFishWorldX, s.catchFishWorldY + 5, 20);
            s.catchSplashTimer = 8 + Math.random() * 6;
          }
          if (s.catchPhaseTimer <= 0) {
            s.catchPhase = 1;
            s.catchPhaseTimer = 120;
            const charX = s.inBoat ? s.boatX + 50 : s.playerX;
            const charY = pierY - FRAME_H * SCALE - 20;
            s.catchFishTargetY = charY;
          }
        } else if (s.catchPhase === 1) {
          const charX = s.inBoat ? s.boatX + 50 : s.playerX;
          s.catchFishWorldX += (charX - s.catchFishWorldX) * 0.03 * dt;
          s.catchFishWorldY += (s.catchFishTargetY - s.catchFishWorldY) * 0.04 * dt;
          s.catchFishRotation *= 0.95;
          if (Math.random() < 0.15 * dt) {
            addParticles(s.catchFishWorldX + (Math.random()-0.5)*20, s.catchFishWorldY, 1, "#f1c40f", 1, "sparkle");
          }
          if (s.catchPhaseTimer <= 0) {
            s.catchPhase = 2;
            s.catchPhaseTimer = 300;
            s.slotSpinPhase = 0;
            s.slotSpinTimer = 60;
            s.slotSpinSpeed = 15;
            s.slotSpinValue = Math.random() * 100;
          }
        } else if (s.catchPhase === 2) {
          const charX = s.inBoat ? s.boatX + 50 : s.playerX;
          s.catchFishWorldX += (charX - s.catchFishWorldX) * 0.05 * dt;
          s.catchFishWorldY = s.catchFishTargetY + Math.sin(s.time * 0.05) * 3;
          s.catchFishRotation = 0;
          
          s.slotSpinTimer -= dt;
          s.slotSpinSpeed *= 0.97;
          s.slotSpinValue += s.slotSpinSpeed * dt;
          
          if (s.slotSpinSpeed < 0.5 || s.slotSpinTimer <= 0) {
            if (s.slotSpinPhase === 0 && !s.slotWeightRevealed) {
              s.slotWeightRevealed = true;
              s.slotSpinPhase = 1;
              s.slotSpinTimer = 60;
              s.slotSpinSpeed = 12;
              s.slotSpinValue = Math.random() * 50;
              addParticles(W / 2 - s.cameraX, H / 2 - 30, 8, "#f1c40f", 3, "sparkle");
            } else if (s.slotSpinPhase === 1 && !s.slotLengthRevealed) {
              s.slotLengthRevealed = true;
              s.slotSpinPhase = 2;
              s.slotSpinTimer = 80;
              s.slotSpinSpeed = 10;
              s.slotSpinValue = 0;
            } else if (s.slotSpinPhase === 2 && !s.slotStarsRevealed) {
              s.slotStarsRevealed = true;
              s.catchPhaseTimer = 120;
            }
          }
          
          if (s.slotWeightRevealed && s.slotLengthRevealed && s.slotStarsRevealed) {
            if (s.catchPhaseTimer <= 0) {
              s.gameState = "idle";
              s.currentCatch = null;
              s.currentJunk = null;
              s.ropeSegments = [];
              s.castLineActive = false;
              s.castLineLanded = false;
              if (s.inBoat) { s.boatStanding = false; s.boatRowing = false; }
              syncUI();
            }
          }
        }
      }

      // Caught display - screen space UI
      if (s.gameState === "caught") {
        if (s.catchPhase === 2) {
          const slotBoxW = Math.min(360, W * 0.85);
          const slotBoxH = 180;
          const slotBoxX = W / 2 - slotBoxW / 2;
          const slotBoxY = H / 2 + 20;
          
          ctx.fillStyle = "rgba(8,15,25,0.9)";
          drawRoundRect(slotBoxX, slotBoxY, slotBoxW, slotBoxH, 12);
          ctx.fill();
          
          const rarCol = s.currentCatch?.rarity === "ultra_rare" ? "#ff6b35" :
                         s.currentCatch?.rarity === "legendary" ? "#a855f7" :
                         s.currentCatch?.rarity === "rare" ? "#3b82f6" :
                         s.currentCatch?.rarity === "uncommon" ? "#22c55e" : "#f59e0b";
          ctx.strokeStyle = rarCol;
          ctx.lineWidth = 2;
          drawRoundRect(slotBoxX, slotBoxY, slotBoxW, slotBoxH, 12);
          ctx.stroke();
          
          ctx.textAlign = "center";
          ctx.fillStyle = rarCol;
          ctx.font = "bold 14px 'Press Start 2P', monospace";
          ctx.fillText(s.currentCatch?.name || s.currentJunk?.name || "", W / 2, slotBoxY + 25);
          
          const row1Y = slotBoxY + 55;
          ctx.font = "9px 'Press Start 2P', monospace";
          ctx.fillStyle = "#78909c";
          ctx.fillText("WEIGHT", W / 2 - 80, row1Y);
          if (s.slotWeightRevealed) {
            ctx.fillStyle = "#ecf0f1";
            ctx.font = "bold 16px 'Press Start 2P', monospace";
            ctx.fillText(`${s.slotFinalWeight} lbs`, W / 2 + 40, row1Y);
          } else if (s.slotSpinPhase === 0) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "bold 16px 'Press Start 2P', monospace";
            const spinDisplay = (Math.abs(s.slotSpinValue) % 200).toFixed(1);
            ctx.fillText(`${spinDisplay} lbs`, W / 2 + 40, row1Y);
          } else {
            ctx.fillStyle = "#3a3a3a";
            ctx.font = "bold 16px 'Press Start 2P', monospace";
            ctx.fillText("---", W / 2 + 40, row1Y);
          }
          
          const row2Y = slotBoxY + 95;
          ctx.font = "9px 'Press Start 2P', monospace";
          ctx.fillStyle = "#78909c";
          ctx.fillText("LENGTH", W / 2 - 80, row2Y);
          if (s.slotLengthRevealed) {
            ctx.fillStyle = "#ecf0f1";
            ctx.font = "bold 16px 'Press Start 2P', monospace";
            ctx.fillText(`${s.slotFinalLength} in`, W / 2 + 40, row2Y);
            const lineW = Math.min(slotBoxW - 40, s.slotFinalLength * 2);
            ctx.strokeStyle = "#f1c40f";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(W / 2 - lineW / 2, row2Y + 12);
            ctx.lineTo(W / 2 + lineW / 2, row2Y + 12);
            ctx.stroke();
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath(); ctx.arc(W / 2 - lineW / 2, row2Y + 12, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(W / 2 + lineW / 2, row2Y + 12, 4, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 1;
          } else if (s.slotSpinPhase === 1) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "bold 16px 'Press Start 2P', monospace";
            const spinDisplay = (Math.abs(s.slotSpinValue) % 150).toFixed(1);
            ctx.fillText(`${spinDisplay} in`, W / 2 + 40, row2Y);
          } else {
            ctx.fillStyle = "#3a3a3a";
            ctx.font = "bold 16px 'Press Start 2P', monospace";
            ctx.fillText("---", W / 2 + 40, row2Y);
          }
          
          const row3Y = slotBoxY + 135;
          ctx.font = "9px 'Press Start 2P', monospace";
          ctx.fillStyle = "#78909c";
          ctx.fillText("RARITY", W / 2 - 80, row3Y);
          
          const starColors = ["#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ff6b35"];
          
          if (s.slotStarsRevealed) {
            const finalStars = s.slotFinalStars;
            const starSize = 12;
            const totalStarW = finalStars * (starSize + 6);
            const startX = W / 2 - totalStarW / 2 + 20;
            for (let si = 0; si < finalStars; si++) {
              const sx = startX + si * (starSize + 6);
              ctx.fillStyle = starColors[finalStars - 1];
              drawStar(ctx, sx, row3Y - 3, starSize / 2, starSize / 4, 5);
            }
          } else if (s.slotSpinPhase === 2) {
            const spinIdx = Math.floor(Math.abs(s.slotSpinValue)) % 5;
            const spinStars = spinIdx + 1;
            const starSize = 12;
            const totalStarW = spinStars * (starSize + 6);
            const startX = W / 2 - totalStarW / 2 + 20;
            for (let si = 0; si < spinStars; si++) {
              const sx = startX + si * (starSize + 6);
              ctx.fillStyle = starColors[spinIdx];
              drawStar(ctx, sx, row3Y - 3, starSize / 2, starSize / 4, 5);
            }
          } else {
            ctx.fillStyle = "#3a3a3a";
            ctx.font = "bold 16px 'Press Start 2P', monospace";
            ctx.fillText("---", W / 2 + 40, row3Y);
          }
          
          ctx.fillStyle = "#2ecc71";
          ctx.font = "10px 'Press Start 2P', monospace";
          const sellTxt = `+ ${s.lastSellPrice}`;
          const sellTxtW = ctx.measureText(sellTxt).width;
          const gbuxCatch = getImg("/assets/icons/gbux.png");
          const gbuxSzC = 10;
          if (gbuxCatch) ctx.drawImage(gbuxCatch, W / 2 - sellTxtW / 2 - gbuxSzC - 2, slotBoxY + slotBoxH - 18, gbuxSzC, gbuxSzC);
          ctx.fillText(sellTxt, W / 2, slotBoxY + slotBoxH - 10);
          
          if (s.combo > 1) {
            ctx.fillStyle = "#e74c3c";
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillText(`x${s.combo} COMBO!`, W / 2, slotBoxY + slotBoxH + 8);
          }
          
          ctx.textAlign = "left";
        }
        
        if (s.catchPhase === 0 || s.catchPhase === 1) {
          ctx.textAlign = "center";
          ctx.fillStyle = "#f1c40f";
          ctx.font = "bold 22px 'Press Start 2P', monospace";
          ctx.fillText("CAUGHT!", W / 2, 60);
          
          const catchName = s.currentCatch?.name || s.currentJunk?.name || "";
          const rarityColor2 = s.currentCatch ?
            (s.currentCatch.rarity === "ultra_rare" ? "#ff6b35" :
             s.currentCatch.rarity === "legendary" ? "#a855f7" :
             s.currentCatch.rarity === "rare" ? "#3b82f6" :
             s.currentCatch.rarity === "uncommon" ? "#22c55e" : "#ecf0f1") : "#ecf0f1";
          ctx.fillStyle = rarityColor2;
          ctx.font = "bold 12px 'Press Start 2P', monospace";
          ctx.fillText(catchName, W / 2, 85);
          ctx.textAlign = "left";
        }
      }

      // Binoculars scope overlay
      if (s.binoculars && s.gameState !== "intro" && s.gameState !== "title" && s.gameState !== "charSelect") {
        ctx.save();
        const vigR = Math.min(W, H) * 0.42;
        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, vigR * 0.7, W / 2, H / 2, vigR);
        vigGrad.addColorStop(0, "rgba(0,0,0,0)");
        vigGrad.addColorStop(0.6, "rgba(0,0,0,0.15)");
        vigGrad.addColorStop(0.85, "rgba(0,0,0,0.6)");
        vigGrad.addColorStop(1, "rgba(0,0,0,0.85)");
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "rgba(120,180,255,0.15)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2, H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(120,180,255,0.08)";
        ctx.lineWidth = 0.5;
        for (let cr = 40; cr < vigR; cr += 60) {
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, cr, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(120,180,255,0.7)";
        ctx.font = "bold 5px 'Press Start 2P', monospace";
        ctx.textAlign = "left";
        const worldCenterX = Math.round(-s.cameraX + W / 2);
        ctx.fillText(`X: ${worldCenterX}`, 8, H - 12);
        ctx.fillText("BINOCULARS", 8, 12);
        ctx.textAlign = "right";
        ctx.fillText("[5] EXIT", W - 8, 12);
        ctx.textAlign = "left";
        ctx.restore();
      }

      // Flash
      if (s.flashTimer > 0) {
        s.flashTimer -= dt;
        ctx.globalAlpha = s.flashTimer / 12 * 0.15;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      if (s.gameState === "intro") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, W, H);
        requestAnimationFrame(gameLoop);
        return;
      }

      // Title screen & charSelect - shared background
      if (s.gameState === "title" || s.gameState === "charSelect") {
        ctx.fillStyle = "rgba(0,10,30,0.45)";
        ctx.fillRect(0, 0, W, H);

        const creatureDefs = [
          { folder: "1", walkFrames: 4, speed: 0.9, scale: 1.8, yBase: 0.48, yAmp: 8 },
          { folder: "1", walkFrames: 4, speed: 1.3, scale: 1.4, yBase: 0.62, yAmp: 5 },
          { folder: "2", walkFrames: 6, speed: 0.7, scale: 2.0, yBase: 0.55, yAmp: 10 },
          { folder: "2", walkFrames: 6, speed: 1.1, scale: 1.5, yBase: 0.72, yAmp: 6 },
          { folder: "3", walkFrames: 4, speed: 1.0, scale: 1.7, yBase: 0.50, yAmp: 7 },
          { folder: "3", walkFrames: 4, speed: 1.4, scale: 1.3, yBase: 0.68, yAmp: 9 },
          { folder: "4", walkFrames: 4, speed: 0.6, scale: 1.9, yBase: 0.58, yAmp: 12 },
          { folder: "4", walkFrames: 4, speed: 1.2, scale: 1.4, yBase: 0.78, yAmp: 5 },
          { folder: "5", walkFrames: 6, speed: 1.5, scale: 1.6, yBase: 0.45, yAmp: 6 },
          { folder: "5", walkFrames: 6, speed: 0.8, scale: 1.3, yBase: 0.65, yAmp: 8 },
          { folder: "6", walkFrames: 6, speed: 0.35, scale: 2.8, yBase: 0.82, yAmp: 14 },
          { folder: "6", walkFrames: 6, speed: 0.55, scale: 2.2, yBase: 0.60, yAmp: 10 },
          { folder: "1", walkFrames: 4, speed: 1.6, scale: 1.2, yBase: 0.88, yAmp: 4 },
          { folder: "3", walkFrames: 4, speed: 0.5, scale: 2.1, yBase: 0.75, yAmp: 11 },
          { folder: "5", walkFrames: 6, speed: 1.8, scale: 1.1, yBase: 0.52, yAmp: 5 },
          { folder: "2", walkFrames: 6, speed: 0.9, scale: 1.7, yBase: 0.85, yAmp: 7 },
        ];
        for (let i = 0; i < creatureDefs.length; i++) {
          const cd = creatureDefs[i];
          const swimDir = i % 2 === 0 ? 1 : -1;
          const swimRange = W + 120;
          const phase = (s.time * cd.speed * 0.55 + i * 173) % swimRange;
          const cx = swimDir > 0 ? -60 + phase : W + 60 - phase;
          const bobY = Math.sin(s.time * 0.04 + i * 1.9) * cd.yAmp;
          const frame = Math.floor(s.time * 0.065 * cd.speed) % cd.walkFrames;
          const depth = cd.yBase;
          const depthAlpha = depth > 0.75 ? 0.5 : depth > 0.6 ? 0.7 : 0.85;
          ctx.globalAlpha = depthAlpha;
          drawSprite(`/assets/creatures/${cd.folder}/Walk.png`, frame, cd.walkFrames, cx, H * cd.yBase + bobY, cd.scale, swimDir < 0);
        }
        ctx.globalAlpha = 1;

        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 25; i++) {
          const bx = (i * 113 + s.time * 0.3) % W;
          const by = H * 0.4 + ((i * 89 + s.time * 0.15) % (H * 0.55));
          const br = 1.5 + Math.sin(s.time * 0.025 + i * 1.3) * 1;
          ctx.fillStyle = "#88ccff";
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Title screen text only
      if (s.gameState === "title") {
        const titleY = H * 0.25;

        ctx.shadowColor = "#3498db";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#4fc3f7";
        ctx.font = "bold 48px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText("GRUDGE", W / 2, titleY);
        ctx.shadowColor = "#f1c40f";
        ctx.fillStyle = "#ffd54f";
        ctx.fillText("ANGELER", W / 2, titleY + 58);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#90a4ae";
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText("A Pixel Art Fishing Adventure", W / 2, titleY + 90);

        const blink = Math.sin(s.time * 0.06) > -0.2;
        if (blink) {
          ctx.fillStyle = "#ecf0f1";
          ctx.font = "14px 'Press Start 2P', monospace";
          ctx.fillText("CLICK TO ENTER", W / 2, titleY + 150);
        }

        const logoImg = imagesRef.current.get("/assets/logo.png");
        if (logoImg && logoImg.complete) {
          const logoSize = 320;
          ctx.drawImage(logoImg, W / 2 - logoSize / 2, titleY + 170, logoSize, logoSize);
        }

        ctx.fillStyle = "#607d8b";
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillText("CLICK to cast | AIM with mouse | A/D to walk", W / 2, H * 0.92);
        ctx.fillText("SPACE to swim | RIGHT-CLICK to cancel", W / 2, H * 0.92 + 16);
      }

      // charSelect overlay dimming
      if (s.gameState === "charSelect") {
        ctx.fillStyle = "rgba(0,5,15,0.55)";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();

      syncUI();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onDocMouseMove);
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("mouseup", onDocMouseUp);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("touchstart", onDocTouchStart);
      document.removeEventListener("touchend", onDocTouchEnd);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, [loadImage, spawnFish, addParticles, addRipple, syncUI, generateBounties, getSellPrice]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.gizmoEnabled || !s.adminOpen) return;
    const worldX = e.clientX - s.cameraX;
    const worldY = e.clientY - s.cameraY;
    for (let i = s.worldObjects.length - 1; i >= 0; i--) {
      const obj = s.worldObjects[i];
      const img = imagesRef.current.get(obj.sprite);
      if (!img || !img.complete) continue;
      const w = img.width * obj.scale;
      const h = img.height * obj.scale;
      if (worldX >= obj.x && worldX <= obj.x + w && worldY >= obj.y && worldY <= obj.y + h) {
        s.gizmoSelected = i;
        s.gizmoDragging = true;
        s.gizmoDragOffX = worldX - obj.x;
        s.gizmoDragOffY = worldY - obj.y;
        syncUI();
        return;
      }
    }
    s.gizmoSelected = -1;
    syncUI();
  }, [syncUI]);

  const handleCanvasMouseUp = useCallback(() => {
    const s = stateRef.current;
    s.gizmoDragging = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (s.gizmoDragging || (s.gizmoEnabled && s.adminOpen)) return;

    const W = canvas.width;
    const H = canvas.height;
    const waterY = H * 0.42;
    const defaultFX = W * 0.45;

    if (s.gameState === "intro") {
      return;
    }

    if (s.gameState === "title") {
      s.gameState = "charSelect";
      syncUI();
      return;
    }

    if (s.gameState === "charSelect") {
      return;
    }

    if (s.gameState === "store") {
      return;
    }

    if (s.gameState === "swimming" || s.gameState === "boarding") {
      return;
    }

    if (s.gameState === "idle") {
      if (s.toolMode === "net") {
        if (s.netCooldown > 0) return;
        s.netActive = true;
        s.netCastX = (s.mouseX - s.cameraX) || (s.playerX - 100);
        s.netCastY = Math.max(waterY + 20, s.mouseY || (waterY + 60));
        s.netWidth = 60 + s.attributes.Strength * 3 + s.attributes.Dexterity * 2;
        s.netDepth = 40 + s.attributes.Endurance * 2;
        s.netTimer = 120;
        addParticles(s.netCastX, waterY, 10, "#5dade2", 3, "splash");
        addRipple(s.netCastX, waterY);
        syncUI();
        return;
      }
      s.binoculars = false;
      s.gameState = "casting";
      s.castPower = 0;
      s.castDirection = 1;
      if (s.inBoat) {
        s.boatStanding = true;
        s.boatRowing = false;
        s.aimX = (s.mouseX - s.cameraX) || (s.playerX - 100);
        s.aimY = Math.max(waterY + 20, s.mouseY || (waterY + 60));
      } else {
        s.aimX = s.playerX - 100;
        s.aimY = waterY + 60;
      }
      syncUI();
      return;
    }

    if (s.gameState === "casting") {
      s.gameState = "waiting";
      s.hookX = s.aimX;
      s.hookY = waterY + 10;
      s.hookTargetY = Math.max(waterY + 30, s.aimY);
      s.castLineActive = true;
      s.castLineFlying = true;
      s.castLineLanded = false;
      const castDist = Math.abs(s.aimX - s.playerX);
      const castSpeed = 6 + castDist * 0.008;
      s.castVelX = s.aimX < s.playerX ? -castSpeed : castSpeed;
      s.castVelY = -8;
      const rtX = s.lastRodTipX || (s.lastFishermanX + 10 * SCALE);
      const rtY = s.lastRodTipY || (s.lastFishermanY + 8 * SCALE);
      s.ropeSegments = [];
      for (let i = 0; i < 12; i++) {
        s.ropeSegments.push({ x: rtX, y: rtY, ox: rtX, oy: rtY });
      }
      s.waitTimer = 20 + Math.random() * 40;
      s.swimmingFish.forEach(f => { f.approachingHook = false; });
      syncUI();
      return;
    }

    if (s.gameState === "bite") {
      s.gameState = "reeling";
      s.reelProgress = 0.5;
      s.reelTarget = 0.3 + Math.random() * 0.4;
      s.reelDirection = Math.random() > 0.5 ? 1 : -1;
      s.reelGauge = 0.5;
      s.isReeling = false;
      s.isRightMouseDown = false;
      s.resilience = Math.min(8, 2 + Math.floor(s.attributes.Endurance / 5));
      s.resilienceMax = s.resilience;
      s.forceBarMax = 10 + Math.max(s.attributes.Strength, s.attributes.Agility);
      s.forceBar = s.forceBarMax;
      s.hookedFishVY = 0;
      s.hookLineMaxDist = Math.sqrt((s.hookedFishX - s.playerX) ** 2 + (s.hookedFishY - (canvas ? canvas.height * 0.42 : 300)) ** 2);
      syncUI();
      return;
    }

    if (s.gameState === "reeling") {
      return;
    }

    if (s.gameState === "caught" || s.gameState === "missed") {
      if (s.gameState === "caught") {
        if (s.catchPhase < 2) {
          s.catchPhaseTimer = 0;
        } else if (s.slotWeightRevealed && s.slotLengthRevealed && s.slotStarsRevealed) {
          s.gameState = "idle";
          s.currentCatch = null;
          s.currentJunk = null;
          if (s.inBoat) { s.boatStanding = false; s.boatRowing = false; }
          syncUI();
        } else {
          s.slotSpinTimer = 0;
          s.slotSpinSpeed = 0;
        }
        return;
      }
      s.showCatchTimer = 0;
      s.gameState = "idle";
      s.currentCatch = null;
      s.currentJunk = null;
      syncUI();
      return;
    }
  }, [spawnFish, addParticles, addRipple, syncUI]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    s.mouseX = e.clientX;
    s.mouseY = e.clientY;
    if (s.gizmoDragging && s.gizmoSelected >= 0) {
      const worldX = e.clientX - s.cameraX;
      const worldY = e.clientY - s.cameraY;
      s.worldObjects[s.gizmoSelected].x = worldX - s.gizmoDragOffX;
      s.worldObjects[s.gizmoSelected].y = worldY - s.gizmoDragOffY;
    }
  }, []);

  const handleTouchMove = useCallback((_e: React.TouchEvent<HTMLCanvasElement>) => {
  }, []);

  const rarityColor = (rarity: string) => {
    switch (rarity) {
      case "ultra_rare": return "#ff2d55";
      case "legendary": return "#f59e0b";
      case "rare": return "#a855f7";
      case "uncommon": return "#22c55e";
      default: return "#94a3b8";
    }
  };

  const rarityBg = (rarity: string) => {
    switch (rarity) {
      case "ultra_rare": return "rgba(255,45,85,0.12)";
      case "legendary": return "rgba(245,158,11,0.1)";
      case "rare": return "rgba(168,85,247,0.1)";
      case "uncommon": return "rgba(34,197,94,0.1)";
      default: return "rgba(148,163,184,0.05)";
    }
  };

  const [showCollection, setShowCollection] = useState(false);
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [charPanelTab, setCharPanelTab] = useState<"stats" | "equipment" | "history" | "collection">("stats");
  const [introActive, setIntroActive] = useState(true);
  const introVideoRef = useRef<HTMLVideoElement>(null);

  const advanceIntro = useCallback(() => {
    stateRef.current.gameState = "title";
    syncUI();
    setIntroActive(false);
  }, [syncUI]);

  useEffect(() => {
    if (uiState.gameState !== "intro" || !introActive) return;
    const vid = introVideoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    const playPromise = vid.play();
    if (playPromise) playPromise.catch(() => {
      advanceIntro();
    });
  }, [uiState.gameState, introActive, advanceIntro]);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ fontFamily: "'Press Start 2P', monospace", background: "#0a0f1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: uiState.gizmoEnabled ? "move" : uiState.gameState === "casting" ? "crosshair" : "default" }}
        onClick={handleClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        data-testid="game-canvas"
      />

      {uiState.gameState === "intro" && introActive && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 20, background: "#000", cursor: "pointer" }}
          onClick={advanceIntro}
          data-testid="intro-overlay"
        >
          <video
            ref={introVideoRef}
            src="https://i.imgur.com/wSesBRh.mp4"
            onEnded={advanceIntro}
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            data-testid="intro-video"
          />
          <div style={{
            position: "absolute", bottom: 24, right: 24,
            color: "rgba(255,255,255,0.4)", fontSize: 8,
            fontFamily: "'Press Start 2P', monospace",
          }}>CLICK TO SKIP</div>
        </div>
      )}

      {/* Character Select Screen - HTML Overlay */}
      {uiState.gameState === "charSelect" && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: "'Press Start 2P', monospace", zIndex: 10 }} data-testid="char-select-screen">
          <div className="flex flex-col items-center gap-6" style={{ background: "rgba(5,12,30,0.92)", borderRadius: 16, border: "2px solid rgba(79,195,247,0.3)", padding: "32px 40px", maxWidth: 520, width: "90%" }}>
            <div className="text-center">
              <div style={{ color: "#4fc3f7", fontSize: 20, marginBottom: 4, textShadow: "0 0 20px rgba(79,195,247,0.5)" }}>GRUDGE ANGELER</div>
              <div style={{ color: "#607d8b", fontSize: 8 }}>Choose your character</div>
            </div>

            <div className="flex items-end justify-center" style={{ gap: 0 }}>
              {CHARACTER_VARIANTS.map((cv, i) => {
                const isSelected = uiState.selectedCharacter === i;
                return (
                  <div
                    key={cv.name}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      stateRef.current.selectedCharacter = i;
                      syncUI();
                    }}
                    style={{
                      transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      transform: isSelected ? "scale(1.2) translateY(-8px)" : "scale(0.85)",
                      zIndex: isSelected ? 10 : 1,
                      position: "relative",
                    }}
                    data-testid={`button-char-${i}`}
                  >
                    {isSelected && (
                      <img
                        src={cv.factionIcon}
                        alt={cv.name}
                        style={{ width: 32, height: 32, marginBottom: 2, transition: "all 0.3s", filter: `drop-shadow(0 0 6px ${cv.color})` }}
                      />
                    )}
                    <div style={{
                      position: "relative",
                      transition: "all 0.4s",
                    }}>
                      {isSelected && (
                        <div style={{
                          position: "absolute",
                          inset: -6,
                          borderRadius: "50%",
                          background: `radial-gradient(ellipse at center, ${cv.color}20 0%, transparent 70%)`,
                          filter: `blur(8px)`,
                          pointerEvents: "none",
                        }} />
                      )}
                      <img
                        src={cv.selectImg}
                        alt={cv.name}
                        style={{
                          imageRendering: "pixelated",
                          height: 140,
                          width: "auto",
                          filter: isSelected ? `drop-shadow(0 0 12px ${cv.color}60)` : "brightness(0.08) contrast(0.5)",
                          transition: "filter 0.4s",
                          position: "relative",
                        }}
                      />
                    </div>
                    <span style={{
                      color: isSelected ? cv.color : "#2a3a4a",
                      fontSize: isSelected ? 10 : 7,
                      marginTop: 4,
                      fontWeight: "bold",
                      textShadow: isSelected ? `0 0 12px ${cv.color}88` : "none",
                      transition: "all 0.3s",
                      letterSpacing: isSelected ? "2px" : "0px",
                    }}>{cv.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-2" style={{ width: "100%" }}>
              <label style={{ color: "#90a4ae", fontSize: 8 }}>ENTER YOUR NAME</label>
              <input
                type="text"
                maxLength={16}
                placeholder="Angler"
                defaultValue={uiState.playerName}
                onChange={(e) => {
                  stateRef.current.playerName = e.target.value;
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    const s = stateRef.current;
                    if (!s.playerName.trim()) s.playerName = "Angler";
                    s.characterSelected = true;
                    s.gameState = "idle";
                    const canvas = canvasRef.current;
                    if (canvas) {
                      const W = canvas.width;
                      const waterY = canvas.height * 0.42;
                      const H = canvas.height;
                      s.playerX = W * 0.45;
                      for (let i = 0; i < 6; i++) spawnFish(W, waterY, H);
                    }
                    syncUI();
                  }
                }}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(79,195,247,0.3)",
                  borderRadius: 8,
                  padding: "8px 14px",
                  color: "#ecf0f1",
                  fontSize: 12,
                  fontFamily: "'Press Start 2P', monospace",
                  width: "100%",
                  maxWidth: 260,
                  textAlign: "center",
                  outline: "none",
                }}
                data-testid="input-player-name"
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                const s = stateRef.current;
                if (!s.playerName.trim()) s.playerName = "Angler";
                s.characterSelected = true;
                s.gameState = "idle";
                const canvas = canvasRef.current;
                if (canvas) {
                  const W = canvas.width;
                  const waterY = canvas.height * 0.42;
                  const H = canvas.height;
                  s.playerX = W * 0.45;
                  for (let i = 0; i < 6; i++) spawnFish(W, waterY, H);
                }
                if (!s.promoShown) {
                  s.showPromo = true;
                  s.promoShown = true;
                }
                syncUI();
              }}
              style={{
                background: "linear-gradient(135deg, rgba(79,195,247,0.25), rgba(241,196,15,0.2))",
                border: "2px solid rgba(241,196,15,0.5)",
                borderRadius: 10,
                padding: "10px 32px",
                color: "#ffd54f",
                fontSize: 12,
                fontFamily: "'Press Start 2P', monospace",
                cursor: "pointer",
                transition: "all 0.2s",
                textShadow: "0 0 10px rgba(241,196,15,0.3)",
              }}
              data-testid="button-start-game"
            >
              START FISHING
            </button>
          </div>
        </div>
      )}

      {uiState.gameState !== "title" && uiState.gameState !== "charSelect" && (
        <>
          {/* HUD Top Left - Score & Stats */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5" style={{ pointerEvents: "none" }} data-testid="hud-score">
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(241,196,15,0.3)" }}>
              <img src="/assets/icons/Icons_01.png" alt="" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#f1c40f", fontSize: 11 }}>{uiState.score}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(52,152,219,0.3)" }}>
              <img src="/assets/icons/Icons_03.png" alt="" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#3498db", fontSize: 11 }}>{uiState.totalCaught}</span>
            </div>
            {uiState.combo > 1 && (
              <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(231,76,60,0.15)", borderRadius: 8, border: "1px solid rgba(231,76,60,0.4)", animation: "pulse 1s infinite" }}>
                <span style={{ color: "#e74c3c", fontSize: 10 }}>x{uiState.combo} COMBO</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(46,204,113,0.3)" }}>
              <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 14, height: 14 }} />
              <span style={{ color: "#2ecc71", fontSize: 11 }}>{uiState.money}</span>
            </div>
          </div>

          {/* HUD Top Right - Rod Level */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5" style={{ pointerEvents: "none" }} data-testid="hud-rod">
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(155,89,182,0.3)" }}>
              <img src="/assets/icons/Icons_07.png" alt="" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#9b59b6", fontSize: 10 }}>Lv.{uiState.rodLevel}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(46,204,113,0.3)" }}>
              <img src="/assets/icons/Icons_07.png" alt="" className="w-4 h-4" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#2ecc71", fontSize: 7 }}>{RODS[uiState.equippedRod].name}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(52,152,219,0.3)" }}>
              <img src="/assets/icons/Icons_09.png" alt="" className="w-4 h-4" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#5dade2", fontSize: 7 }}>{LURES[uiState.equippedLure].name}</span>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
              style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(46,204,113,0.3)", fontFamily: "'Press Start 2P', monospace", pointerEvents: "auto" }}
              onClick={(e) => { e.stopPropagation(); setShowCollection(!showCollection); }}
              data-testid="button-collection"
            >
              <img src="/assets/icons/Icons_05.png" alt="" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#2ecc71", fontSize: 9 }}>Fish Log</span>
            </button>
          </div>

          {/* Casting Aim Prompt */}
          {uiState.gameState === "casting" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ pointerEvents: "none" }} data-testid="cast-aim-prompt">
              <span style={{ color: "#f1c40f", fontSize: 12, textShadow: "1px 1px 0 #000" }}>AIM YOUR CAST</span>
              <span style={{ color: "#b0bec5", fontSize: 8, textShadow: "1px 1px 0 #000" }}>Move mouse to aim, click to cast!</span>
            </div>
          )}

          {/* Waiting */}
          {uiState.gameState === "waiting" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-4 py-2" style={{ background: "rgba(8,15,25,0.7)", borderRadius: 8, pointerEvents: "none" }} data-testid="waiting-indicator">
              <span style={{ color: "#5dade2", fontSize: 10, textShadow: "1px 1px 0 #000" }}>
                Waiting for a bite
                <span style={{ animation: "pulse 1.5s infinite" }}>...</span>
              </span>
            </div>
          )}

          {/* Bite Alert */}
          {uiState.gameState === "bite" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-5 py-3" style={{ background: "rgba(241,196,15,0.15)", borderRadius: 10, border: "2px solid rgba(241,196,15,0.5)", pointerEvents: "none" }} data-testid="bite-alert">
              <span style={{ color: "#f1c40f", fontSize: 14, textShadow: "2px 2px 0 #000", animation: "pulse 0.5s infinite" }}>
                FISH ON! CLICK NOW!
              </span>
            </div>
          )}

          {/* Reeling Minigame - Palworld Style */}
          {uiState.gameState === "reeling" && (() => {
            const barW = Math.min(340, window.innerWidth * 0.75);
            const eqRod = RODS[uiState.equippedRod];
            const tacticsG = 1 + uiState.attributes.Tactics * 0.005;
            const strZoneBonus = uiState.attributes.Strength * 0.003 * tacticsG;
            const catchZoneHalf = 0.08 + uiState.rodLevel * 0.015 + eqRod.catchZoneBonus + strZoneBonus;
            const catchZoneW = catchZoneHalf * 2 * 100;
            const catchZoneLeft = Math.max(0, Math.min(100 - catchZoneW, (uiState.reelProgress - catchZoneHalf) * 100));
            const fishLeft = uiState.reelTarget * 100;
            const gaugePercent = uiState.reelGauge * 100;
            const fishInZone = uiState.reelTarget >= (uiState.reelProgress - catchZoneHalf) &&
                               uiState.reelTarget <= (uiState.reelProgress + catchZoneHalf);
            const forceBarPercent = uiState.forceBarMax > 0 ? (uiState.forceBar / uiState.forceBarMax) * 100 : 0;
            const resilience = uiState.resilience;
            const resilienceMax = uiState.resilienceMax;
            return (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ pointerEvents: "none" }} data-testid="reel-bar">
                <div style={{ width: barW, height: 10, background: "rgba(8,15,25,0.85)", borderRadius: 5, border: "1px solid rgba(59,130,246,0.3)", overflow: "hidden", marginBottom: 4 }} data-testid="force-bar">
                  <div style={{ width: `${forceBarPercent}%`, height: "100%", background: forceBarPercent > 30 ? "linear-gradient(90deg, #3b82f6, #60a5fa)" : "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: 5, transition: "width 0.1s" }} />
                </div>
                <span style={{ color: "#60a5fa", fontSize: 6 }}>FORCE {Math.floor(uiState.forceBar)}/{Math.floor(uiState.forceBarMax)} [SPACE]</span>
                <div className="flex items-center gap-1" style={{ marginBottom: 4 }} data-testid="resilience-bar">
                  <span style={{ color: "#f59e0b", fontSize: 6, marginRight: 4 }}>RES [S]</span>
                  {Array.from({length: resilienceMax}, (_, i) => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: i < resilience ? "rgba(245,158,11,0.8)" : "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", transition: "background 0.2s" }} />
                  ))}
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  border: `3px solid ${fishInZone ? "#2ecc71" : "#e74c3c"}`,
                  background: `conic-gradient(${fishInZone ? "#2ecc71" : "#e74c3c"} ${gaugePercent * 3.6}deg, rgba(8,15,25,0.7) ${gaugePercent * 3.6}deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: fishInZone ? "0 0 12px rgba(46,204,113,0.4)" : "0 0 12px rgba(231,76,60,0.3)",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }} data-testid="reel-gauge">
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "rgba(8,15,25,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {stateRef.current.currentCatch?.beachCrab && stateRef.current.currentCatch?.spriteRow !== undefined ? (
                      <div style={{ width: 20, height: 20, overflow: "hidden", position: "relative" }}>
                        <img src={stateRef.current.currentCatch.catchAsset} alt="" style={{ 
                          position: "absolute", width: 256 * (20/16), height: 384 * (20/16), imageRendering: "pixelated",
                          left: 0, top: -(stateRef.current.currentCatch.spriteRow * (20)),
                        }} />
                      </div>
                    ) : (
                      <img src={stateRef.current.currentCatch?.catchAsset || stateRef.current.currentJunk?.asset || "/assets/icons/Icons_05.png"} alt="" style={{ width: 20, height: 20, imageRendering: "pixelated" }} />
                    )}
                  </div>
                </div>
                <div className="relative" style={{
                  width: barW, height: 32,
                  background: "rgba(8,15,25,0.85)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.15)",
                  overflow: "hidden",
                }}>
                  <div className="absolute h-full" style={{
                    left: `${catchZoneLeft}%`,
                    width: `${catchZoneW}%`,
                    background: fishInZone ? "rgba(46,204,113,0.35)" : "rgba(46,204,113,0.18)",
                    borderRadius: 8,
                    transition: "background 0.1s",
                    border: "1px solid rgba(46,204,113,0.4)",
                  }} data-testid="catch-zone" />
                  <div className="absolute" style={{
                    left: `calc(${fishLeft}% - 12px)`,
                    top: 2, width: 28, height: 28,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    filter: fishInZone ? "drop-shadow(0 0 6px rgba(46,204,113,0.8))" : "drop-shadow(0 0 4px rgba(231,76,60,0.6))",
                    transition: "filter 0.1s",
                  }} data-testid="fish-icon">
                    {stateRef.current.currentCatch?.beachCrab && stateRef.current.currentCatch?.spriteRow !== undefined ? (
                      <div style={{ width: 24, height: 24, overflow: "hidden", position: "relative" }}>
                        <img src={stateRef.current.currentCatch.catchAsset} alt="" style={{ 
                          position: "absolute", width: 256 * (24/16), height: 384 * (24/16), imageRendering: "pixelated",
                          left: 0, top: -(stateRef.current.currentCatch.spriteRow * (24)),
                        }} />
                      </div>
                    ) : (
                      <img
                        src={stateRef.current.currentCatch?.catchAsset || stateRef.current.currentJunk?.asset || "/assets/icons/Icons_05.png"}
                        alt=""
                        style={{ width: 24, height: 24, imageRendering: "pixelated" }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                  <span style={{ color: "#78909c", fontSize: 7 }}>ALIGN</span>
                  <div style={{ width: 60, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      width: `${uiState.alignment * 100}%`,
                      height: "100%",
                      background: uiState.alignment > 0.7 ? "#2ecc71" : uiState.alignment > 0.4 ? "#f39c12" : "#e74c3c",
                      borderRadius: 3,
                      transition: "width 0.1s",
                    }} />
                  </div>
                  <span style={{ color: uiState.alignment > 0.7 ? "#2ecc71" : "#78909c", fontSize: 7 }}>
                    {uiState.alignment > 0.7 ? "GREAT" : uiState.alignment > 0.4 ? "OK" : "FAR"}
                  </span>
                </div>
                <span style={{ color: "#b0bec5", fontSize: 8, textShadow: "1px 1px 0 #000" }}>
                  Click to reel | Hold right-click for steady reel | A/D to align
                </span>
              </div>
            );
          })()}

          {/* Missed */}
          {uiState.gameState === "missed" && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center px-5 py-3 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 10, border: "1px solid rgba(231,76,60,0.3)", pointerEvents: "none" }} data-testid="missed-display">
              <span style={{ color: "#e74c3c", fontSize: 11, textShadow: "1px 1px 0 #000" }}>{uiState.missReason}</span>
              <span style={{ color: "#607d8b", fontSize: 8 }}>Click to try again</span>
            </div>
          )}

          {/* Idle Prompt */}
          {uiState.gameState === "idle" && !uiState.inBoat && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-4 py-2 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.7)", borderRadius: 8, pointerEvents: "none" }} data-testid="idle-prompt">
              <span style={{ color: "#b0bec5", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Click to {uiState.toolMode === "net" ? "cast net" : "cast"}  |  A/D to walk</span>
              <span style={{ color: "#5dade2", fontSize: 8, textShadow: "1px 1px 0 #000" }}>SPACE to dive in  |  1-5 hotbar</span>
            </div>
          )}
          {uiState.gameState === "idle" && uiState.inBoat && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-4 py-2 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.7)", borderRadius: 8, pointerEvents: "none" }} data-testid="boat-idle-prompt">
              <span style={{ color: "#b0bec5", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Click to {uiState.toolMode === "net" ? "cast net" : "cast"}  |  A/D to row  |  SPACE to stand</span>
              <span style={{ color: "#f1c40f", fontSize: 8, textShadow: "1px 1px 0 #000" }}>E near pier to exit boat  |  1-5 hotbar</span>
            </div>
          )}

          {["idle","casting","waiting","bite","reeling","caught","missed","swimming"].includes(uiState.gameState) && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-1" style={{ zIndex: 30 }} data-testid="hotbar">
              <div onClick={(e) => { e.stopPropagation(); stateRef.current.selectedHotbar = 1; stateRef.current.toolMode = "rod"; stateRef.current.showLurePopup = false; stateRef.current.showChumPopup = false; syncUI(); }}
                className="flex flex-col items-center cursor-pointer"
                style={{ padding: "4px 6px", borderRadius: 6, background: uiState.selectedHotbar === 1 ? "rgba(46,204,113,0.25)" : "rgba(8,15,25,0.75)", border: uiState.selectedHotbar === 1 ? "1px solid rgba(46,204,113,0.5)" : "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}
                data-testid="hotbar-slot-1">
                <img src={RODS[uiState.equippedRod].icon} alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
                <span style={{ fontSize: 5, color: uiState.selectedHotbar === 1 ? "#2ecc71" : "#607d8b" }}>1</span>
              </div>

              <div style={{ position: "relative" }}>
                {uiState.showLurePopup && (
                  <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 4, background: "rgba(8,15,25,0.95)", borderRadius: 8, border: "1px solid rgba(52,152,219,0.3)", padding: 6, minWidth: 140, maxHeight: 200, overflowY: "auto", zIndex: 40 }} data-testid="lure-popup">
                    {LURES.map((lure, i) => uiState.ownedLures[i] && (
                      <div key={i} onClick={(e) => { e.stopPropagation(); stateRef.current.equippedLure = i; stateRef.current.showLurePopup = false; syncUI(); }}
                        className="flex items-center gap-2 cursor-pointer"
                        style={{ padding: "3px 4px", borderRadius: 4, background: uiState.equippedLure === i ? "rgba(52,152,219,0.2)" : "transparent", marginBottom: 2 }}
                        data-testid={`lure-popup-item-${i}`}>
                        <img src={lure.icon} alt="" style={{ width: 16, height: 16, imageRendering: "pixelated" }} />
                        <span style={{ color: uiState.equippedLure === i ? "#5dade2" : "#b0bec5", fontSize: 6, flex: 1 }}>{lure.name}</span>
                        {uiState.equippedLure === i && <span style={{ color: "#5dade2", fontSize: 5 }}>EQ</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div onClick={(e) => { e.stopPropagation(); stateRef.current.showLurePopup = !stateRef.current.showLurePopup; stateRef.current.showChumPopup = false; stateRef.current.selectedHotbar = 2; syncUI(); }}
                  className="flex flex-col items-center cursor-pointer"
                  style={{ padding: "4px 6px", borderRadius: 6, background: uiState.selectedHotbar === 2 ? "rgba(52,152,219,0.25)" : "rgba(8,15,25,0.75)", border: uiState.selectedHotbar === 2 ? "1px solid rgba(52,152,219,0.5)" : "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}
                  data-testid="hotbar-slot-2">
                  <img src={LURES[uiState.equippedLure].icon} alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
                  <span style={{ fontSize: 5, color: uiState.selectedHotbar === 2 ? "#5dade2" : "#607d8b" }}>2</span>
                </div>
              </div>

              <div style={{ position: "relative" }}>
                {uiState.showChumPopup && (
                  <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 4, background: "rgba(8,15,25,0.95)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", padding: 6, minWidth: 160, maxHeight: 200, overflowY: "auto", zIndex: 40 }} data-testid="chum-popup">
                    {CHUM_ITEMS.map((chum, i) => uiState.ownedChum[i] > 0 && (
                      <div key={i} onClick={(e) => {
                          e.stopPropagation();
                          const st = stateRef.current;
                          if (st.chumCooldown > 0) return;
                          st.ownedChum[i]--;
                          st.chumActiveTimer = chum.duration;
                          st.chumActiveType = i;
                          st.chumCooldown = chum.cooldown;
                          st.equippedChum = i;
                          st.showChumPopup = false;
                          syncUI();
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                        style={{ padding: "3px 4px", borderRadius: 4, background: uiState.chumActiveType === i ? "rgba(245,158,11,0.2)" : "transparent", marginBottom: 2, opacity: stateRef.current.chumCooldown > 0 ? 0.5 : 1 }}
                        data-testid={`chum-popup-item-${i}`}>
                        <img src={chum.icon} alt="" style={{ width: 16, height: 16, imageRendering: "pixelated" }} />
                        <span style={{ color: "#f59e0b", fontSize: 6, flex: 1 }}>{chum.name}</span>
                        <span style={{ color: "#78909c", fontSize: 5 }}>x{uiState.ownedChum[i]}</span>
                      </div>
                    ))}
                    {uiState.ownedChum.every(c => c === 0) && (
                      <span style={{ color: "#455a64", fontSize: 6, padding: 4 }}>No chum owned</span>
                    )}
                  </div>
                )}
                <div onClick={(e) => { e.stopPropagation(); stateRef.current.showChumPopup = !stateRef.current.showChumPopup; stateRef.current.showLurePopup = false; stateRef.current.selectedHotbar = 3; syncUI(); }}
                  className="flex flex-col items-center cursor-pointer"
                  style={{ padding: "4px 6px", borderRadius: 6, background: uiState.selectedHotbar === 3 ? "rgba(245,158,11,0.25)" : "rgba(8,15,25,0.75)", border: uiState.selectedHotbar === 3 ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}
                  data-testid="hotbar-slot-3">
                  <img src="/assets/icons/Icons_09.png" alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
                  <span style={{ fontSize: 5, color: uiState.selectedHotbar === 3 ? "#f59e0b" : "#607d8b" }}>3</span>
                </div>
              </div>

              <div onClick={(e) => { e.stopPropagation(); stateRef.current.selectedHotbar = 4; stateRef.current.toolMode = "net"; stateRef.current.showLurePopup = false; stateRef.current.showChumPopup = false; stateRef.current.binoculars = false; syncUI(); }}
                className="flex flex-col items-center cursor-pointer"
                style={{ padding: "4px 6px", borderRadius: 6, background: uiState.selectedHotbar === 4 ? "rgba(168,85,247,0.25)" : "rgba(8,15,25,0.75)", border: uiState.selectedHotbar === 4 ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}
                data-testid="hotbar-slot-4">
                <img src="/assets/icons/Icons_11.png" alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
                <span style={{ fontSize: 5, color: uiState.selectedHotbar === 4 ? "#a855f7" : "#607d8b" }}>4</span>
              </div>

              <div onClick={(e) => {
                e.stopPropagation();
                const st = stateRef.current;
                if (!st.binoculars && !["idle", "swimming"].includes(st.gameState)) return;
                st.binoculars = !st.binoculars;
                st.selectedHotbar = st.binoculars ? 5 : 1;
                st.showLurePopup = false;
                st.showChumPopup = false;
                if (st.binoculars) {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    st.binoX = -st.cameraX + canvas.width / 2;
                    st.binoY = -st.cameraY + canvas.height / 2;
                    st.binoTargetX = st.binoX;
                    st.binoTargetY = st.binoY;
                  }
                }
                syncUI();
              }}
                className="flex flex-col items-center cursor-pointer"
                style={{ padding: "4px 6px", borderRadius: 6, background: uiState.binoculars ? "rgba(34,211,238,0.25)" : "rgba(8,15,25,0.75)", border: uiState.binoculars ? "1px solid rgba(34,211,238,0.5)" : "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}
                data-testid="hotbar-slot-5">
                <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ imageRendering: "auto" }}>
                    <circle cx="6" cy="10" r="5" stroke={uiState.binoculars ? "#22d3ee" : "#607d8b"} strokeWidth="1.5" fill="none" />
                    <circle cx="14" cy="10" r="5" stroke={uiState.binoculars ? "#22d3ee" : "#607d8b"} strokeWidth="1.5" fill="none" />
                    <line x1="11" y1="10" x2="9" y2="10" stroke={uiState.binoculars ? "#22d3ee" : "#607d8b"} strokeWidth="1.5" />
                  </svg>
                </div>
                <span style={{ fontSize: 5, color: uiState.binoculars ? "#22d3ee" : "#607d8b" }}>5</span>
              </div>
            </div>
          )}

          {/* Boat Prompt */}
          {uiState.nearBoat && !uiState.showBoatPrompt && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center px-5 py-3 flex flex-col items-center gap-2" style={{ background: "rgba(8,15,25,0.9)", borderRadius: 10, border: "1px solid rgba(241,196,15,0.4)", zIndex: 50 }} data-testid="boat-hint">
              <span style={{ color: "#f1c40f", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Press E to enter boat</span>
            </div>
          )}

          {uiState.showBoatPrompt && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 60, background: "rgba(0,0,0,0.4)" }} data-testid="boat-prompt-overlay">
              <div className="flex flex-col items-center gap-4 px-8 py-6" style={{ background: "rgba(8,15,25,0.95)", borderRadius: 12, border: "1px solid rgba(241,196,15,0.5)", minWidth: 220 }} data-testid="boat-prompt">
                <img src="/assets/objects/Boat.png" alt="" style={{ width: 80, imageRendering: "pixelated" }} />
                <span style={{ color: "#f1c40f", fontSize: 12, textShadow: "1px 1px 0 #000" }}>Enter Boat?</span>
                <div className="flex gap-4">
                  <button
                    className="cursor-pointer px-5 py-2"
                    style={{ background: "rgba(46,204,113,0.25)", borderRadius: 8, border: "1px solid rgba(46,204,113,0.5)", fontFamily: "'Press Start 2P', monospace", color: "#2ecc71", fontSize: 10 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const s = stateRef.current;
                      const canvas = canvasRef.current;
                      s.showBoatPrompt = false;
                      s.gameState = "boarding";
                      s.boardingPhase = 0;
                      s.boardingTimer = 0;
                      s.playerVY = 0;
                      s.jumpVY = 0;
                      if (canvas) {
                        const pierStartX = canvas.width * 0.45 - 80;
                        s.boatX = pierStartX - 74 * 2.5 - 30;
                      }
                      syncUI();
                    }}
                    data-testid="button-boat-yes"
                  >
                    Yes
                  </button>
                  <button
                    className="cursor-pointer px-5 py-2"
                    style={{ background: "rgba(231,76,60,0.25)", borderRadius: 8, border: "1px solid rgba(231,76,60,0.5)", fontFamily: "'Press Start 2P', monospace", color: "#e74c3c", fontSize: 10 }}
                    onClick={(e) => { e.stopPropagation(); stateRef.current.showBoatPrompt = false; syncUI(); }}
                    data-testid="button-boat-no"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hut/Shop Hint */}
          {uiState.nearHut && !uiState.showStorePrompt && uiState.gameState === "idle" && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center px-5 py-3 flex flex-col items-center gap-2" style={{ background: "rgba(8,15,25,0.9)", borderRadius: 10, border: "1px solid rgba(46,204,113,0.4)", zIndex: 50 }} data-testid="hut-hint">
              <span style={{ color: "#2ecc71", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Press E to enter shop</span>
            </div>
          )}

          {/* Store Overlay */}
          {uiState.gameState === "store" && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 80, background: "rgba(0,0,0,0.6)" }} data-testid="store-overlay">
              <div className="flex flex-col" style={{ background: "rgba(8,15,25,0.97)", borderRadius: 12, border: "1px solid rgba(46,204,113,0.4)", width: Math.min(440, window.innerWidth * 0.92), maxHeight: "85vh", overflow: "hidden" }} data-testid="store-panel">
                {/* Store Header */}
                <div className="flex items-center justify-between p-3" style={{ borderBottom: "1px solid rgba(46,204,113,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#2ecc71", fontSize: 12 }}>FISHING SHOP</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 12, height: 12 }} />
                    <span style={{ color: "#2ecc71", fontSize: 10 }}>{uiState.money}</span>
                    <span style={{ color: "#a855f7", fontSize: 8, background: "rgba(168,85,247,0.15)", padding: "2px 5px", borderRadius: 4 }} data-testid="text-head-of-legends">{uiState.headOfLegends} HEAD</span>
                    <button
                      className="cursor-pointer px-2 py-1"
                      style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", fontFamily: "'Press Start 2P', monospace", color: "#78909c", fontSize: 10 }}
                      onClick={(e) => { e.stopPropagation(); stateRef.current.gameState = "idle"; syncUI(); }}
                      data-testid="button-close-store"
                    >
                      X
                    </button>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    className="flex-1 px-3 py-2 cursor-pointer"
                    style={{ background: uiState.storeTab === "rod" ? "rgba(46,204,113,0.15)" : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.storeTab === "rod" ? "#2ecc71" : "#607d8b", fontSize: 9, borderBottom: uiState.storeTab === "rod" ? "2px solid #2ecc71" : "2px solid transparent" }}
                    onClick={(e) => { e.stopPropagation(); stateRef.current.storeTab = "rod"; syncUI(); }}
                    data-testid="button-tab-rod"
                  >
                    RODS
                  </button>
                  <button
                    className="flex-1 px-3 py-2 cursor-pointer"
                    style={{ background: uiState.storeTab === "lure" ? "rgba(46,204,113,0.15)" : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.storeTab === "lure" ? "#2ecc71" : "#607d8b", fontSize: 9, borderBottom: uiState.storeTab === "lure" ? "2px solid #2ecc71" : "2px solid transparent" }}
                    onClick={(e) => { e.stopPropagation(); stateRef.current.storeTab = "lure"; syncUI(); }}
                    data-testid="button-tab-lure"
                  >
                    BAIT & LURES
                  </button>
                  <button
                    className="flex-1 px-3 py-2 cursor-pointer"
                    style={{ background: uiState.storeTab === "chum" ? "rgba(245,158,11,0.15)" : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.storeTab === "chum" ? "#f59e0b" : "#607d8b", fontSize: 9, borderBottom: uiState.storeTab === "chum" ? "2px solid #f59e0b" : "2px solid transparent" }}
                    onClick={(e) => { e.stopPropagation(); stateRef.current.storeTab = "chum"; syncUI(); }}
                    data-testid="button-tab-chum"
                  >
                    CHUM
                  </button>
                  <button
                    className="flex-1 px-3 py-2 cursor-pointer"
                    style={{ background: uiState.storeTab === "eggs" ? "rgba(168,85,247,0.15)" : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.storeTab === "eggs" ? "#a855f7" : "#607d8b", fontSize: 9, borderBottom: uiState.storeTab === "eggs" ? "2px solid #a855f7" : "2px solid transparent" }}
                    onClick={(e) => { e.stopPropagation(); stateRef.current.storeTab = "eggs"; syncUI(); }}
                    data-testid="button-tab-eggs"
                  >
                    EGGS
                  </button>
                </div>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
                  {uiState.storeTab === "rod" && RODS.map((rod, i) => {
                    const owned = uiState.ownedRods[i];
                    const equipped = uiState.equippedRod === i;
                    const canAfford = uiState.money >= rod.price;
                    return (
                      <div key={rod.name} className="flex items-start gap-2.5 p-2.5" style={{ background: equipped ? "rgba(46,204,113,0.12)" : "rgba(255,255,255,0.03)", borderRadius: 8, border: equipped ? "1px solid rgba(46,204,113,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center justify-center" style={{ width: 44, height: 44, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                          <img src={rod.icon} alt="" style={{ width: 32, height: 32, imageRendering: "pixelated" }} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ color: equipped ? "#2ecc71" : "#e0e0e0", fontSize: 9 }}>{rod.name}</span>
                            {equipped && <span style={{ color: "#2ecc71", fontSize: 6, background: "rgba(46,204,113,0.2)", padding: "1px 4px", borderRadius: 3 }}>EQUIPPED</span>}
                          </div>
                          <span style={{ color: "#78909c", fontSize: 7, lineHeight: "1.5" }}>{rod.description}</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <span style={{ color: "#5dade2", fontSize: 6 }}>Zone +{(rod.catchZoneBonus * 100).toFixed(0)}%</span>
                            <span style={{ color: "#f1c40f", fontSize: 6 }}>Speed x{rod.reelSpeedMult.toFixed(1)}</span>
                            <span style={{ color: "#9b59b6", fontSize: 6 }}>Str x{rod.lineStrength.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {!owned ? (
                            <button
                              className="cursor-pointer px-3 py-1.5"
                              style={{ background: canAfford ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.05)", borderRadius: 6, border: canAfford ? "1px solid rgba(46,204,113,0.5)" : "1px solid rgba(255,255,255,0.1)", fontFamily: "'Press Start 2P', monospace", color: canAfford ? "#2ecc71" : "#455a64", fontSize: 8, opacity: canAfford ? 1 : 0.5 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canAfford) return;
                                const st = stateRef.current;
                                st.money -= rod.price;
                                st.ownedRods[i] = true;
                                st.equippedRod = i;
                                syncUI();
                              }}
                              data-testid={`button-buy-rod-${i}`}
                            >
                              <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 10, height: 10, verticalAlign: "middle", marginRight: 2 }} />{rod.price}
                            </button>
                          ) : !equipped ? (
                            <button
                              className="cursor-pointer px-3 py-1.5"
                              style={{ background: "rgba(52,152,219,0.2)", borderRadius: 6, border: "1px solid rgba(52,152,219,0.4)", fontFamily: "'Press Start 2P', monospace", color: "#5dade2", fontSize: 8 }}
                              onClick={(e) => { e.stopPropagation(); stateRef.current.equippedRod = i; syncUI(); }}
                              data-testid={`button-equip-rod-${i}`}
                            >
                              EQUIP
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {uiState.storeTab === "lure" && (["live", "lure"] as const).map(baitType => {
                    const items = LURES.map((l, i) => ({ lure: l, idx: i })).filter(x => x.lure.type === baitType);
                    return (
                      <div key={baitType} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 px-1 pt-1">
                          <span style={{ color: baitType === "live" ? "#e67e22" : "#3498db", fontSize: 8, fontFamily: "'Press Start 2P', monospace", letterSpacing: 1 }}>
                            {baitType === "live" ? "LIVE BAIT" : "LURES"}
                          </span>
                          <div style={{ flex: 1, height: 1, background: baitType === "live" ? "rgba(230,126,34,0.3)" : "rgba(52,152,219,0.3)" }} />
                        </div>
                        {items.map(({ lure, idx: i }) => {
                          const owned = uiState.ownedLures[i];
                          const equipped = uiState.equippedLure === i;
                          const canAfford = uiState.money >= lure.price;
                          return (
                            <div key={lure.name} className="flex items-start gap-2.5 p-2.5" style={{ background: equipped ? "rgba(46,204,113,0.12)" : "rgba(255,255,255,0.03)", borderRadius: 8, border: equipped ? "1px solid rgba(46,204,113,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                              <div className="flex items-center justify-center" style={{ width: 44, height: 44, background: "rgba(0,0,0,0.3)", borderRadius: 6, overflow: "hidden" }}>
                                <img src={lure.icon} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span style={{ color: equipped ? "#2ecc71" : "#e0e0e0", fontSize: 9 }}>{lure.name}</span>
                                  <span style={{ color: lure.type === "live" ? "#e67e22" : "#3498db", fontSize: 5, background: lure.type === "live" ? "rgba(230,126,34,0.15)" : "rgba(52,152,219,0.15)", padding: "1px 3px", borderRadius: 2 }}>{lure.type === "live" ? "LIVE" : "LURE"}</span>
                                  {equipped && <span style={{ color: "#2ecc71", fontSize: 6, background: "rgba(46,204,113,0.2)", padding: "1px 4px", borderRadius: 3 }}>EQUIPPED</span>}
                                </div>
                                <span style={{ color: "#78909c", fontSize: 7, lineHeight: "1.5" }}>{lure.description}</span>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                  <span style={{ color: "#f1c40f", fontSize: 6 }}>Effect: {lure.effect}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                  {lure.rarityBoost > 1 && <span style={{ color: "#a855f7", fontSize: 6 }}>Rare x{lure.rarityBoost.toFixed(1)}</span>}
                                  {lure.sizeBoost > 0 && <span style={{ color: "#e74c3c", fontSize: 6 }}>Size +{lure.sizeBoost.toFixed(1)}</span>}
                                  {lure.speedBoost > 1 && <span style={{ color: "#5dade2", fontSize: 6 }}>Bite x{lure.speedBoost.toFixed(1)}</span>}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {!owned ? (
                                  <button
                                    className="cursor-pointer px-3 py-1.5"
                                    style={{ background: canAfford ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.05)", borderRadius: 6, border: canAfford ? "1px solid rgba(46,204,113,0.5)" : "1px solid rgba(255,255,255,0.1)", fontFamily: "'Press Start 2P', monospace", color: canAfford ? "#2ecc71" : "#455a64", fontSize: 8, opacity: canAfford ? 1 : 0.5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!canAfford) return;
                                      const st = stateRef.current;
                                      st.money -= lure.price;
                                      st.ownedLures[i] = true;
                                      st.equippedLure = i;
                                      syncUI();
                                    }}
                                    data-testid={`button-buy-lure-${i}`}
                                  >
                                    <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 10, height: 10, verticalAlign: "middle", marginRight: 2 }} />{lure.price}
                                  </button>
                                ) : !equipped ? (
                                  <button
                                    className="cursor-pointer px-3 py-1.5"
                                    style={{ background: "rgba(52,152,219,0.2)", borderRadius: 6, border: "1px solid rgba(52,152,219,0.4)", fontFamily: "'Press Start 2P', monospace", color: "#5dade2", fontSize: 8 }}
                                    onClick={(e) => { e.stopPropagation(); stateRef.current.equippedLure = i; syncUI(); }}
                                    data-testid={`button-equip-lure-${i}`}
                                  >
                                    EQUIP
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  {uiState.storeTab === "chum" && CHUM_ITEMS.filter(c => !c.catchable).map((chum, i) => {
                    const canAfford = uiState.money >= chum.price;
                    const owned = uiState.ownedChum[i];
                    return (
                      <div key={chum.name} className="flex items-start gap-2.5 p-2.5" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.1)" }}>
                        <div className="flex items-center justify-center" style={{ width: 44, height: 44, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                          <img src={chum.icon} alt="" style={{ width: 32, height: 32, imageRendering: "pixelated" }} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ color: "#e0e0e0", fontSize: 9 }}>{chum.name}</span>
                            {owned > 0 && <span style={{ color: "#f59e0b", fontSize: 6, background: "rgba(245,158,11,0.2)", padding: "1px 4px", borderRadius: 3 }}>x{owned}</span>}
                          </div>
                          <span style={{ color: "#78909c", fontSize: 7, lineHeight: "1.5" }}>{chum.description}</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <span style={{ color: "#f59e0b", fontSize: 6 }}>Effect: {chum.effect}</span>
                            {chum.rarityBoost > 1 && <span style={{ color: "#a855f7", fontSize: 6 }}>Rarity x{chum.rarityBoost.toFixed(1)}</span>}
                            {chum.biteSpeedBoost > 1 && <span style={{ color: "#5dade2", fontSize: 6 }}>Bite x{chum.biteSpeedBoost.toFixed(1)}</span>}
                            <span style={{ color: "#22c55e", fontSize: 6 }}>Attract x{chum.fishAttract.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button
                            className="cursor-pointer px-3 py-1.5"
                            style={{ background: canAfford ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.05)", borderRadius: 6, border: canAfford ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.1)", fontFamily: "'Press Start 2P', monospace", color: canAfford ? "#f59e0b" : "#455a64", fontSize: 8, opacity: canAfford ? 1 : 0.5 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canAfford) return;
                              const st = stateRef.current;
                              st.money -= chum.price;
                              st.ownedChum[i]++;
                              syncUI();
                            }}
                            data-testid={`button-buy-chum-${i}`}
                          >
                            <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 10, height: 10, verticalAlign: "middle", marginRight: 2 }} />{chum.price}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {uiState.storeTab === "eggs" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between px-1 py-1.5" style={{ background: "rgba(168,85,247,0.08)", borderRadius: 6, border: "1px solid rgba(168,85,247,0.2)" }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: "#a855f7", fontSize: 8 }}>HEAD OF LEGENDS</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: "#fbbf24", fontSize: 10 }}>{uiState.headOfLegends}</span>
                        </div>
                      </div>
                      <span style={{ color: "#78909c", fontSize: 6, lineHeight: "1.6", padding: "0 2px" }}>
                        Earn Head of Legends by catching each Legendary 9 fish for the first time. Spend them on rare BetaXGruda Eggs.
                      </span>
                      <div className="flex items-center justify-between px-1 pt-1">
                        <div className="flex items-center gap-2">
                          <span style={{ color: "#ec4899", fontSize: 8, fontFamily: "'Press Start 2P', monospace", letterSpacing: 1 }}>BETA FISH EGGS</span>
                          <div style={{ flex: 1, height: 1, background: "rgba(236,72,153,0.3)" }} />
                        </div>
                        <span style={{ color: "#f59e0b", fontSize: 6, fontFamily: "'Press Start 2P', monospace", background: "rgba(245,158,11,0.15)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(245,158,11,0.3)" }} data-testid="text-beta-stock">LIMITED: {BETA_EGG_MAX_STOCK} TOTAL</span>
                      </div>
                      {BETAXGRUDA_EGGS.filter(e => e.type === "beta").map((egg, i) => {
                        const eggIdx = BETAXGRUDA_EGGS.indexOf(egg);
                        const owned = uiState.ownedEggs[eggIdx];
                        const stock = uiState.eggStock?.[eggIdx] ?? egg.maxStock;
                        const soldOut = stock <= 0 && !owned;
                        const canAfford = uiState.headOfLegends >= egg.cost && stock > 0;
                        return (
                          <div key={egg.name} className="flex items-start gap-2.5 p-2.5" style={{ background: owned ? "rgba(168,85,247,0.12)" : soldOut ? "rgba(255,0,0,0.04)" : "rgba(255,255,255,0.03)", borderRadius: 8, border: owned ? "1px solid rgba(168,85,247,0.4)" : soldOut ? "1px solid rgba(255,0,0,0.15)" : "1px solid rgba(255,255,255,0.06)", opacity: soldOut ? 0.5 : 1 }}>
                            <div className="flex items-center justify-center" style={{ width: 52, height: 52, background: "rgba(0,0,0,0.4)", borderRadius: 8, overflow: "hidden" }}>
                              <img src={egg.img} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span style={{ color: owned ? "#a855f7" : "#e0e0e0", fontSize: 8 }}>{egg.name}</span>
                                {owned && <span style={{ color: "#a855f7", fontSize: 6, background: "rgba(168,85,247,0.2)", padding: "1px 4px", borderRadius: 3 }}>OWNED</span>}
                                {soldOut && <span style={{ color: "#ef4444", fontSize: 6, background: "rgba(239,68,68,0.2)", padding: "1px 4px", borderRadius: 3 }}>SOLD OUT</span>}
                              </div>
                              <span style={{ color: "#78909c", fontSize: 7, lineHeight: "1.5" }}>{egg.description}</span>
                              {!owned && !soldOut && <span style={{ color: "#f59e0b", fontSize: 6 }}>{stock} of {egg.maxStock} remaining</span>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {!owned && !soldOut ? (
                                <button
                                  className="cursor-pointer px-3 py-1.5"
                                  style={{ background: canAfford ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.05)", borderRadius: 6, border: canAfford ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.1)", fontFamily: "'Press Start 2P', monospace", color: canAfford ? "#a855f7" : "#455a64", fontSize: 7, opacity: canAfford ? 1 : 0.5 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canAfford) return;
                                    const st = stateRef.current;
                                    st.headOfLegends -= egg.cost;
                                    st.ownedEggs[eggIdx] = true;
                                    st.eggStock[eggIdx] = Math.max(0, st.eggStock[eggIdx] - 1);
                                    syncUI();
                                  }}
                                  data-testid={`button-buy-egg-${eggIdx}`}
                                >
                                  {egg.cost} HEAD
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between px-1 pt-2">
                        <div className="flex items-center gap-2">
                          <span style={{ color: "#ef4444", fontSize: 8, fontFamily: "'Press Start 2P', monospace", letterSpacing: 1 }}>WARLORD EGGS</span>
                          <div style={{ flex: 1, height: 1, background: "rgba(239,68,68,0.3)" }} />
                        </div>
                        <span style={{ color: "#ef4444", fontSize: 6, fontFamily: "'Press Start 2P', monospace", background: "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.3)" }} data-testid="text-warlord-stock">LIMITED: {WARLORD_EGG_MAX_STOCK} TOTAL</span>
                      </div>
                      {BETAXGRUDA_EGGS.filter(e => e.type === "warlord").map((egg) => {
                        const eggIdx = BETAXGRUDA_EGGS.indexOf(egg);
                        const owned = uiState.ownedEggs[eggIdx];
                        const stock = uiState.eggStock?.[eggIdx] ?? egg.maxStock;
                        const soldOut = stock <= 0 && !owned;
                        const canAfford = uiState.headOfLegends >= egg.cost && stock > 0;
                        return (
                          <div key={egg.name} className="flex items-start gap-2.5 p-2.5" style={{ background: owned ? "rgba(239,68,68,0.12)" : soldOut ? "rgba(255,0,0,0.04)" : "rgba(255,255,255,0.03)", borderRadius: 8, border: owned ? "1px solid rgba(239,68,68,0.4)" : soldOut ? "1px solid rgba(255,0,0,0.15)" : "1px solid rgba(255,255,255,0.06)", opacity: soldOut ? 0.5 : 1 }}>
                            <div className="flex items-center justify-center" style={{ width: 52, height: 52, background: "rgba(0,0,0,0.4)", borderRadius: 8, overflow: "hidden" }}>
                              <img src={egg.img} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span style={{ color: owned ? "#ef4444" : "#e0e0e0", fontSize: 8 }}>{egg.name}</span>
                                {owned && <span style={{ color: "#ef4444", fontSize: 6, background: "rgba(239,68,68,0.2)", padding: "1px 4px", borderRadius: 3 }}>OWNED</span>}
                                {soldOut && <span style={{ color: "#ef4444", fontSize: 6, background: "rgba(239,68,68,0.2)", padding: "1px 4px", borderRadius: 3 }}>SOLD OUT</span>}
                              </div>
                              <span style={{ color: "#78909c", fontSize: 7, lineHeight: "1.5" }}>{egg.description}</span>
                              {!owned && !soldOut && <span style={{ color: "#f59e0b", fontSize: 6 }}>{stock} of {egg.maxStock} remaining</span>}
                              {!owned && !soldOut && <span style={{ color: "#f59e0b", fontSize: 6 }}>Requires 2 Heads of Legends</span>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {!owned && !soldOut ? (
                                <button
                                  className="cursor-pointer px-3 py-1.5"
                                  style={{ background: canAfford ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.05)", borderRadius: 6, border: canAfford ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)", fontFamily: "'Press Start 2P', monospace", color: canAfford ? "#ef4444" : "#455a64", fontSize: 7, opacity: canAfford ? 1 : 0.5 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canAfford) return;
                                    const st = stateRef.current;
                                    st.headOfLegends -= egg.cost;
                                    st.ownedEggs[eggIdx] = true;
                                    st.eggStock[eggIdx] = Math.max(0, st.eggStock[eggIdx] - 1);
                                    syncUI();
                                  }}
                                  data-testid={`button-buy-egg-${eggIdx}`}
                                >
                                  {egg.cost} HEADS
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Current Equipment Summary */}
                <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex flex-col gap-0.5">
                    <span style={{ color: "#78909c", fontSize: 6 }}>EQUIPPED</span>
                    <span style={{ color: "#e0e0e0", fontSize: 7 }}>{RODS[uiState.equippedRod].name} + {LURES[uiState.equippedLure].name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NPC Chat Overlay */}
          {uiState.gameState === "npcChat" && uiState.activeNpc >= 0 && uiState.activeNpc < uiState.npcs.length && (() => {
            const npc = uiState.npcs[uiState.activeNpc];
            const roleColors: Record<string, string> = { shopkeeper: "#2ecc71", requester: "#f39c12", mission_giver: "#e74c3c" };
            const roleColor = roleColors[npc.role] || "#ffffff";
            const roleLabels: Record<string, string> = { shopkeeper: "SHOP", requester: "REQUEST", mission_giver: "MISSION" };
            return (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 80, background: "rgba(0,0,0,0.5)" }} data-testid="npc-overlay">
                <div className="flex flex-col" style={{ background: "rgba(8,15,25,0.97)", borderRadius: 12, border: `1px solid ${roleColor}44`, width: Math.min(420, window.innerWidth * 0.9), maxHeight: "80vh", overflow: "hidden" }} data-testid="npc-panel">
                  <div className="flex items-center justify-between p-3" style={{ borderBottom: `1px solid ${roleColor}33` }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 40, height: 40, background: `${roleColor}22`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <img src={`/assets/npcs/${npc.spriteFolder}/Idle.png`} alt="" style={{ width: 40, height: 40, objectFit: "cover", objectPosition: "0 0", imageRendering: "pixelated" }} />
                      </div>
                      <div>
                        <span style={{ color: roleColor, fontSize: 11, fontFamily: "'Press Start 2P', monospace" }}>{npc.name}</span>
                        <div style={{ color: "#78909c", fontSize: 7, fontFamily: "'Press Start 2P', monospace", marginTop: 2 }}>{roleLabels[npc.role]}</div>
                      </div>
                    </div>
                    <button
                      className="cursor-pointer px-2 py-1"
                      style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", fontFamily: "'Press Start 2P', monospace", color: "#78909c", fontSize: 10 }}
                      onClick={(e) => { e.stopPropagation(); stateRef.current.gameState = "idle"; stateRef.current.activeNpc = -1; syncUI(); }}
                      data-testid="button-close-npc"
                    >
                      X
                    </button>
                  </div>

                  <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                      className="flex-1 px-3 py-2 cursor-pointer"
                      style={{ background: uiState.npcTab === "talk" ? `${roleColor}22` : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.npcTab === "talk" ? roleColor : "#607d8b", fontSize: 8, borderBottom: uiState.npcTab === "talk" ? `2px solid ${roleColor}` : "2px solid transparent" }}
                      onClick={(e) => { e.stopPropagation(); stateRef.current.npcTab = "talk"; syncUI(); }}
                      data-testid="button-npc-talk"
                    >
                      TALK
                    </button>
                    {npc.role === "shopkeeper" && (
                      <button
                        className="flex-1 px-3 py-2 cursor-pointer"
                        style={{ background: uiState.npcTab === "shop" ? `${roleColor}22` : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.npcTab === "shop" ? roleColor : "#607d8b", fontSize: 8, borderBottom: uiState.npcTab === "shop" ? `2px solid ${roleColor}` : "2px solid transparent" }}
                        onClick={(e) => { e.stopPropagation(); stateRef.current.npcTab = "shop"; syncUI(); }}
                        data-testid="button-npc-shop"
                      >
                        SHOP
                      </button>
                    )}
                    {npc.role === "requester" && (
                      <button
                        className="flex-1 px-3 py-2 cursor-pointer"
                        style={{ background: uiState.npcTab === "request" ? `${roleColor}22` : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.npcTab === "request" ? roleColor : "#607d8b", fontSize: 8, borderBottom: uiState.npcTab === "request" ? `2px solid ${roleColor}` : "2px solid transparent" }}
                        onClick={(e) => { e.stopPropagation(); stateRef.current.npcTab = "request"; syncUI(); }}
                        data-testid="button-npc-request"
                      >
                        REQUEST
                      </button>
                    )}
                    {npc.role === "mission_giver" && (
                      <button
                        className="flex-1 px-3 py-2 cursor-pointer"
                        style={{ background: uiState.npcTab === "mission" ? `${roleColor}22` : "transparent", fontFamily: "'Press Start 2P', monospace", color: uiState.npcTab === "mission" ? roleColor : "#607d8b", fontSize: 8, borderBottom: uiState.npcTab === "mission" ? `2px solid ${roleColor}` : "2px solid transparent" }}
                        onClick={(e) => { e.stopPropagation(); stateRef.current.npcTab = "mission"; syncUI(); }}
                        data-testid="button-npc-mission"
                      >
                        MISSION
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: "55vh" }}>
                    {uiState.npcTab === "talk" && (
                      <div className="flex flex-col gap-3">
                        <div style={{ background: `${roleColor}11`, borderRadius: 8, padding: "10px 12px", border: `1px solid ${roleColor}22` }}>
                          <span style={{ color: "#e0e0e0", fontSize: 9, fontFamily: "'Press Start 2P', monospace", lineHeight: "18px" }}>{npc.greeting}</span>
                        </div>
                        {npc.dialogueLines.map((line, di) => (
                          <div key={di} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 10px" }}>
                            <span style={{ color: "#b0bec5", fontSize: 8, fontFamily: "'Press Start 2P', monospace", lineHeight: "16px" }}>{line}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {uiState.npcTab === "shop" && npc.shopItems && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 12, height: 12 }} />
                          <span style={{ color: "#2ecc71", fontSize: 9, fontFamily: "'Press Start 2P', monospace" }}>{uiState.money} gbux</span>
                        </div>
                        {npc.shopItems.map((item, si) => (
                          <div key={si} className="flex items-center gap-3 p-2" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                            <img src={item.icon} alt="" style={{ width: 28, height: 28, imageRendering: "pixelated" }} />
                            <div className="flex-1">
                              <div style={{ color: "#e0e0e0", fontSize: 8, fontFamily: "'Press Start 2P', monospace" }}>{item.name}</div>
                              <div style={{ color: "#78909c", fontSize: 7, fontFamily: "'Press Start 2P', monospace", marginTop: 2 }}>{item.description}</div>
                            </div>
                            <button
                              className="cursor-pointer px-3 py-1"
                              style={{
                                background: uiState.money >= item.price ? "rgba(46,204,113,0.2)" : "rgba(255,255,255,0.05)",
                                borderRadius: 6,
                                border: `1px solid ${uiState.money >= item.price ? "rgba(46,204,113,0.4)" : "rgba(255,255,255,0.1)"}`,
                                fontFamily: "'Press Start 2P', monospace",
                                color: uiState.money >= item.price ? "#2ecc71" : "#607d8b",
                                fontSize: 8,
                                opacity: uiState.money >= item.price ? 1 : 0.5,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const s = stateRef.current;
                                if (s.money < item.price) return;
                                s.money -= item.price;
                                if (item.type === "chum") {
                                  s.ownedChum[item.index] = (s.ownedChum[item.index] || 0) + 1;
                                } else if (item.type === "lure") {
                                  s.ownedLures[item.index] = true;
                                }
                                syncUI();
                              }}
                              data-testid={`button-npc-buy-${si}`}
                            >
                              {item.price}g
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {uiState.npcTab === "request" && npc.request && (
                      <div className="flex flex-col gap-3">
                        <div style={{ background: "rgba(243,156,18,0.1)", borderRadius: 8, padding: "12px", border: "1px solid rgba(243,156,18,0.2)" }}>
                          <div style={{ color: "#f39c12", fontSize: 9, fontFamily: "'Press Start 2P', monospace", marginBottom: 6 }}>REQUEST</div>
                          <div style={{ color: "#e0e0e0", fontSize: 8, fontFamily: "'Press Start 2P', monospace", lineHeight: "16px" }}>{npc.request.description}</div>
                        </div>
                        <div className="flex items-center justify-between p-2" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                          <div>
                            <span style={{ color: "#b0bec5", fontSize: 8, fontFamily: "'Press Start 2P', monospace" }}>Progress: </span>
                            <span style={{ color: npc.request.completed ? "#2ecc71" : "#f39c12", fontSize: 9, fontFamily: "'Press Start 2P', monospace" }}>
                              {npc.request.fulfilled}/{npc.request.count}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: "#78909c", fontSize: 7, fontFamily: "'Press Start 2P', monospace" }}>Reward:</span>
                            <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 10, height: 10 }} />
                            <span style={{ color: "#2ecc71", fontSize: 8, fontFamily: "'Press Start 2P', monospace" }}>{npc.request.reward}</span>
                          </div>
                        </div>
                        <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(npc.request.fulfilled / npc.request.count) * 100}%`, height: "100%", background: npc.request.completed ? "#2ecc71" : "#f39c12", borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                        {npc.request.completed && (
                          <div style={{ color: "#2ecc71", fontSize: 9, fontFamily: "'Press Start 2P', monospace", textAlign: "center", marginTop: 4 }}>
                            COMPLETED! Reward collected!
                          </div>
                        )}
                      </div>
                    )}

                    {uiState.npcTab === "mission" && npc.mission && (
                      <div className="flex flex-col gap-3">
                        <div style={{ background: "rgba(231,76,60,0.1)", borderRadius: 8, padding: "12px", border: "1px solid rgba(231,76,60,0.2)" }}>
                          <div style={{ color: "#e74c3c", fontSize: 9, fontFamily: "'Press Start 2P', monospace", marginBottom: 6 }}>MISSION</div>
                          <div style={{ color: "#e0e0e0", fontSize: 8, fontFamily: "'Press Start 2P', monospace", lineHeight: "16px" }}>{npc.mission.description}</div>
                        </div>
                        <div className="flex items-center justify-between p-2" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                          <div>
                            <span style={{ color: "#b0bec5", fontSize: 8, fontFamily: "'Press Start 2P', monospace" }}>Progress: </span>
                            <span style={{ color: npc.mission.completed ? "#2ecc71" : "#e74c3c", fontSize: 9, fontFamily: "'Press Start 2P', monospace" }}>
                              {npc.mission.caught}/{npc.mission.count}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: "#78909c", fontSize: 7, fontFamily: "'Press Start 2P', monospace" }}>Reward:</span>
                            <img src="/assets/icons/gbux.png" alt="gbux" style={{ width: 10, height: 10 }} />
                            <span style={{ color: "#2ecc71", fontSize: 8, fontFamily: "'Press Start 2P', monospace" }}>{npc.mission.reward}</span>
                          </div>
                        </div>
                        <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(npc.mission.caught / npc.mission.count) * 100}%`, height: "100%", background: npc.mission.completed ? "#2ecc71" : "#e74c3c", borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                        {npc.mission.completed && (
                          <div style={{ color: "#2ecc71", fontSize: 9, fontFamily: "'Press Start 2P', monospace", textAlign: "center", marginTop: 4 }}>
                            MISSION COMPLETE! Reward collected!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Swimming Prompt */}
          {uiState.gameState === "swimming" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-4 py-2 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.7)", borderRadius: 8, pointerEvents: "none" }} data-testid="swim-prompt">
              <span style={{ color: "#5dade2", fontSize: 10, textShadow: "1px 1px 0 #000" }}>W/A/S/D to swim</span>
              <span style={{ color: "#78909c", fontSize: 8, textShadow: "1px 1px 0 #000" }}>SPACE near dock to climb out</span>
            </div>
          )}
        </>
      )}

      {/* Character Panel (Tab) */}
      {showCharPanel && uiState.characterSelected && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 200, background: "rgba(5,10,20,0.85)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { e.stopPropagation(); setShowCharPanel(false); }}
          data-testid="char-panel-overlay"
        >
          <div
            className="flex flex-col"
            style={{
              width: Math.min(680, window.innerWidth * 0.92),
              maxHeight: "90vh",
              background: "linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.95))",
              border: `2px solid ${CHARACTER_VARIANTS[uiState.selectedCharacter].color}30`,
              borderRadius: 14,
              overflow: "hidden",
              fontFamily: "'Press Start 2P', monospace",
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="char-panel"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${CHARACTER_VARIANTS[uiState.selectedCharacter].color}25`, background: "rgba(0,0,0,0.2)" }}>
              <img src={CHARACTER_VARIANTS[uiState.selectedCharacter].selectImg} alt="" style={{ height: 52, imageRendering: "pixelated", filter: `drop-shadow(0 0 6px ${CHARACTER_VARIANTS[uiState.selectedCharacter].color}50)` }} />
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <img src={CHARACTER_VARIANTS[uiState.selectedCharacter].factionIcon} alt="" style={{ width: 18, height: 18 }} />
                  <span style={{ color: CHARACTER_VARIANTS[uiState.selectedCharacter].color, fontSize: 12, fontWeight: "bold" }}>{uiState.playerName || "Angler"}</span>
                  <span style={{ color: "#607d8b", fontSize: 7 }}>Lv.{uiState.playerLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#455a64", fontSize: 6 }}>{CHARACTER_VARIANTS[uiState.selectedCharacter].name} Faction</span>
                  <div className="flex items-center gap-1">
                    <img src="/assets/icons/gbux.png" alt="" style={{ width: 10, height: 10, imageRendering: "pixelated" }} />
                    <span style={{ color: "#f1c40f", fontSize: 7 }}>{uiState.money}</span>
                  </div>
                </div>
                {/* XP Bar */}
                <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(uiState.playerXP / uiState.playerXPToNext) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${CHARACTER_VARIANTS[uiState.selectedCharacter].color}, ${CHARACTER_VARIANTS[uiState.selectedCharacter].color}80)`, borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                <span style={{ color: "#455a64", fontSize: 5 }}>XP: {uiState.playerXP}/{uiState.playerXPToNext}</span>
              </div>
              <button
                className="cursor-pointer px-2 py-1"
                style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", color: "#78909c", fontSize: 10, fontFamily: "'Press Start 2P', monospace" }}
                onClick={() => setShowCharPanel(false)}
                data-testid="button-close-char-panel"
              >X</button>
            </div>

            {/* Tab Navigation */}
            <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {([["stats", "STATS"], ["equipment", "EQUIP"], ["history", "HISTORY"], ["collection", "FISH LOG"]] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  className="flex-1 py-2 cursor-pointer"
                  style={{
                    background: charPanelTab === tab ? `${CHARACTER_VARIANTS[uiState.selectedCharacter].color}15` : "transparent",
                    borderBottom: charPanelTab === tab ? `2px solid ${CHARACTER_VARIANTS[uiState.selectedCharacter].color}` : "2px solid transparent",
                    color: charPanelTab === tab ? CHARACTER_VARIANTS[uiState.selectedCharacter].color : "#455a64",
                    fontSize: 7,
                    fontFamily: "'Press Start 2P', monospace",
                    border: "none",
                    borderBottomWidth: 2,
                    borderBottomStyle: "solid",
                    borderBottomColor: charPanelTab === tab ? CHARACTER_VARIANTS[uiState.selectedCharacter].color : "transparent",
                    transition: "all 0.2s",
                  }}
                  onClick={() => setCharPanelTab(tab)}
                  data-testid={`button-tab-${tab}`}
                >{label}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(90vh - 160px)", padding: 16 }}>

              {/* STATS TAB */}
              {charPanelTab === "stats" && (
                <div className="flex flex-col gap-3">
                  {uiState.attributePoints > 0 && (
                    <div className="flex items-center gap-2 p-2" style={{ background: "rgba(110,231,183,0.08)", borderRadius: 8, border: "1px solid rgba(110,231,183,0.2)" }}>
                      <span style={{ color: "#6ee7b7", fontSize: 8 }}>Attribute Points Available:</span>
                      <span style={{ color: "#6ee7b7", fontSize: 14, fontWeight: "bold" }}>{uiState.attributePoints}</span>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {ATTR_KEYS.map(attrKey => {
                      const def = FISHING_ATTR_DEFS[attrKey];
                      const val = uiState.attributes[attrKey];
                      return (
                        <div key={attrKey} className="flex flex-col gap-1.5" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10, border: `1px solid ${def.color}18` }}>
                          <div className="flex items-center justify-between">
                            <span style={{ color: def.color, fontSize: 8, fontWeight: "bold" }}>{attrKey}</span>
                            <span style={{ color: "#e8eaf6", fontSize: 12, fontWeight: "bold" }}>{val}</span>
                          </div>
                          <div style={{ color: "#607d8b", fontSize: 5, lineHeight: "1.6" }}>{def.description}</div>
                          <div className="flex flex-col gap-0.5" style={{ marginTop: 2 }}>
                            {Object.values(def.gains).map(g => (
                              <div key={g.label} className="flex justify-between" style={{ fontSize: 5, color: "#78909c" }}>
                                <span>{g.label}</span>
                                <span style={{ color: def.color }}>+{(g.perPoint * val).toFixed(1)}{g.unit}</span>
                              </div>
                            ))}
                          </div>
                          {uiState.attributePoints > 0 && (
                            <button
                              className="cursor-pointer mt-1"
                              style={{
                                background: `${def.color}20`,
                                border: `1px solid ${def.color}40`,
                                borderRadius: 4,
                                color: def.color,
                                fontSize: 6,
                                padding: "3px 0",
                                fontFamily: "'Press Start 2P', monospace",
                                transition: "all 0.2s",
                              }}
                              onClick={() => {
                                const s = stateRef.current;
                                if (s.attributePoints > 0) {
                                  s.attributes[attrKey]++;
                                  s.attributePoints--;
                                  syncUI();
                                }
                              }}
                              data-testid={`button-attr-${attrKey}`}
                            >+ 1</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Derived Stats Summary */}
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "#6ee7b7", fontSize: 8, marginBottom: 8 }}>DERIVED STATS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                      {(() => {
                        const tG = 1 + uiState.attributes.Tactics * 0.005;
                        const forcePool = 10 + Math.max(uiState.attributes.Strength, uiState.attributes.Agility);
                        const wisdomReduce = Math.max(0.5, 5 - uiState.attributes.Wisdom * 0.1);
                        const forceCostBase = uiState.playerLevel * wisdomReduce;
                        const intReduce = 1 - Math.min(0.9, uiState.attributes.Intellect * 0.02);
                        const forceCost = forceCostBase * intReduce;
                        const forceRegen = 0.1 + 0.1 * uiState.attributes.Vitality;
                        return [
                          { label: "Drag Force", value: `+${(uiState.attributes.Strength * 1.5 * tG).toFixed(0)}%`, color: "#ef4444" },
                          { label: "Force Pool", value: `${forcePool}`, color: "#3b82f6" },
                          { label: "Force Cost/s", value: `${forceCost.toFixed(1)}`, color: "#f87171" },
                          { label: "Force Regen/s", value: `${forceRegen.toFixed(1)}`, color: "#60a5fa" },
                          { label: "Sell Bonus", value: `+${(uiState.attributes.Intellect * 1.2 * tG).toFixed(0)}%`, color: "#8b5cf6" },
                          { label: "Bite Window", value: `+${(uiState.attributes.Vitality * 1.0 * tG).toFixed(0)}%`, color: "#22c55e" },
                          { label: "Hook Control", value: `+${(uiState.attributes.Dexterity * 1.0 * tG).toFixed(0)}%`, color: "#f59e0b" },
                          { label: "Break Resist", value: `+${(uiState.attributes.Endurance * 1.2 * tG).toFixed(0)}%`, color: "#78716c" },
                          { label: "Rarity Boost", value: `+${(uiState.attributes.Wisdom * 1.0 * tG).toFixed(0)}%`, color: "#06b6d4" },
                          { label: "Reel Speed", value: `+${(uiState.attributes.Agility * 0.8 * tG).toFixed(0)}%`, color: "#a3e635" },
                          { label: "Tactics Amp", value: `x${tG.toFixed(2)}`, color: "#ec4899" },
                          { label: "Total Attrs", value: `${Object.values(uiState.attributes).reduce((a, b) => a + b, 0)}`, color: "#ffd54f" },
                        ];
                      })().map(stat => (
                        <div key={stat.label} className="flex flex-col items-center gap-0.5" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 4, padding: "4px 2px" }}>
                          <span style={{ color: "#607d8b", fontSize: 5 }}>{stat.label}</span>
                          <span style={{ color: stat.color, fontSize: 8, fontWeight: "bold" }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* EQUIPMENT TAB */}
              {charPanelTab === "equipment" && (
                <div className="flex flex-col gap-3">
                  <div style={{ color: "#6ee7b7", fontSize: 8, marginBottom: 4 }}>EQUIPPED ROD</div>
                  <div className="flex items-center gap-3 p-3" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(46,204,113,0.15)" }}>
                    <img src={RODS[uiState.equippedRod].icon} alt="" style={{ width: 36, height: 36, imageRendering: "pixelated" }} />
                    <div className="flex flex-col gap-1 flex-1">
                      <span style={{ color: "#2ecc71", fontSize: 9, fontWeight: "bold" }}>{RODS[uiState.equippedRod].name}</span>
                      <span style={{ color: "#607d8b", fontSize: 6 }}>{RODS[uiState.equippedRod].description}</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 5, color: "#5dade2" }}>Catch Zone: +{(RODS[uiState.equippedRod].catchZoneBonus * 100).toFixed(1)}%</span>
                        <span style={{ fontSize: 5, color: "#f1c40f" }}>Reel Speed: x{RODS[uiState.equippedRod].reelSpeedMult}</span>
                        <span style={{ fontSize: 5, color: "#e74c3c" }}>Line Str: x{RODS[uiState.equippedRod].lineStrength}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "#6ee7b7", fontSize: 8, marginTop: 8, marginBottom: 4 }}>EQUIPPED BAIT / LURE</div>
                  <div className="flex items-center gap-3 p-3" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(46,204,113,0.15)" }}>
                    <img src={LURES[uiState.equippedLure].icon} alt="" style={{ width: 36, height: 36, imageRendering: "pixelated" }} />
                    <div className="flex flex-col gap-1 flex-1">
                      <span style={{ color: "#2ecc71", fontSize: 9, fontWeight: "bold" }}>{LURES[uiState.equippedLure].name}</span>
                      <span style={{ color: "#607d8b", fontSize: 6 }}>{LURES[uiState.equippedLure].description}</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 5, color: "#a855f7" }}>Rarity: x{LURES[uiState.equippedLure].rarityBoost}</span>
                        <span style={{ fontSize: 5, color: "#f59e0b" }}>Size: +{LURES[uiState.equippedLure].sizeBoost}</span>
                        <span style={{ fontSize: 5, color: "#5dade2" }}>Speed: x{LURES[uiState.equippedLure].speedBoost}</span>
                      </div>
                      {LURES[uiState.equippedLure].targetFish.length > 0 && (
                        <span style={{ fontSize: 5, color: "#78909c", marginTop: 2 }}>Targets: {LURES[uiState.equippedLure].targetFish.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: "#6ee7b7", fontSize: 8, marginTop: 8, marginBottom: 4 }}>OWNED RODS</div>
                  <div className="flex flex-col gap-1.5">
                    {RODS.map((rod, i) => (
                      <div key={rod.name} className="flex items-center gap-2 px-2 py-1.5" style={{
                        background: uiState.ownedRods[i] ? "rgba(46,204,113,0.06)" : "rgba(255,255,255,0.02)",
                        borderRadius: 6,
                        border: i === uiState.equippedRod ? "1px solid rgba(46,204,113,0.3)" : "1px solid rgba(255,255,255,0.04)",
                        opacity: uiState.ownedRods[i] ? 1 : 0.4,
                      }}>
                        <img src={rod.icon} alt="" style={{ width: 20, height: 20, imageRendering: "pixelated" }} />
                        <span style={{ color: uiState.ownedRods[i] ? "#b0bec5" : "#37474f", fontSize: 7, flex: 1 }}>{rod.name}</span>
                        {i === uiState.equippedRod && <span style={{ color: "#2ecc71", fontSize: 5 }}>EQUIPPED</span>}
                        {!uiState.ownedRods[i] && <span style={{ color: "#455a64", fontSize: 5 }}>LOCKED</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HISTORY TAB */}
              {charPanelTab === "history" && (
                <div className="flex flex-col gap-2">
                  <div style={{ color: "#6ee7b7", fontSize: 8, marginBottom: 4 }}>RECENT CATCHES</div>
                  {uiState.catchHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-6 gap-2">
                      <img src="/assets/icons/Icons_03.png" alt="" className="w-8 h-8 opacity-30" style={{ imageRendering: "pixelated" }} />
                      <span style={{ color: "#455a64", fontSize: 7 }}>No catches yet</span>
                    </div>
                  )}
                  {uiState.catchHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 px-3 py-2" style={{
                      background: rarityBg(entry.rarity),
                      borderRadius: 6,
                      border: `1px solid ${rarityColor(entry.rarity)}18`,
                    }}>
                      <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
                        <span style={{ color: "#455a64", fontSize: 5 }}>#{idx + 1}</span>
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span style={{ color: rarityColor(entry.rarity), fontSize: 8, fontWeight: "bold" }}>{entry.name}</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-0">
                          <span style={{ color: "#78909c", fontSize: 5 }}>Size: {entry.size.toFixed(1)}x</span>
                          <span style={{ color: "#78909c", fontSize: 5 }}>Weight: {entry.weight.toFixed(1)} lbs</span>
                          <span className="flex items-center gap-0.5" style={{ fontSize: 5 }}>
                            <img src="/assets/icons/gbux.png" alt="" style={{ width: 8, height: 8, imageRendering: "pixelated" }} />
                            <span style={{ color: "#f1c40f" }}>{entry.sellPrice}</span>
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 5, color: "#0a0f1a", fontWeight: "bold",
                        background: rarityColor(entry.rarity), borderRadius: 3,
                        padding: "1px 4px", textTransform: "uppercase",
                      }}>{entry.rarity === "ultra_rare" ? "ULTRA" : entry.rarity}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* COLLECTION TAB */}
              {charPanelTab === "collection" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ color: "#6ee7b7", fontSize: 8 }}>FISH COLLECTION</div>
                    <span style={{ color: "#455a64", fontSize: 6 }}>{uiState.caughtCollection.filter(([,e]) => e.type).length}/{FISH_TYPES.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-3" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 8 }}>
                    <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 50 }}>
                      <span style={{ color: "#78909c", fontSize: 5 }}>TOTAL CAUGHT</span>
                      <span style={{ color: "#5dade2", fontSize: 10 }}>{uiState.totalCaught}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 50 }}>
                      <span style={{ color: "#78909c", fontSize: 5 }}>BEST COMBO</span>
                      <span style={{ color: "#f5b7b1", fontSize: 10 }}>x{uiState.bestCombo}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 60 }}>
                      <span style={{ color: "#78909c", fontSize: 5 }}>TOTAL WEIGHT</span>
                      <span style={{ color: "#78909c", fontSize: 10 }}>{Math.round(uiState.caughtCollection.reduce((sum, [,e]) => sum + e.totalWeight, 0) * 10) / 10} lbs</span>
                    </div>
                  </div>
                  {uiState.caughtCollection.map(([name, entry]) => {
                    const rarity = entry.type?.rarity || "common";
                    return (
                      <div key={name} className="flex items-start gap-2.5 p-2.5" style={{ background: rarityBg(rarity), borderRadius: 8, border: `1px solid ${rarityColor(rarity)}25` }}>
                        <div className="flex flex-col items-center gap-1" style={{ minWidth: 44 }}>
                          <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                            <img src={entry.type?.catchAsset || entry.junk?.asset || ""} alt={name} style={{ imageRendering: "pixelated", transform: "scale(2)", maxWidth: 36, maxHeight: 36 }} />
                          </div>
                          <span style={{ fontSize: 5, color: "#0a0f1a", fontWeight: "bold", background: rarityColor(rarity), borderRadius: 3, padding: "1px 3px", textTransform: "uppercase" }}>
                            {rarity === "ultra_rare" ? "ULTRA" : rarity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="truncate" style={{ color: rarityColor(rarity), fontSize: 8, fontWeight: "bold" }}>{name}</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-0">
                            <span style={{ color: "#5dade2", fontSize: 5 }}>x{entry.count}</span>
                            <span style={{ color: "#9b59b6", fontSize: 5 }}>Best: {entry.biggestSize.toFixed(1)}x</span>
                            <span style={{ color: "#78909c", fontSize: 5 }}>{Math.round(entry.totalWeight * 10) / 10} lbs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {FISH_TYPES.filter(ft => !uiState.caughtCollection.some(([n]) => n === ft.name)).map(ft => (
                    <div key={ft.name} className="flex items-center gap-2.5 p-2" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                        <span style={{ fontSize: 16, color: "#2a3a4a" }}>?</span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span style={{ color: "#37474f", fontSize: 7 }}>???</span>
                        <span style={{ color: rarityColor(ft.rarity), fontSize: 5, textTransform: "uppercase" }}>{ft.rarity === "ultra_rare" ? "ULTRA RARE" : ft.rarity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-center py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}>
              <span style={{ color: "#37474f", fontSize: 5 }}>Press TAB to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Collection Panel */}
      {showCollection && (
        <div
          className="absolute top-0 right-0 h-full flex flex-col"
          style={{
            width: Math.min(380, window.innerWidth * 0.88),
            background: "rgba(8,15,25,0.96)",
            borderLeft: "2px solid rgba(52,152,219,0.3)",
            zIndex: 100,
            backdropFilter: "blur(10px)",
          }}
          onClick={(e) => e.stopPropagation()}
          data-testid="collection-panel"
        >
          <div className="flex items-center justify-between p-3" style={{ borderBottom: "1px solid rgba(52,152,219,0.2)" }}>
            <div className="flex items-center gap-2">
              <img src="/assets/icons/Icons_05.png" alt="" className="w-5 h-5" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#3498db", fontSize: 10 }}>FISH LOG</span>
              <span style={{ color: "#455a64", fontSize: 7 }}>
                {uiState.caughtCollection.filter(([,e]) => e.type).length}/{FISH_TYPES.length} species
              </span>
            </div>
            <button
              className="cursor-pointer px-2 py-1"
              style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", fontFamily: "'Press Start 2P', monospace", color: "#78909c", fontSize: 10 }}
              onClick={() => setShowCollection(false)}
              data-testid="button-close-collection"
            >
              X
            </button>
          </div>

          {/* Player Stats */}
          <div className="flex flex-wrap gap-3 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 60 }}>
              <span style={{ color: "#78909c", fontSize: 6 }}>SCORE</span>
              <span style={{ color: "#ffd54f", fontSize: 10 }}>{uiState.score}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 50 }}>
              <span style={{ color: "#78909c", fontSize: 6 }}>CAUGHT</span>
              <span style={{ color: "#5dade2", fontSize: 10 }}>{uiState.totalCaught}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 50 }}>
              <span style={{ color: "#78909c", fontSize: 6 }}>BEST COMBO</span>
              <span style={{ color: "#f5b7b1", fontSize: 10 }}>x{uiState.bestCombo}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 50 }}>
              <span style={{ color: "#78909c", fontSize: 6 }}>ROD LV</span>
              <span style={{ color: "#9b59b6", fontSize: 10 }}>{uiState.rodLevel}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 60 }}>
              <span style={{ color: "#78909c", fontSize: 6 }}>TOTAL WEIGHT</span>
              <span style={{ color: "#78909c", fontSize: 10 }}>
                {Math.round(uiState.caughtCollection.reduce((sum, [,e]) => sum + e.totalWeight, 0) * 10) / 10} lbs
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
            {uiState.caughtCollection.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-8 gap-3">
                <img src="/assets/icons/Icons_03.png" alt="" className="w-10 h-10 opacity-30" style={{ imageRendering: "pixelated" }} />
                <span style={{ color: "#455a64", fontSize: 8, textAlign: "center", lineHeight: "1.5" }}>
                  No fish caught yet!<br />Start fishing to fill<br />your collection.
                </span>
              </div>
            )}
            {uiState.caughtCollection.map(([name, entry]) => {
              const rarity = entry.type?.rarity || "common";
              const sizeLabel = entry.biggestSize < 1 ? "Tiny" : entry.biggestSize < 1.5 ? "Small" : entry.biggestSize < 2.5 ? "Medium" : entry.biggestSize < 4 ? "Large" : "Massive";
              return (
                <div
                  key={name}
                  className="flex items-start gap-2.5 p-2.5"
                  style={{
                    background: rarityBg(rarity),
                    borderRadius: 8,
                    border: `1px solid ${rarityColor(rarity)}25`,
                  }}
                >
                  <div className="flex flex-col items-center gap-1" style={{ minWidth: 52 }}>
                    <div className="flex items-center justify-center" style={{ width: 48, height: 48, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                      <img
                        src={entry.type?.catchAsset || entry.junk?.asset || ""}
                        alt={name}
                        style={{ imageRendering: "pixelated", transform: "scale(2.5)", maxWidth: 40, maxHeight: 40 }}
                      />
                    </div>
                    {entry.type && (
                      <span style={{
                        fontSize: 6, color: "#0a0f1a", fontWeight: "bold",
                        background: rarityColor(rarity), borderRadius: 3,
                        padding: "1px 4px", textTransform: "uppercase",
                      }}>
                        {rarity === "ultra_rare" ? "ULTRA RARE" : rarity}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="truncate" style={{ color: rarityColor(rarity), fontSize: 10, fontWeight: "bold" }}>{name}</div>
                    {entry.type && (
                      <div style={{ color: "#607d8b", fontSize: 7, lineHeight: "1.6" }}>
                        {entry.type.description}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ marginTop: 2 }}>
                      <span style={{ color: "#5dade2", fontSize: 7 }}>Caught: {entry.count}</span>
                      <span style={{ color: "#f1c40f", fontSize: 7 }}>Pts: {entry.type?.points || 0}</span>
                      <span style={{ color: "#e74c3c", fontSize: 7 }}>Combo: x{entry.bestCombo}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      <span style={{ color: "#9b59b6", fontSize: 7 }}>Biggest: {sizeLabel} ({entry.biggestSize.toFixed(1)}x)</span>
                      <span style={{ color: "#78909c", fontSize: 7 }}>Total: {Math.round(entry.totalWeight * 10) / 10} lbs</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Undiscovered fish hints */}
            {FISH_TYPES.filter(ft => !uiState.caughtCollection.some(([n]) => n === ft.name)).map(ft => (
              <div
                key={ft.name}
                className="flex items-center gap-2.5 p-2.5"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-center" style={{ width: 48, height: 48, background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                  <span style={{ fontSize: 18, color: "#2a3a4a" }}>?</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div style={{ color: "#37474f", fontSize: 9 }}>???</div>
                  <div style={{ color: rarityColor(ft.rarity), fontSize: 6, textTransform: "uppercase" }}>{ft.rarity === "ultra_rare" ? "ULTRA RARE" : ft.rarity}</div>
                  <div style={{ color: "#2a3a4a", fontSize: 7 }}>Not yet discovered</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Toggle Button */}
      {uiState.gameState !== "intro" && uiState.gameState !== "title" && uiState.gameState !== "charSelect" && (
        <div
          onClick={() => { const s = stateRef.current; s.adminOpen = !s.adminOpen; syncUI(); }}
          style={{
            position: "absolute", top: 8, right: 8, zIndex: 60,
            background: uiState.adminOpen ? "rgba(79,195,247,0.25)" : "rgba(8,15,25,0.8)",
            border: uiState.adminOpen ? "1px solid rgba(79,195,247,0.5)" : "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 7, color: "#4fc3f7",
          }}
          data-testid="button-admin-toggle"
        >
          ADMIN
        </div>
      )}

      {/* Admin Panel Overlay */}
      {uiState.adminOpen && (
        <div style={{
          position: "absolute", top: 0, right: 0, width: 340, height: "100%", zIndex: 55,
          background: "rgba(5,12,30,0.95)", borderLeft: "1px solid rgba(79,195,247,0.2)",
          display: "flex", flexDirection: "column", fontFamily: "'Press Start 2P', monospace",
          overflow: "hidden",
        }} data-testid="admin-panel">
          {/* Admin Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "6px 8px", gap: 4 }}>
            {(["assets", "gizmo", "trace"] as const).map(tab => (
              <div
                key={tab}
                onClick={() => { stateRef.current.adminTab = tab; syncUI(); }}
                style={{
                  flex: 1, textAlign: "center", padding: "5px 4px", cursor: "pointer", fontSize: 6,
                  color: uiState.adminTab === tab ? "#4fc3f7" : "#607d8b",
                  background: uiState.adminTab === tab ? "rgba(79,195,247,0.1)" : "transparent",
                  borderRadius: 4, textTransform: "uppercase",
                  border: uiState.adminTab === tab ? "1px solid rgba(79,195,247,0.3)" : "1px solid transparent",
                }}
                data-testid={`admin-tab-${tab}`}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Assets Tab */}
          {uiState.adminTab === "assets" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {[
                { label: "Character Sprites", items: CHARACTER_VARIANTS.flatMap(cv => [
                  { name: `${cv.name} Idle`, src: `/assets/${cv.folder}/Fisherman_idle.png`, frames: 4 },
                  { name: `${cv.name} Walk`, src: `/assets/${cv.folder}/Fisherman_walk.png`, frames: 6 },
                  { name: `${cv.name} Fish`, src: `/assets/${cv.folder}/Fisherman_fish.png`, frames: 4 },
                  { name: `${cv.name} Attack`, src: `/assets/${cv.folder}/Fisherman_attack.png`, frames: 6 },
                  { name: `${cv.name} Swim`, src: `/assets/${cv.folder}/Fisherman_swim.png`, frames: 6 },
                  { name: `${cv.name} Jump`, src: `/assets/${cv.folder}/Fisherman_jump.png`, frames: 6 },
                  { name: `${cv.name} Hurt`, src: `/assets/${cv.folder}/Fisherman_hurt.png`, frames: 2 },
                  { name: `${cv.name} Idle2`, src: `/assets/${cv.folder}/Fisherman_idle2.png`, frames: 4, unused: true },
                  { name: `${cv.name} Inspect`, src: `/assets/${cv.folder}/Fisherman_inspect.png`, frames: 4, unused: true },
                  { name: `${cv.name} Death`, src: `/assets/${cv.folder}/Fisherman_death.png`, frames: 6, unused: true },
                ]) },
                { label: "Fish Species", items: FISH_TYPES.map(f => ({
                  name: f.name, src: f.catchAsset, frames: 1,
                  meta: `${f.rarity} | ${f.points}pts`,
                })) },
                { label: "Creatures (Swim)", items: [1,2,3,4,5,6].map(n => ({
                  name: `Creature ${n} Walk`, src: `/assets/creatures/${n}/Walk.png`, frames: 4,
                })) },
                { label: "Crabs", items: BEACH_CRABS.map(c => ({
                  name: c.name, src: c.spriteSheet || "", frames: 4,
                  meta: c.rarity,
                })) },
                { label: "Predators", items: PREDATOR_TYPES.map(p => ([
                  { name: `${p.name} Idle`, src: `/assets/predators/${p.folder}/Idle.png`, frames: p.idleFrames },
                  { name: `${p.name} Walk`, src: `/assets/predators/${p.folder}/Walk.png`, frames: p.walkFrames },
                  { name: `${p.name} Attack`, src: `/assets/predators/${p.folder}/Attack1.png`, frames: p.attackFrames },
                ])).flat() },
                { label: "Objects", items: [
                  { name: "Fishing Hut", src: "/assets/objects/Fishing_hut.png", frames: 1 },
                  { name: "Pier Tiles", src: "/assets/objects/Pier_Tiles.png", frames: 1 },
                  { name: "Boat", src: "/assets/objects/Boat.png", frames: 1 },
                  { name: "Boat 2", src: "/assets/objects/Boat2.png", frames: 1 },
                  { name: "Fish Rod", src: "/assets/objects/Fish-rod.png", frames: 1 },
                  { name: "Stay Sign", src: "/assets/objects/Stay.png", frames: 1 },
                  { name: "Water", src: "/assets/objects/Water.png", frames: 1 },
                  ...([1,2,3,4] as number[]).map(n => ({ name: `Grass ${n}`, src: `/assets/objects/Grass${n}.png`, frames: 1 })),
                  ...([1,2,3,4] as number[]).map(n => ({ name: `Barrel ${n}`, src: `/assets/objects/Fishbarrel${n}.png`, frames: 1 })),
                ] },
                { label: "Icons", items: Array.from({length: 20}, (_, i) => ({
                  name: `Icon ${i+1}`, src: `/assets/icons/Icons_${String(i+1).padStart(2,'0')}.png`, frames: 1,
                })).concat([
                  { name: "Gbux", src: "/assets/icons/gbux.png", frames: 1 },
                  { name: "Fabled", src: "/assets/icons/faction_fabled.png", frames: 1 },
                  { name: "Legion", src: "/assets/icons/faction_legion.png", frames: 1 },
                  { name: "Crusade", src: "/assets/icons/faction_crusade.png", frames: 1 },
                ]) },
                { label: "Lures", items: LURES.map(l => ({
                  name: l.name, src: l.icon, frames: 1, meta: l.type,
                })) },
                { label: "Catch Assets", items: [
                  ...Array.from({length: 8}, (_, i) => ({ name: `Catch ${i+1}`, src: `/assets/catch/${i+1}.png`, frames: 1 })),
                  { name: "Barrel", src: "/assets/catch/Barrel.png", frames: 1 },
                  { name: "Box", src: "/assets/catch/Box.png", frames: 1 },
                  { name: "Chest", src: "/assets/catch/Chest.png", frames: 1 },
                ] },
                { label: "Misc", items: [
                  { name: "Logo", src: "/assets/logo.png", frames: 1 },
                  { name: "Beach Crabs Sheet", src: "/assets/beach_crabs.png", frames: 1 },
                  { name: "Char Fabled", src: "/assets/char_fabled.png", frames: 1 },
                  { name: "Char Legion", src: "/assets/char_legion.png", frames: 1 },
                  { name: "Char Crusade", src: "/assets/char_crusade.png", frames: 1 },
                ] },
              ].map(category => (
                <div key={category.label} style={{ marginBottom: 10 }}>
                  <div style={{ color: "#4fc3f7", fontSize: 7, marginBottom: 4, padding: "2px 0", borderBottom: "1px solid rgba(79,195,247,0.2)" }}>
                    {category.label} ({category.items.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {category.items.map((item, idx) => (
                      <div key={`${item.name}-${idx}`} style={{
                        width: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        padding: 3, background: "rgba(255,255,255,0.03)", borderRadius: 4,
                        border: (item as any).unused ? "1px solid rgba(255,80,80,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                        <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={item.src} alt={item.name} style={{
                            maxWidth: 40, maxHeight: 40, imageRendering: "pixelated",
                            objectFit: "contain",
                          }} />
                        </div>
                        <div style={{ fontSize: 4, color: (item as any).unused ? "#ff6b6b" : "#90a4ae", textAlign: "center", lineHeight: "1.3", wordBreak: "break-word" }}>
                          {item.name}
                        </div>
                        {(item as any).unused && (
                          <div style={{ fontSize: 3, color: "#ff6b6b", fontWeight: "bold" }}>UNUSED</div>
                        )}
                        {(item as any).meta && (
                          <div style={{ fontSize: 3, color: "#607d8b" }}>{(item as any).meta}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gizmo Tab */}
          {uiState.adminTab === "gizmo" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              <div
                onClick={() => { const s = stateRef.current; s.gizmoEnabled = !s.gizmoEnabled; s.gizmoSelected = -1; syncUI(); }}
                style={{
                  padding: "6px 10px", cursor: "pointer", fontSize: 7, textAlign: "center",
                  color: uiState.gizmoEnabled ? "#2ecc71" : "#e74c3c",
                  background: uiState.gizmoEnabled ? "rgba(46,204,113,0.15)" : "rgba(231,76,60,0.1)",
                  border: `1px solid ${uiState.gizmoEnabled ? "rgba(46,204,113,0.4)" : "rgba(231,76,60,0.3)"}`,
                  borderRadius: 6, marginBottom: 8,
                }}
                data-testid="button-gizmo-toggle"
              >
                GIZMO: {uiState.gizmoEnabled ? "ON" : "OFF"}
              </div>
              <div style={{ color: "#607d8b", fontSize: 5, marginBottom: 8, lineHeight: "1.8" }}>
                When enabled, click objects in the game world to select them. Drag to reposition.
              </div>
              <div style={{ color: "#4fc3f7", fontSize: 6, marginBottom: 4, borderBottom: "1px solid rgba(79,195,247,0.2)", paddingBottom: 2 }}>
                World Objects
              </div>
              {stateRef.current.worldObjects.map((obj, i) => (
                <div key={obj.id} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", marginBottom: 3,
                  background: stateRef.current.gizmoSelected === i ? "rgba(241,196,15,0.1)" : "rgba(255,255,255,0.02)",
                  border: stateRef.current.gizmoSelected === i ? "1px solid rgba(241,196,15,0.4)" : "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 4, cursor: "pointer",
                }} onClick={() => { stateRef.current.gizmoSelected = i; syncUI(); }}>
                  <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={obj.sprite} alt={obj.label} style={{ maxWidth: 24, maxHeight: 24, imageRendering: "pixelated" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 5, color: "#e0e0e0" }}>{obj.label}</div>
                    <div style={{ fontSize: 4, color: "#607d8b" }}>x:{Math.round(obj.x)} y:{Math.round(obj.y)} s:{obj.scale}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trace Tab */}
          {uiState.adminTab === "trace" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              <div style={{ color: "#4fc3f7", fontSize: 7, marginBottom: 6 }}>Line Trace Tool</div>
              <div style={{ color: "#607d8b", fontSize: 5, marginBottom: 8, lineHeight: "1.8" }}>
                Pause the game and inspect fishing line anchor points, rod tip connections, and rope segment positions.
              </div>
              <div
                onClick={() => {
                  const s = stateRef.current;
                  s.traceMode = !s.traceMode;
                  s.gamePaused = s.traceMode;
                  syncUI();
                }}
                style={{
                  padding: "6px 10px", cursor: "pointer", fontSize: 7, textAlign: "center",
                  color: uiState.traceMode ? "#f1c40f" : "#94a3b8",
                  background: uiState.traceMode ? "rgba(241,196,15,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${uiState.traceMode ? "rgba(241,196,15,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 6, marginBottom: 8,
                }}
                data-testid="button-trace-toggle"
              >
                {uiState.traceMode ? "TRACING (PAUSED)" : "START TRACE"}
              </div>
              {uiState.traceMode && (
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 8 }}>
                  <div style={{ color: "#f1c40f", fontSize: 6, marginBottom: 4 }}>Rod Tip Position</div>
                  <div style={{ color: "#e0e0e0", fontSize: 5, marginBottom: 2 }}>
                    X: {Math.round(stateRef.current.lastRodTipX)} Y: {Math.round(stateRef.current.lastRodTipY)}
                  </div>
                  <div style={{ color: "#f1c40f", fontSize: 6, marginTop: 8, marginBottom: 4 }}>Rod Tip Sprite Data</div>
                  <div style={{ color: "#90a4ae", fontSize: 4, lineHeight: "1.8" }}>
                    idle: [43,24] per frame<br/>
                    fish: [43,24] [42,24] [42,25] [43,24]<br/>
                    hook: [43,24] [36,19] [35,17] [34,7] [27,4] [25,3]
                  </div>
                  <div style={{ color: "#f1c40f", fontSize: 6, marginTop: 8, marginBottom: 4 }}>Hook Position</div>
                  <div style={{ color: "#e0e0e0", fontSize: 5 }}>
                    X: {Math.round(stateRef.current.hookX)} Y: {Math.round(stateRef.current.hookY)}
                  </div>
                  {stateRef.current.ropeSegments.length > 0 && (
                    <>
                      <div style={{ color: "#f1c40f", fontSize: 6, marginTop: 8, marginBottom: 4 }}>Rope Segments ({stateRef.current.ropeSegments.length})</div>
                      {stateRef.current.ropeSegments.map((seg, i) => (
                        <div key={i} style={{ color: "#78909c", fontSize: 4 }}>
                          [{i}] x:{Math.round(seg.x)} y:{Math.round(seg.y)}
                        </div>
                      ))}
                    </>
                  )}
                  <div style={{ color: "#f1c40f", fontSize: 6, marginTop: 8, marginBottom: 4 }}>Cast Line State</div>
                  <div style={{ color: "#e0e0e0", fontSize: 5 }}>
                    Active: {stateRef.current.castLineActive ? "YES" : "NO"} |
                    Flying: {stateRef.current.castLineFlying ? "YES" : "NO"} |
                    Landed: {stateRef.current.castLineLanded ? "YES" : "NO"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pause Overlay when tracing */}
      {uiState.gamePaused && uiState.traceMode && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 56,
          background: "rgba(241,196,15,0.15)", border: "1px solid rgba(241,196,15,0.4)",
          borderRadius: 6, padding: "4px 16px", fontSize: 8, color: "#f1c40f",
        }}>
          GAME PAUSED - TRACE MODE
        </div>
      )}

      {/* Leaderboard Toggle Button */}
      {uiState.gameState !== "title" && uiState.gameState !== "charSelect" && uiState.gameState !== "intro" && (
        <div
          data-testid="button-leaderboard"
          onClick={() => {
            const s = stateRef.current;
            s.showLeaderboard = !s.showLeaderboard;
            if (s.showLeaderboard) {
              setUiState(prev => ({ ...prev, showLeaderboard: true, leaderboardLoading: true }));
              fetch(`/api/leaderboard/${s.leaderboardTab === "biggest" ? "biggest_catch" : s.leaderboardTab === "session" ? "session_catches" : "legendary_catches"}?limit=20`)
                .then(r => r.json())
                .then(data => setUiState(prev => ({ ...prev, leaderboardData: data, leaderboardLoading: false })))
                .catch(() => setUiState(prev => ({ ...prev, leaderboardLoading: false })));
            } else {
              syncUI();
            }
          }}
          style={{
            position: "absolute", bottom: 14, left: 14, zIndex: 55,
            background: "rgba(8,15,25,0.9)", border: "1px solid rgba(79,195,247,0.4)",
            borderRadius: 8, padding: "8px 14px", cursor: "pointer",
            color: "#4fc3f7", fontSize: 9, fontFamily: "'Press Start 2P', monospace",
            display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15l-3-3h6l-3 3z"/><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M7 21h10"/><path d="M12 17v4"/></svg>
          LEADERBOARD
        </div>
      )}

      {/* Install App Button */}
      {uiState.gameState !== "title" && uiState.gameState !== "charSelect" && uiState.gameState !== "intro" && (
        <div
          data-testid="button-install-app"
          onClick={() => {
            if ((window as any).__pwaInstallPrompt) {
              (window as any).__pwaInstallPrompt.prompt();
              (window as any).__pwaInstallPrompt.userChoice.then(() => {
                (window as any).__pwaInstallPrompt = null;
              });
            } else {
              alert("To install: use your browser menu and select 'Install App' or 'Add to Home Screen'");
            }
          }}
          style={{
            position: "absolute", bottom: 14, left: 170, zIndex: 55,
            background: "rgba(8,15,25,0.9)", border: "1px solid rgba(46,204,113,0.4)",
            borderRadius: 8, padding: "8px 14px", cursor: "pointer",
            color: "#2ecc71", fontSize: 9, fontFamily: "'Press Start 2P', monospace",
            display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          DOWNLOAD
        </div>
      )}

      {uiState.showPromo && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 70,
          background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Press Start 2P', monospace", pointerEvents: "auto",
        }} data-testid="promo-overlay">
          <div style={{
            background: "linear-gradient(135deg, rgba(15,5,30,0.98), rgba(30,10,20,0.98))",
            border: "2px solid rgba(168,85,247,0.4)", borderRadius: 16, padding: 0,
            width: "min(480px, 92vw)", maxHeight: "85vh", display: "flex", flexDirection: "column",
            boxShadow: "0 0 80px rgba(168,85,247,0.15), 0 0 40px rgba(239,68,68,0.1)",
            overflow: "hidden",
          }}>
            <div style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.2), rgba(239,68,68,0.2))", padding: "16px 24px", borderBottom: "1px solid rgba(168,85,247,0.3)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#a855f7", fontSize: 14, letterSpacing: 3, marginBottom: 6 }}>LIMITED EDITION</div>
                <div style={{ color: "#f59e0b", fontSize: 10, letterSpacing: 2 }}>BetaXGruda Eggs & Warlords</div>
              </div>
            </div>

            <div style={{ padding: "20px 24px", overflowY: "auto" }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, background: "rgba(168,85,247,0.08)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.25)", padding: 14, textAlign: "center" }}>
                  <div style={{ color: "#ec4899", fontSize: 10, marginBottom: 6 }}>BETA EGGS</div>
                  <div style={{ color: "#f59e0b", fontSize: 18, marginBottom: 4 }}>{BETA_EGG_MAX_STOCK}</div>
                  <div style={{ color: "#78909c", fontSize: 6, lineHeight: "1.8" }}>Only {BETA_EGG_MAX_STOCK} of each<br />beta fish egg exist</div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e0e0e0" }} />
                  </div>
                  <div style={{ color: "#78909c", fontSize: 5, marginTop: 6 }}>Crimson / Emerald / Sapphire / Ivory</div>
                </div>
                <div style={{ flex: 1, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", padding: 14, textAlign: "center" }}>
                  <div style={{ color: "#ef4444", fontSize: 10, marginBottom: 6 }}>WARLORDS</div>
                  <div style={{ color: "#f59e0b", fontSize: 18, marginBottom: 4 }}>{WARLORD_EGG_MAX_STOCK}</div>
                  <div style={{ color: "#78909c", fontSize: 6, lineHeight: "1.8" }}>Only {WARLORD_EGG_MAX_STOCK} of each<br />warlord egg exist</div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a855f7" }} />
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                  </div>
                  <div style={{ color: "#78909c", fontSize: 5, marginTop: 6 }}>Dusk Tyrant / Iron Sovereign / Venom King</div>
                </div>
              </div>

              <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)", padding: 12, marginBottom: 16 }}>
                <div style={{ color: "#f59e0b", fontSize: 8, marginBottom: 6, textAlign: "center" }}>HOW TO EARN</div>
                <div style={{ color: "#b0bec5", fontSize: 6, lineHeight: "2", textAlign: "center" }}>
                  Catch each of the <span style={{ color: "#ff4060" }}>Legendary 9</span> fish species for the first time to earn
                  <span style={{ color: "#a855f7" }}> Head of Legends</span> currency.<br />
                  Spend them in the <span style={{ color: "#f1c40f" }}>SHOP</span> under the EGGS tab.
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", padding: 12, marginBottom: 16 }}>
                <div style={{ color: "#78909c", fontSize: 6, lineHeight: "1.8", textAlign: "center" }}>
                  Beta eggs cost <span style={{ color: "#a855f7" }}>1 Head</span> each.<br />
                  Warlord eggs cost <span style={{ color: "#ef4444" }}>2 Heads</span> each.<br />
                  Once sold out, they are <span style={{ color: "#f59e0b" }}>gone forever</span>.
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 24px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); stateRef.current.showPromo = false; syncUI(); }}
                style={{
                  background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(239,68,68,0.3))",
                  border: "2px solid rgba(168,85,247,0.5)", borderRadius: 10,
                  padding: "10px 40px", color: "#e0e0e0", fontSize: 10,
                  fontFamily: "'Press Start 2P', monospace", letterSpacing: 2,
                }}
                data-testid="button-close-promo"
              >
                ENTER THE WATERS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Overlay */}
      {uiState.showLeaderboard && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 60,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Press Start 2P', monospace", pointerEvents: "auto",
        }} data-testid="leaderboard-overlay">
          <div style={{
            background: "linear-gradient(135deg, rgba(10,25,50,0.98), rgba(5,15,35,0.98))",
            border: "2px solid rgba(79,195,247,0.3)", borderRadius: 16, padding: 28,
            width: "min(600px, 90vw)", maxHeight: "80vh", display: "flex", flexDirection: "column",
            boxShadow: "0 0 60px rgba(79,195,247,0.1)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#4fc3f7", fontSize: 14, letterSpacing: 2 }}>LEADERBOARD</div>
              <div
                data-testid="button-close-leaderboard"
                onClick={() => { stateRef.current.showLeaderboard = false; syncUI(); }}
                style={{ color: "#78909c", fontSize: 16, cursor: "pointer", padding: "4px 8px" }}
              >X</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["biggest", "session", "legendary"] as const).map(tab => (
                <div
                  key={tab}
                  data-testid={`tab-leaderboard-${tab}`}
                  onClick={() => {
                    stateRef.current.leaderboardTab = tab;
                    const cat = tab === "biggest" ? "biggest_catch" : tab === "session" ? "session_catches" : "legendary_catches";
                    setUiState(prev => ({ ...prev, leaderboardTab: tab, leaderboardLoading: true }));
                    fetch(`/api/leaderboard/${cat}?limit=20`)
                      .then(r => r.json())
                      .then(data => setUiState(prev => ({ ...prev, leaderboardData: data, leaderboardLoading: false })))
                      .catch(() => setUiState(prev => ({ ...prev, leaderboardLoading: false })));
                  }}
                  style={{
                    flex: 1, textAlign: "center", padding: "8px 4px", cursor: "pointer",
                    fontSize: 7, letterSpacing: 1, borderRadius: 6,
                    background: uiState.leaderboardTab === tab ? "rgba(79,195,247,0.2)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${uiState.leaderboardTab === tab ? "rgba(79,195,247,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: uiState.leaderboardTab === tab ? "#4fc3f7" : "#78909c",
                  }}
                >
                  {tab === "biggest" ? "BIGGEST CATCH" : tab === "session" ? "20 MIN SESSION" : "LEGENDARY"}
                </div>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", minHeight: 200 }}>
              {uiState.leaderboardLoading ? (
                <div style={{ textAlign: "center", color: "#4fc3f7", fontSize: 8, padding: 40 }}>LOADING...</div>
              ) : uiState.leaderboardData.length === 0 ? (
                <div style={{ textAlign: "center", color: "#546e7a", fontSize: 8, padding: 40 }}>NO ENTRIES YET - BE THE FIRST!</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", padding: "6px 10px", color: "#546e7a", fontSize: 6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 30 }}>#</div>
                    <div style={{ flex: 1 }}>PLAYER</div>
                    {uiState.leaderboardTab !== "session" && <div style={{ width: 100 }}>FISH</div>}
                    <div style={{ width: 70, textAlign: "right" }}>{uiState.leaderboardTab === "session" ? "CATCHES" : "WEIGHT"}</div>
                    <div style={{ width: 70, textAlign: "right" }}>SCORE</div>
                  </div>
                  {uiState.leaderboardData.map((entry: any, i: number) => {
                    const isTop3 = i < 3;
                    const medalColors = ["#ffd54f", "#b0bec5", "#cd7f32"];
                    return (
                      <div key={entry.id || i} style={{
                        display: "flex", alignItems: "center", padding: "8px 10px", borderRadius: 6,
                        background: isTop3 ? `rgba(${i === 0 ? "241,196,15" : i === 1 ? "176,190,197" : "205,127,50"},0.08)` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isTop3 ? `rgba(${i === 0 ? "241,196,15" : i === 1 ? "176,190,197" : "205,127,50"},0.2)` : "rgba(255,255,255,0.03)"}`,
                      }}>
                        <div style={{ width: 30, color: isTop3 ? medalColors[i] : "#546e7a", fontSize: isTop3 ? 10 : 7, fontWeight: "bold" }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, color: isTop3 ? "#e0e0e0" : "#90a4ae", fontSize: 7 }}>
                          {entry.playerName}
                        </div>
                        {uiState.leaderboardTab !== "session" && (
                          <div style={{ width: 100, fontSize: 6, color: entry.fishRarity === "ultra_rare" ? "#ff4060" : entry.fishRarity === "legendary" ? "#f0a020" : "#78909c" }}>
                            {entry.fishName || "-"}
                          </div>
                        )}
                        <div style={{ width: 70, textAlign: "right", color: "#4fc3f7", fontSize: 8 }}>
                          {uiState.leaderboardTab === "session" ? Math.round(entry.value) : entry.value?.toFixed(1)}
                        </div>
                        <div style={{ width: 70, textAlign: "right", color: "#f1c40f", fontSize: 7 }}>
                          {entry.score}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
