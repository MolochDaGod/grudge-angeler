import { useRef, useEffect, useState, useCallback } from "react";

const SCALE = 4;
const FRAME_H = 48;

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
    description: "Raw reeling power. Increases reel speed and line tension resistance.",
    color: "#ef4444",
    gains: {
      reelPower: { label: "Reel Power", perPoint: 1.5, unit: "%" },
      lineStrength: { label: "Line Strength", perPoint: 0.8, unit: "%" },
      catchZone: { label: "Catch Zone", perPoint: 0.3, unit: "%" },
    }
  },
  Intellect: {
    description: "Fishing knowledge. Reveals fish info and improves sell prices.",
    color: "#8b5cf6",
    gains: {
      sellBonus: { label: "Sell Price Bonus", perPoint: 1.2, unit: "%" },
      fishReveal: { label: "Fish Info", perPoint: 0.5, unit: "%" },
      xpBonus: { label: "XP Gain", perPoint: 0.8, unit: "%" },
    }
  },
  Vitality: {
    description: "Stamina and persistence. Longer bite windows and patience.",
    color: "#22c55e",
    gains: {
      biteWindow: { label: "Bite Window", perPoint: 1.0, unit: "%" },
      patience: { label: "Wait Reduction", perPoint: 0.6, unit: "%" },
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
    description: "Deep ocean knowledge. Better rare fish attraction and lure efficiency.",
    color: "#06b6d4",
    gains: {
      rarityBoost: { label: "Rarity Boost", perPoint: 1.0, unit: "%" },
      lureEfficiency: { label: "Lure Efficiency", perPoint: 0.6, unit: "%" },
      weatherRead: { label: "Spawn Insight", perPoint: 0.4, unit: "%" },
    }
  },
  Agility: {
    description: "Speed and reflexes. Faster reeling and quicker reactions.",
    color: "#a3e635",
    gains: {
      reelSpeed: { label: "Reel Speed", perPoint: 0.8, unit: "%" },
      reactionTime: { label: "Reaction Time", perPoint: 1.0, unit: "%" },
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

type GameState = "intro" | "title" | "charSelect" | "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed" | "swimming" | "boarding" | "store";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
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
    storeTab: "rod" as "rod" | "lure" | "chum",
    billboardSlide: 0,
    billboardTimer: 0,
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
    forceBar: 1.0,
    forceBarMax: 1.0,
    resilience: 2,
    resilienceMax: 2,
    activeReelHeld: false,
    letOutLineCooldown: 0,
    hookedFishVY: 0,
    hookedFishDiveTimer: 0,
    hookLineMaxDist: 0,
    selectedHotbar: 1,
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
    storeTab: "rod" as "rod" | "lure" | "chum",
    billboardSlide: 0,
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
    forceBar: 1.0,
    resilience: 2,
    resilienceMax: 2,
    selectedHotbar: 1,
    showLurePopup: false,
    showChumPopup: false,
    ownedChum: Array.from({ length: 22 }, () => 0) as number[],
    equippedChum: -1,
    chumActiveTimer: 0,
    chumActiveType: -1,
    toolMode: "rod" as "rod" | "net",
    netActive: false,
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
      resilience: s.resilience,
      resilienceMax: s.resilienceMax,
      selectedHotbar: s.selectedHotbar,
      showLurePopup: s.showLurePopup,
      showChumPopup: s.showChumPopup,
      ownedChum: [...s.ownedChum],
      equippedChum: s.equippedChum,
      chumActiveTimer: s.chumActiveTimer,
      chumActiveType: s.chumActiveType,
      toolMode: s.toolMode,
      netActive: s.netActive,
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
        } else if (gs === "waiting") {
          stateRef.current.gameState = "idle";
          stateRef.current.hookX = -100;
          stateRef.current.hookY = -100;
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
        syncUI();
        return;
      }
      if (key === "2") {
        stateRef.current.selectedHotbar = 2;
        stateRef.current.showLurePopup = !stateRef.current.showLurePopup;
        stateRef.current.showChumPopup = false;
        syncUI();
        return;
      }
      if (key === "3") {
        stateRef.current.selectedHotbar = 3;
        stateRef.current.showChumPopup = !stateRef.current.showChumPopup;
        stateRef.current.showLurePopup = false;
        syncUI();
        return;
      }
      if (key === "4") {
        stateRef.current.selectedHotbar = 4;
        stateRef.current.toolMode = "net";
        stateRef.current.showLurePopup = false;
        stateRef.current.showChumPopup = false;
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
      const dt = Math.min((timestamp - lastTime) / 16.67, 3);
      lastTime = timestamp;

      const W = canvas.width;
      const H = canvas.height;
      const pierY = H * PIER_Y_RATIO;
      const waterY = H * WATER_START_RATIO;
      const defaultFishermanX = W * FISHERMAN_X_RATIO;

      if (s.playerX === 0) s.playerX = defaultFishermanX;

      s.time += dt;
      s.waterOffset += 0.12 * dt;

      const dayAngle = (s.time * 0.0000582) % (Math.PI * 2);
      const rawDayPhase = dayAngle / (Math.PI * 2);
      const dayPhaseFull = rawDayPhase < 0.733 ? 
        0.5 + 0.5 * Math.sin(rawDayPhase / 0.733 * Math.PI) : 
        0.5 - 0.5 * Math.sin((rawDayPhase - 0.733) / 0.267 * Math.PI);

      s.billboardTimer += dt;
      if (s.billboardTimer > 300) {
        s.billboardTimer = 0;
        s.billboardSlide = (s.billboardSlide + 1) % 4;
      }

      const WALK_SPEED = 2.5;
      const SWIM_SPEED = 2.0;
      const pierLeftBound = defaultFishermanX - 80;

      if ((s.gameState === "idle" || s.gameState === "casting") && !s.inBoat) {
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

        if (s.gameState === "casting") {
          s.aimX = Math.max(10, Math.min(W - 10, s.mouseX - s.cameraX));
          s.aimY = Math.max(waterY + 20, Math.min(H - 40, s.mouseY));
        }

        if (s.keysDown.has(" ") && s.gameState === "idle" && !s.inBoat) {
          s.keysDown.delete(" ");
          s.gameState = "swimming";
          s.isSwimming = true;
          s.swimX = s.playerX;
          s.swimY = waterY;
          s.playerVY = 0;
          s.jumpVY = -5;
          s.splashDone = false;
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
          s.swimY += s.jumpVY * dt;
          s.jumpVY += 0.15 * dt;
          if (s.swimY >= waterY + 10) {
            s.swimY = waterY + 10;
            s.jumpVY = 0;
            if (!s.splashDone) {
              addParticles(s.swimX, waterY, 20, "#5dade2", 4, "splash");
              addRipple(s.swimX, waterY, 40);
              s.screenShake = 3;
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
      if (s.inBoat || s.gameState === "boarding") {
        const boatCenterX = s.boatX + (74 * boatScale) / 2;
        targetCameraX = W / 2 - boatCenterX;
      } else if (s.isSwimming) {
        targetCameraX = W / 2 - s.swimX;
      } else {
        targetCameraX = W / 2 - s.playerX;
      }
      targetCameraX = Math.max(-(calcWorldRight - W), Math.min(-calcWorldLeft, targetCameraX));
      s.cameraX += (targetCameraX - s.cameraX) * Math.min(1, 0.04 * dt);
      if (Math.abs(s.cameraX - targetCameraX) < 0.5) s.cameraX = targetCameraX;

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
      ctx.translate(s.cameraX, 0);

      // Water - extends across entire world width
      const worldLeft = -(W * 3) - 200;
      const worldRight = W * 5 + 200;
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, H);
      const wDeep = dayPhase > 0.5 ? 0 : 20;
      waterGrad.addColorStop(0, `rgb(${41 - wDeep},${128 - wDeep * 2},${185 - wDeep})`);
      waterGrad.addColorStop(0.3, `rgb(${26 - wDeep},${111 - wDeep * 2},${160 - wDeep})`);
      waterGrad.addColorStop(0.6, `rgb(${20 - wDeep},${85 - wDeep * 2},${128 - wDeep})`);
      waterGrad.addColorStop(1, `rgb(${13 - wDeep},${59 - wDeep},${94 - wDeep})`);
      ctx.fillStyle = waterGrad;
      ctx.fillRect(worldLeft, waterY, worldRight - worldLeft, H - waterY);

      if (s.weather !== "clear") {
        const murkyAlpha = s.weatherTransition * (
          s.weather === "storm" ? 0.35 : 
          s.weather === "rain" ? 0.2 : 
          s.weather === "fog" ? 0.25 : 
          s.weather === "cloudy" ? 0.08 : 0
        );
        if (murkyAlpha > 0) {
          const murkyGrad = ctx.createLinearGradient(0, waterY, 0, H);
          murkyGrad.addColorStop(0, `rgba(80,100,60,${murkyAlpha})`);
          murkyGrad.addColorStop(0.3, `rgba(70,85,50,${murkyAlpha * 0.8})`);
          murkyGrad.addColorStop(0.7, `rgba(55,70,40,${murkyAlpha * 0.6})`);
          murkyGrad.addColorStop(1, `rgba(40,50,30,${murkyAlpha * 0.4})`);
          ctx.fillStyle = murkyGrad;
          ctx.fillRect(worldLeft, waterY, worldRight - worldLeft, H - waterY);
          
          ctx.globalAlpha = murkyAlpha * 0.4;
          const murkyViewL = -s.cameraX;
          for (let sw = 0; sw < 12; sw++) {
            const swX = murkyViewL + ((sw * 97 + s.time * 0.3) % (W + 60)) - 30;
            const swY = waterY + 15 + sw * 18 + Math.sin(s.time * 0.015 + sw * 2.3) * 8;
            const swR = 15 + Math.sin(s.time * 0.01 + sw) * 5;
            ctx.strokeStyle = `rgba(90,110,70,0.3)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(swX, swY, swR, s.time * 0.02 + sw, s.time * 0.02 + sw + Math.PI * 1.5);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.lineWidth = 1;
        }
      }

      // Surface highlight band - soft glow at water line
      const surfGrad = ctx.createLinearGradient(0, waterY - 2, 0, waterY + 18);
      surfGrad.addColorStop(0, "rgba(136,204,238,0.0)");
      surfGrad.addColorStop(0.3, "rgba(136,204,238,0.12)");
      surfGrad.addColorStop(1, "rgba(136,204,238,0.0)");
      ctx.fillStyle = surfGrad;
      ctx.fillRect(worldLeft, waterY - 2, worldRight - worldLeft, 20);

      // Visible area in world coords (since we're inside ctx.translate(cameraX))
      const viewL = -s.cameraX;
      const viewR = -s.cameraX + W;

      // Surface shimmer - small horizontal highlight dashes that drift
      for (let i = 0; i < 30; i++) {
        const sx = viewL + ((i * 73.7 + s.waterOffset * 3) % (W + 40)) - 20;
        const sy = waterY + 2 + Math.sin(s.time * 0.02 + i * 2.1) * 3;
        const sw = 6 + Math.sin(i * 1.3) * 4;
        const shimmerAlpha = 0.06 + Math.sin(s.time * 0.03 + i * 0.9) * 0.04;
        ctx.globalAlpha = Math.max(0, shimmerAlpha);
        ctx.fillStyle = "#c8e6f8";
        ctx.fillRect(sx, sy, sw, 1);
      }
      ctx.globalAlpha = 1;

      // Gentle wave lines - fewer, softer, slower
      for (let row = 0; row < 6; row++) {
        const wy = waterY + row * 35 + 12;
        const depth = row / 6;
        const waveAlpha = 0.06 * (1 - depth * 0.6);
        ctx.globalAlpha = Math.max(0, waveAlpha);
        ctx.strokeStyle = `rgba(${100 + row * 8},${180 - row * 10},${220 - row * 8},1)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = viewL; x < viewR; x += 2) {
          const wave = Math.sin((x + s.waterOffset * 2.5 + row * 50) * 0.015) * (3 - depth * 1.5) +
                       Math.sin((x + s.waterOffset * 1.8 + row * 30) * 0.028) * (2 - depth);
          if (x === viewL) ctx.moveTo(x, wy + wave);
          else ctx.lineTo(x, wy + wave);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Soft caustic light patches - dappled light on water
      for (let i = 0; i < 12; i++) {
        const cx = viewL + ((i * 127 + s.waterOffset * 1.2) % (W + 80)) - 40;
        const cy = waterY + 20 + (i * 67) % Math.max(1, (H - waterY) * 0.7);
        const cr = 15 + Math.sin(s.time * 0.015 + i * 2.3) * 8;
        const ca = 0.02 + Math.sin(s.time * 0.012 + i * 1.7) * 0.015;
        if (ca > 0) {
          ctx.globalAlpha = ca;
          const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
          cGrad.addColorStop(0, dayPhase > 0.5 ? "rgba(255,255,200,1)" : "rgba(150,200,255,1)");
          cGrad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = cGrad;
          ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
        }
      }
      ctx.globalAlpha = 1;

      // Light rays in water - softer, slower sway
      ctx.globalAlpha = 0.02 + dayPhase * 0.012;
      for (let i = 0; i < 5; i++) {
        const rx = viewL + W * 0.12 + i * W * 0.18 + Math.sin(s.time * 0.0000582 + i * 1.8) * 25;
        ctx.fillStyle = dayPhase > 0.5 ? "#ffffcc" : "#aaccff";
        ctx.beginPath();
        ctx.moveTo(rx - 5, waterY);
        ctx.lineTo(rx + 30, H);
        ctx.lineTo(rx + 42, H);
        ctx.lineTo(rx + 8, waterY);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Underwater bubbles - fewer, gentler
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 12; i++) {
        const bx = viewL + (i * 137 + s.time * 0.2) % W;
        const by = waterY + 40 + ((i * 97 + s.time * 0.12) % Math.max(1, H - waterY - 50));
        const br = 1 + Math.sin(s.time * 0.03 + i) * 0.5;
        ctx.fillStyle = "#88ccff";
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

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

      // Billboard near hut
      if (s.gameState !== "title" && s.gameState !== "charSelect") {
        const bbX = hutX + hutW + 10;
        const bbY = waterY - 95;
        const bbW = 70;
        const bbH = 50;
        
        // Sign post
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(bbX + bbW/2 - 3, bbY + bbH, 6, 30);
        
        // Sign board
        ctx.fillStyle = "rgba(139,90,43,0.95)";
        drawRoundRect(bbX, bbY, bbW, bbH, 4);
        ctx.fill();
        ctx.strokeStyle = "#8B5E3C";
        ctx.lineWidth = 2;
        drawRoundRect(bbX, bbY, bbW, bbH, 4);
        ctx.stroke();
        
        // Billboard content based on slide
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffd54f";
        ctx.font = "bold 6px 'Press Start 2P', monospace";
        
        const slide = s.billboardSlide % 4;
        if (slide === 0) {
          ctx.fillText("BOUNTIES", bbX + bbW/2, bbY + 12);
          ctx.fillStyle = "#e0e0e0";
          ctx.font = "4px 'Press Start 2P', monospace";
          if (s.bounties.length > 0) {
            ctx.fillText(s.bounties[0].fishName, bbX + bbW/2, bbY + 24);
            const gbuxBB = getImg("/assets/icons/gbux.png");
            const rewardTxt = "" + s.bounties[0].reward;
            const rTxtW = ctx.measureText(rewardTxt).width;
            const gbuxSzBB = 6;
            if (gbuxBB) ctx.drawImage(gbuxBB, bbX + bbW/2 - rTxtW/2 - gbuxSzBB - 1, bbY + 29, gbuxSzBB, gbuxSzBB);
            ctx.fillText(rewardTxt, bbX + bbW/2 + gbuxSzBB/2, bbY + 32);
          } else {
            ctx.fillText("None", bbX + bbW/2, bbY + 24);
          }
        } else if (slide === 1) {
          ctx.fillText("RECORD", bbX + bbW/2, bbY + 12);
          ctx.fillStyle = "#e0e0e0";
          ctx.font = "4px 'Press Start 2P', monospace";
          if (s.biggestCatchName) {
            ctx.fillText(s.biggestCatchName, bbX + bbW/2, bbY + 24);
            ctx.fillText(s.biggestCatchSize.toFixed(1) + "x", bbX + bbW/2, bbY + 32);
          } else {
            ctx.fillText("No catches", bbX + bbW/2, bbY + 24);
          }
        } else if (slide === 2) {
          ctx.fillText("DEALS", bbX + bbW/2, bbY + 12);
          ctx.fillStyle = "#2ecc71";
          ctx.font = "4px 'Press Start 2P', monospace";
          ctx.fillText("Rare fish", bbX + bbW/2, bbY + 24);
          ctx.fillText("pay more!", bbX + bbW/2, bbY + 32);
        } else {
          ctx.fillText("GRUDGE", bbX + bbW/2, bbY + 15);
          ctx.fillStyle = "#4fc3f7";
          ctx.fillText("ANGELER", bbX + bbW/2, bbY + 28);
          ctx.fillStyle = "#78909c";
          ctx.font = "3px 'Press Start 2P', monospace";
          ctx.fillText("v1.0", bbX + bbW/2, bbY + 38);
        }
        ctx.textAlign = "left";
      }

      // Boat floating on water (subtle bob)
      const boatBob = boatBobVal;
      const boatDrawX = s.inBoat || s.gameState === "boarding" ? s.boatX : pierStartX - 74 * boatScale - 30;
      drawImage("/assets/objects/Boat.png", boatDrawX, waterY - 10 * boatScale + boatBob, boatScale);

      // Decorative objects on pier - positioned relative to pier surface
      const objY = pierY - 2;
      drawImage("/assets/objects/Fishbarrel4.png", defaultFishermanX + 160, objY - 25 * 2.2, 2.2);
      drawImage("/assets/objects/Fishbarrel1.png", defaultFishermanX + 210, objY - 11 * 2.2, 2.2);
      drawImage("/assets/objects/Fishbarrel2.png", defaultFishermanX + 245, objY - 15 * 2.2, 2.2);
      drawImage("/assets/objects/Fish-rod.png", defaultFishermanX + 290, objY - 26 * 2, 2);
      drawImage("/assets/objects/Stay.png", defaultFishermanX + 320, objY - 15 * 2.2, 2.2);

      // Grass near the hut and pier edges
      drawImage("/assets/objects/Grass1.png", hutX - 15, objY - 33 * 1.8 + 5, 1.8);
      drawImage("/assets/objects/Grass3.png", hutX + 30, objY - 24 * 1.5 + 3, 1.5);
      drawImage("/assets/objects/Grass2.png", hutX + hutW - 20, objY - 25 * 1.6 + 3, 1.6);
      drawImage("/assets/objects/Grass4.png", hutX + hutW + 5, objY - 23 * 1.4 + 2, 1.4);

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
      }

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
        drawSprite(
          `/assets/creatures/${fish.type.creatureFolder}/Walk.png`,
          fish.frame, fish.type.walkFrames,
          fish.x, fish.y, creatureScale,
          fish.direction < 0,
          fish.type.tint || null
        );
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
          fishermanFrame = Math.min(Math.floor((s.swimY - waterY + 50) / 15), 5);
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
        const swimAlpha = Math.max(0.3, 0.95 - swimmerDepth * 0.4);
        ctx.globalAlpha = swimAlpha;
        drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);

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


      // Fishing line, bobber, hook, and hooked fish
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
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 4;
        drawLineCurve();
        ctx.strokeStyle = "rgba(200,190,170,0.95)";
        ctx.lineWidth = 2;
        drawLineCurve();

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
            const imgW = catchImg.width * cs;
            const imgH = catchImg.height * cs;
            
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
            ctx.drawImage(catchImg, -imgW / 2, -imgH / 2, imgW, imgH);
            
            if (s.currentCatch?.rarity === "ultra_rare" && s.currentCatch?.tint) {
              ctx.globalAlpha = 0.3 + Math.sin(s.time * 0.08) * 0.15;
              ctx.shadowColor = s.currentCatch.tint;
              ctx.shadowBlur = 25;
              ctx.drawImage(catchImg, -imgW / 2, -imgH / 2, imgW, imgH);
              ctx.shadowBlur = 0;
            }
            
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }
      }

      // End camera transform - everything after this is screen-space UI
      ctx.restore();

      // Game state logic
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
            const forceDrain = 0.008 * difficultyMult / (1 + a.Agility * 0.01 * tacticsGlobal);
            s.forceBar = Math.max(0, s.forceBar - forceDrain * dt);
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
          const regenRate = 0.003 * (1 + a.Vitality * 0.01 * tacticsGlobal);
          s.forceBar = Math.min(s.forceBarMax, s.forceBar + regenRate * dt);
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

          if (sizeBonus > s.biggestCatchSize) {
            s.biggestCatchSize = sizeBonus;
            s.biggestCatchName = name;
            s.biggestCatchWeight = fishWeight;
          }

          const bountyIdx = s.bounties.findIndex(b => b.fishName === name && sizeBonus >= b.minSize);
          if (bountyIdx >= 0) {
            const bountyTacticsBonus = 1 + s.attributes.Tactics * 0.01;
            s.money += Math.floor(s.bounties[bountyIdx].reward * bountyTacticsBonus);
            s.bounties.splice(bountyIdx, 1);
            if (s.bounties.length === 0) generateBounties();
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
    };
  }, [loadImage, spawnFish, addParticles, addRipple, syncUI, generateBounties, getSellPrice]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      s.waitTimer = 20 + Math.random() * 40;
      addParticles(s.hookX, waterY, 15, "#5dade2", 3, "splash");
      addRipple(s.hookX, waterY);
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
      s.forceBar = 1.0;
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
    stateRef.current.mouseX = e.clientX;
    stateRef.current.mouseY = e.clientY;
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
        style={{ cursor: uiState.gameState === "casting" ? "crosshair" : "default" }}
        onClick={handleClick}
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
            const forceBarPercent = uiState.forceBar * 100;
            const resilience = uiState.resilience;
            const resilienceMax = uiState.resilienceMax;
            return (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ pointerEvents: "none" }} data-testid="reel-bar">
                <div style={{ width: barW, height: 10, background: "rgba(8,15,25,0.85)", borderRadius: 5, border: "1px solid rgba(59,130,246,0.3)", overflow: "hidden", marginBottom: 4 }} data-testid="force-bar">
                  <div style={{ width: `${forceBarPercent}%`, height: "100%", background: forceBarPercent > 30 ? "linear-gradient(90deg, #3b82f6, #60a5fa)" : "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: 5, transition: "width 0.1s" }} />
                </div>
                <span style={{ color: "#60a5fa", fontSize: 6 }}>FORCE [SPACE]</span>
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
                    <img src={stateRef.current.currentCatch?.catchAsset || stateRef.current.currentJunk?.asset || "/assets/icons/Icons_05.png"} alt="" style={{ width: 20, height: 20, imageRendering: "pixelated" }} />
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
                    <img
                      src={stateRef.current.currentCatch?.catchAsset || stateRef.current.currentJunk?.asset || "/assets/icons/Icons_05.png"}
                      alt=""
                      style={{ width: 24, height: 24, imageRendering: "pixelated" }}
                    />
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
              <span style={{ color: "#5dade2", fontSize: 8, textShadow: "1px 1px 0 #000" }}>SPACE to dive in  |  1-4 hotbar</span>
            </div>
          )}
          {uiState.gameState === "idle" && uiState.inBoat && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-4 py-2 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.7)", borderRadius: 8, pointerEvents: "none" }} data-testid="boat-idle-prompt">
              <span style={{ color: "#b0bec5", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Click to {uiState.toolMode === "net" ? "cast net" : "cast"}  |  A/D to row  |  SPACE to stand</span>
              <span style={{ color: "#f1c40f", fontSize: 8, textShadow: "1px 1px 0 #000" }}>E near pier to exit boat  |  1-4 hotbar</span>
            </div>
          )}

          {["idle","casting","waiting","bite","reeling","caught","missed"].includes(uiState.gameState) && (
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

              <div onClick={(e) => { e.stopPropagation(); stateRef.current.selectedHotbar = 4; stateRef.current.toolMode = "net"; stateRef.current.showLurePopup = false; stateRef.current.showChumPopup = false; syncUI(); }}
                className="flex flex-col items-center cursor-pointer"
                style={{ padding: "4px 6px", borderRadius: 6, background: uiState.selectedHotbar === 4 ? "rgba(168,85,247,0.25)" : "rgba(8,15,25,0.75)", border: uiState.selectedHotbar === 4 ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s" }}
                data-testid="hotbar-slot-4">
                <img src="/assets/icons/Icons_11.png" alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
                <span style={{ fontSize: 5, color: uiState.selectedHotbar === 4 ? "#a855f7" : "#607d8b" }}>4</span>
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
                        return [
                          { label: "Drag Force", value: `+${(uiState.attributes.Strength * 1.5 * tG).toFixed(0)}%`, color: "#ef4444" },
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
