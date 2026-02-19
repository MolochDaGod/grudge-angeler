import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";

const imgMinnow = "/assets/icons/fish/minnow-silver-common.png";
const imgJellyfish = "/assets/icons/fish/jellyfish-translucent-common.png";
const imgPerch = "/assets/icons/fish/perch-striped-common.png";
const imgEel = "/assets/icons/fish/eel-dark-common.png";
const imgOctopus = "/assets/icons/fish/octopus-red-common.png";
const imgBass = "/assets/icons/fish/bass-green-uncommon.png";
const imgSalmon = "/assets/icons/fish/salmon-pink-uncommon.png";
const imgElectricEel = "/assets/icons/fish/electric-eel-yellow-uncommon.png";
const imgBlueOctopus = "/assets/icons/fish/blue-ring-octopus-blue-uncommon.png";
const imgCatfish = "/assets/icons/fish/catfish-brown-uncommon.png";
const imgStingray = "/assets/icons/fish/stingray-gray-rare.png";
const imgMorayEel = "/assets/icons/fish/moray-eel-brown-rare.png";
const imgAnglerfish = "/assets/icons/fish/anglerfish-dark-rare.png";
const imgSwordfish = "/assets/icons/fish/swordfish-blue-rare.png";
const imgDeepAngler = "/assets/icons/fish/deep-sea-angler-dark-rare.png";
const imgShark = "/assets/icons/fish/shark-predator.png";
const imgSeaDevil = "/assets/icons/fish/sea-devil-predator.png";
const imgWhale = "/assets/icons/fish/whale-blue-legendary.png";
const imgKraken = "/assets/icons/fish/kraken-predator.png";
const imgPhantomMinnow = "/assets/icons/legendary-phantom-minnow.png";
const imgVolcanicPerch = "/assets/icons/legendary-volcanic-perch.png";
const imgAbyssalBass = "/assets/icons/legendary-abyssal-bass.png";
const imgFrostCatfish = "/assets/icons/legendary-frost-catfish.png";
const imgStormSwordfish = "/assets/icons/legendary-storm-swordfish.png";
const imgCelestialWhale = "/assets/icons/legendary-celestial-whale.png";
const imgNeonEel = "/assets/icons/legendary-neon-eel.png";
const imgGoldenSalmon = "/assets/icons/legendary-golden-salmon.png";
const imgShadowLeviathan = "/assets/icons/legendary-shadow-leviathan.png";
const imgGiantOctopus = "/assets/icons/fish/giant-octopus-purple-legendary.png";
const imgGiantSquid = "/assets/icons/fish/giant-squid-blue-legendary.png";
const imgSealAtTheSeam = "/assets/icons/fish/seal-at-the-seam-cosmic-ultra_rare.png";
const imgRedCrab = "/assets/icons/fish/red-crab-red-common.png";
const imgBlueCrab = "/assets/icons/fish/blue-crab-blue-common.png";
const imgGreenCrab = "/assets/icons/fish/green-crab-green-common.png";
const imgCyanCrab = "/assets/icons/fish/cyan-crab-cyan-common.png";
const imgPinkCrab = "/assets/icons/fish/pink-crab-pink-common.png";
const imgPurpleCrab = "/assets/icons/fish/purple-crab-purple-uncommon.png";
const imgGoldCrab = "/assets/icons/fish/gold-crab-gold-uncommon.png";
const imgDarkCrab = "/assets/icons/fish/dark-crab-dark-uncommon.png";
const imgCrimsonCrab = "/assets/icons/fish/crimson-crab-crimson-rare.png";
const imgShadowCrab = "/assets/icons/fish/shadow-crab-shadow-rare.png";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const oceanBgImg = "/assets/coral_reef_bg.png";
const oceanRippleImg = "/assets/coral_reef_bg.png";
const sealAtTheSeamImg = "/assets/icons/fish/seal-at-the-seam-cosmic-ultra_rare.png";

const legendaryFish = [
  { name: "Phantom Minnow", chapter: "I", img: imgPhantomMinnow },
  { name: "Volcanic Perch", chapter: "II", img: imgVolcanicPerch },
  { name: "Abyssal Bass", chapter: "III", img: imgAbyssalBass },
  { name: "Frost Catfish", chapter: "IV", img: imgFrostCatfish },
  { name: "Storm Swordfish", chapter: "V", img: imgStormSwordfish },
  { name: "Celestial Whale", chapter: "VI", img: imgCelestialWhale },
  { name: "Neon Eel", chapter: "VII", img: imgNeonEel },
  { name: "Golden Salmon", chapter: "VIII", img: imgGoldenSalmon },
  { name: "Shadow Leviathan", chapter: "IX", img: imgShadowLeviathan },
  { name: "The Seal at the Seam", chapter: "X", img: sealAtTheSeamImg },
];

const features = [
  { icon: "/assets/icons/lures/golden_fly.png", title: "30 Species", desc: "Fish, crabs, and predators across 5 rarity tiers" },
  { icon: "/assets/icons/gbux.png", title: "Gbux Economy", desc: "Dynamic market, sell fish, complete bounties, build your fortune" },
  { icon: "/assets/icons/lures/prismatic_lure.png", title: "Equipment System", desc: "5 rods, 5 baits, 11 lures, 22 chum items - each with unique stats" },
  { icon: "/assets/icons/fish/phantom-minnow-spectral-ultra_rare.png", title: "The Legendary 10", desc: "Ultra-rare mythic fish with complete lore and unique visual effects" },
  { icon: "/assets/objects/Boat.png", title: "Open Ocean", desc: "8 world scenes from shallow waters to the deepest abyss" },
  { icon: "/assets/icons/fish/Icons_01.png", title: "Leaderboards", desc: "Compete globally with Grudge ID for biggest catch and legendary hauls" },
];

const factionData = [
  { name: "Fabled", img: "/assets/icons/faction_fabled.png", color: "#4fc3f7" },
  { name: "Legion", img: "/assets/icons/faction_legion.png", color: "#f04050" },
  { name: "Crusade", img: "/assets/icons/faction_crusade.png", color: "#ffd54f" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#a0a0a0",
  uncommon: "#4fc3f7",
  rare: "#ffd54f",
  legendary: "#ff8a65",
  ultra_rare: "#e040fb",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
  ultra_rare: "Ultra Rare",
};

const arsenalRods = [
  { name: "Bamboo Rod", icon: "/assets/icons/rods/rod-bamboo.png", price: 0, desc: "A simple bamboo rod. Gets the job done.", stats: "Reel 1.0x | Line 1.0x" },
  { name: "Fiberglass Rod", icon: "/assets/icons/rods/rod-fiberglass.png", price: 150, desc: "Lighter and more responsive.", stats: "Reel 1.1x | Line 1.15x" },
  { name: "Carbon Rod", icon: "/assets/icons/rods/rod-carbon.png", price: 400, desc: "High-tech carbon fiber build.", stats: "Reel 1.2x | Line 1.3x" },
  { name: "Titanium Rod", icon: "/assets/icons/rods/rod-titanium.png", price: 800, desc: "Ultra-strong titanium alloy.", stats: "Reel 1.35x | Line 1.5x" },
  { name: "Legendary Rod", icon: "/assets/icons/rods/rod-legendary.png", price: 1500, desc: "Forged from the anchor of a ghost ship.", stats: "Reel 1.5x | Line 1.8x" },
];

const arsenalBaits = [
  { name: "Basic Worm", icon: "/assets/icons/lures/worm.png", price: 0, desc: "A plain earthworm. The classic bait.", stats: "No bonuses", type: "live" },
  { name: "Nightcrawler", icon: "/assets/icons/lures/nightcrawler.png", price: 40, desc: "Fish can't resist the wriggle.", stats: "+40% bite speed | Catfish, Bass", type: "live" },
  { name: "Leech", icon: "/assets/icons/lures/leech.png", price: 90, desc: "Bottom dwellers love it.", stats: "+20% rarity | Catfish, Eel", type: "live" },
  { name: "Maggots", icon: "/assets/icons/lures/maggots.png", price: 60, desc: "Small fish go crazy.", stats: "+100% bite speed | Minnow, Perch", type: "live" },
  { name: "Minnow Bait", icon: "/assets/icons/lures/minnow_bait.png", price: 150, desc: "Big predators can't resist.", stats: "+50% rarity | +40% size", type: "live" },
];

const arsenalLures = [
  { name: "Beginner Lure", icon: "/assets/icons/lures/beginner_lure.png", price: 50, desc: "Better than bare hooks.", stats: "+20% speed" },
  { name: "Crankbait", icon: "/assets/icons/lures/crankbait.png", price: 120, desc: "Fat-bodied diving lure.", stats: "+10% rarity | Perch, Bass" },
  { name: "Silver Spoon", icon: "/assets/icons/lures/spoon.png", price: 100, desc: "Hammered metal flash.", stats: "+50% speed | Salmon" },
  { name: "Grub Worm", icon: "/assets/icons/lures/grub_worm.png", price: 80, desc: "Works on everything.", stats: "+10% rarity | Versatile" },
  { name: "Spinnerbait", icon: "/assets/icons/lures/spinnerbait.png", price: 200, desc: "Spinning blade flash.", stats: "+30% rarity | Bass, Perch" },
  { name: "Deep Diver", icon: "/assets/icons/lures/deep_diver.png", price: 180, desc: "Dives deep for bottom dwellers.", stats: "+20% rarity | +30% size" },
  { name: "Golden Fly", icon: "/assets/icons/lures/golden_fly.png", price: 250, desc: "Rare fish can't resist.", stats: "+100% rarity | Swordfish" },
  { name: "Glow Jig", icon: "/assets/icons/lures/glow_jig.png", price: 350, desc: "Bioluminescent attraction.", stats: "+30% rarity | +80% size" },
  { name: "Storm Shad", icon: "/assets/icons/lures/storm_shad.png", price: 300, desc: "Mimics injured baitfish.", stats: "+100% speed | Bass, Salmon" },
  { name: "Kraken Bait", icon: "/assets/icons/lures/kraken_bait.png", price: 500, desc: "From the ocean depths.", stats: "+200% rarity | Whale" },
  { name: "Prismatic Lure", icon: "/assets/icons/lures/prismatic_lure.png", price: 750, desc: "Rainbow-shifting. Boosts everything.", stats: "+80% rarity | +50% size | +50% speed" },
];

const arsenalChum = [
  { name: "Fish Scraps", icon: "/assets/icons/chum/chum-fish-guts.png", price: 15, desc: "Basic chum.", stats: "1.2x attract" },
  { name: "Bread Crumbs", icon: "/assets/icons/chum/chum-bread-crumbs.png", price: 20, desc: "Attracts small fish.", stats: "1.4x attract | +10% bites" },
  { name: "Corn Mash", icon: "/assets/icons/chum/chum-worm-bait.png", price: 25, desc: "Bottom feeder chum.", stats: "1.5x attract" },
  { name: "Blood Meal", icon: "/assets/icons/chum/chum-blood-worm-extract.png", price: 40, desc: "Attracts predators.", stats: "+15% rarity | 1.6x attract" },
  { name: "Shrimp Paste", icon: "/assets/icons/chum/chum-shrimp-paste.png", price: 50, desc: "Good all-around chum.", stats: "1.7x attract | +15% bites" },
  { name: "Squid Ink", icon: "/assets/icons/chum/chum-squid-ink.png", price: 60, desc: "Attracts deep fish.", stats: "+20% rarity | 1.5x attract" },
  { name: "Fish Oil Slick", icon: "/assets/icons/chum/chum-sardine-oil.png", price: 75, desc: "Wide area attract.", stats: "2.0x attract | +10% bites" },
  { name: "Sardine Chunks", icon: "/assets/icons/chum/chum-fish-guts.png", price: 45, desc: "Fast bite speed boost.", stats: "+50% bites | 1.3x attract" },
  { name: "Crab Guts", icon: "/assets/icons/chum/chum-fish-guts.png", price: 55, desc: "Attracts rare fish.", stats: "+30% rarity | 1.4x attract" },
  { name: "Mussel Mix", icon: "/assets/icons/chum/chum-live-shrimp.png", price: 35, desc: "Steady and reliable.", stats: "1.5x attract | Long duration" },
  { name: "Fermented Brine", icon: "/assets/icons/chum/chum-jellyfish-jelly.png", price: 80, desc: "Strong rarity boost.", stats: "+50% rarity | 1.6x attract" },
  { name: "Whale Blubber", icon: "/assets/icons/chum/chum-whale-blubber.png", price: 100, desc: "Attracts legendary fish.", stats: "+70% rarity | 1.8x attract" },
  { name: "Phosphor Dust", icon: "/assets/icons/chum/chum-glowing-plankton.png", price: 120, desc: "Glowing ultra rare boost.", stats: "+100% rarity | 1.5x attract" },
  { name: "Coral Powder", icon: "/assets/icons/chum/chum-coral-dust.png", price: 90, desc: "Attracts reef fish.", stats: "+30% rarity | 1.7x attract" },
  { name: "Deep Sea Extract", icon: "/assets/icons/chum/chum-deep-pressure.png", price: 150, desc: "Deep water mega boost.", stats: "+80% rarity | 2.0x attract" },
  { name: "Thunder Chum", icon: "/assets/icons/chum/chum-thunder.png", price: 130, desc: "Storm fish attract.", stats: "+60% rarity | +30% bites" },
  { name: "Moonlight Essence", icon: "/assets/icons/chum/chum-moonlight-essence.png", price: 200, desc: "Celestial boost.", stats: "+100% rarity | 2.2x attract" },
  { name: "Kraken Bile", icon: "/assets/icons/chum/chum-kraken-bile.png", price: 180, desc: "Massive rarity increase.", stats: "+150% rarity | 1.6x attract" },
  { name: "Golden Flakes", icon: "/assets/icons/chum/chum-golden-flakes.png", price: 250, desc: "Boosts everything.", stats: "+100% rarity | +40% bites | 2.5x attract" },
  { name: "Abyssal Ooze", icon: "/assets/icons/chum/chum-abyssal-ooze.png", price: 300, desc: "The ultimate chum.", stats: "+150% rarity | +50% bites | 3.0x attract" },
  { name: "Live Shrimp Cluster", icon: "/assets/icons/chum/chum-live-shrimp.png", price: 0, desc: "Caught live shrimp. Good bait.", stats: "+20% rarity | +30% bites | Net catch" },
  { name: "Glowing Plankton", icon: "/assets/icons/chum/chum-glowing-plankton.png", price: 0, desc: "Caught glowing plankton.", stats: "+80% rarity | Net catch" },
];

interface LandingFish {
  name: string;
  rarity: string;
  points: number;
  desc: string;
  img: string;
}

const allFish: LandingFish[] = [
  { name: "Minnow", rarity: "common", points: 10, desc: "A tiny silver fish, common in shallow waters.", img: imgMinnow },
  { name: "Jellyfish", rarity: "common", points: 20, desc: "A translucent jellyfish drifting with the current.", img: imgJellyfish },
  { name: "Perch", rarity: "common", points: 25, desc: "A striped freshwater fish with sharp fins.", img: imgPerch },
  { name: "Eel", rarity: "common", points: 40, desc: "A slippery serpentine fish.", img: imgEel },
  { name: "Octopus", rarity: "common", points: 35, desc: "A clever red octopus with grasping tentacles.", img: imgOctopus },
  { name: "Red Crab", rarity: "common", points: 8, desc: "A small red crab that scuttles along the beach.", img: imgRedCrab },
  { name: "Blue Crab", rarity: "common", points: 10, desc: "A bright blue crab found near tidal pools.", img: imgBlueCrab },
  { name: "Green Crab", rarity: "common", points: 8, desc: "A mossy green crab hiding in the seaweed.", img: imgGreenCrab },
  { name: "Cyan Crab", rarity: "common", points: 8, desc: "A pale cyan crab on sandy shores.", img: imgCyanCrab },
  { name: "Pink Crab", rarity: "common", points: 12, desc: "A cute pink crab that loves warm shallow waters.", img: imgPinkCrab },
  { name: "Bass", rarity: "uncommon", points: 50, desc: "A strong fighter popular with anglers.", img: imgBass },
  { name: "Salmon", rarity: "uncommon", points: 60, desc: "A prized pink-fleshed fish.", img: imgSalmon },
  { name: "Electric Eel", rarity: "uncommon", points: 65, desc: "A shocking eel crackling with electric charge.", img: imgElectricEel },
  { name: "Blue Ring Octopus", rarity: "uncommon", points: 55, desc: "A small but deadly octopus with glowing blue rings.", img: imgBlueOctopus },
  { name: "Catfish", rarity: "uncommon", points: 75, desc: "A bottom-dweller with long whiskers.", img: imgCatfish },
  { name: "Giant Octopus", rarity: "uncommon", points: 70, desc: "A purple giant with eight crushing arms. Incredibly intelligent.", img: imgGiantOctopus },
  { name: "Purple Crab", rarity: "uncommon", points: 15, desc: "An uncommon purple crab with iridescent shell.", img: imgPurpleCrab },
  { name: "Gold Crab", rarity: "uncommon", points: 25, desc: "A rare golden crab. Prized for its shimmering shell.", img: imgGoldCrab },
  { name: "Dark Crab", rarity: "uncommon", points: 20, desc: "A dark-shelled crab with powerful pincers.", img: imgDarkCrab },
  { name: "Crimson Crab", rarity: "rare", points: 40, desc: "A blood-red crab with Sea Devil markings. Extremely aggressive.", img: imgCrimsonCrab },
  { name: "Shadow Crab", rarity: "rare", points: 55, desc: "A dark maroon crab that moves like a phantom. Kin of the Sea Devil.", img: imgShadowCrab },
  { name: "Stingray", rarity: "rare", points: 100, desc: "A flat-bodied ray gliding silently along the ocean floor.", img: imgStingray },
  { name: "Moray Eel", rarity: "rare", points: 90, desc: "A thick-bodied eel lurking in reef crevices.", img: imgMorayEel },
  { name: "Anglerfish", rarity: "rare", points: 120, desc: "A deep-sea predator with a bioluminescent lure.", img: imgAnglerfish },
  { name: "Swordfish", rarity: "rare", points: 150, desc: "A powerful ocean predator with a sharp bill.", img: imgSwordfish },
  { name: "Deep Sea Angler", rarity: "rare", points: 140, desc: "A pitch-black anglerfish with a sinister yellow glow.", img: imgDeepAngler },
  { name: "Giant Squid", rarity: "rare", points: 130, desc: "A massive blue squid from the abyss. Eyes the size of dinner plates.", img: imgGiantSquid },
  { name: "Shark", rarity: "rare", points: 400, desc: "A fearsome shark prowling the deep waters.", img: imgShark },
  { name: "Sea Devil", rarity: "rare", points: 600, desc: "A monstrous crab creature from the deep trenches.", img: imgSeaDevil },
  { name: "Whale", rarity: "legendary", points: 300, desc: "The king of the deep. Incredibly rare!", img: imgWhale },
  { name: "Kraken", rarity: "legendary", points: 800, desc: "A massive squid from the abyss, feared by all.", img: imgKraken },
  { name: "Phantom Minnow", rarity: "ultra_rare", points: 500, desc: "A ghostly minnow wreathed in spectral flame.", img: imgPhantomMinnow },
  { name: "Volcanic Perch", rarity: "ultra_rare", points: 600, desc: "Scales glow molten orange from deep-sea vents.", img: imgVolcanicPerch },
  { name: "Abyssal Bass", rarity: "ultra_rare", points: 750, desc: "A colossal bass radiating dark energy.", img: imgAbyssalBass },
  { name: "Frost Catfish", rarity: "ultra_rare", points: 800, desc: "Encased in living ice. Freezes the water.", img: imgFrostCatfish },
  { name: "Storm Swordfish", rarity: "ultra_rare", points: 1000, desc: "Rides lightning bolts with electric fury.", img: imgStormSwordfish },
  { name: "Celestial Whale", rarity: "ultra_rare", points: 2000, desc: "A cosmic whale that swallowed a dying star.", img: imgCelestialWhale },
  { name: "Neon Eel", rarity: "ultra_rare", points: 650, desc: "Bioluminescent eel pulsing with neon colors.", img: imgNeonEel },
  { name: "Golden Salmon", rarity: "ultra_rare", points: 700, desc: "Solid gold scales. Worth a fortune.", img: imgGoldenSalmon },
  { name: "Shadow Leviathan", rarity: "ultra_rare", points: 1500, desc: "A titanic shadow beast from beyond the abyss.", img: imgShadowLeviathan },
  { name: "The Seal at the Seam", rarity: "ultra_rare", points: 5000, desc: "A living sigil at the boundary of reality. The 10th Legendary.", img: imgSealAtTheSeam },
];

const fishAchievements = [
  { name: "First Catch", desc: "Catch your first fish", icon: "/assets/icons/Icons_07.png", color: "#a0a0a0" },
  { name: "Common Collector", desc: "Catch all common species", icon: "/assets/icons/fish/minnow-silver-common.png", color: "#a0a0a0" },
  { name: "Uncommon Hunter", desc: "Catch all uncommon species", icon: "/assets/icons/fish/bass-green-uncommon.png", color: "#4fc3f7" },
  { name: "Rare Trophy", desc: "Catch all rare species", icon: "/assets/icons/fish/swordfish-blue-rare.png", color: "#ffd54f" },
  { name: "Legendary Angler", desc: "Catch all legendary species", icon: "/assets/icons/fish/whale-blue-legendary.png", color: "#ff8a65" },
  { name: "Mythic Master", desc: "Catch all ultra-rare species", icon: "/assets/icons/lures/prismatic_lure.png", color: "#e040fb" },
  { name: "Ocean Completionist", desc: "Catch every species in the game", icon: "/assets/icons/lures/golden_fly.png", color: "#ffd700" },
  { name: "100 Catch Club", desc: "Catch 100 fish total", icon: "/assets/icons/Icons_09.png", color: "#4fc3f7" },
  { name: "Big Game Fisher", desc: "Catch a fish over 50 lbs", icon: "/assets/icons/Icons_13.png", color: "#ff8a65" },
  { name: "Grudge Legend", desc: "Reach the top of the leaderboard", icon: "/assets/icons/gbux.png", color: "#ffd700" },
];

function ArsenalTooltip({ item, visible }: { item: { name: string; desc: string; price?: number; stats: string }; visible: boolean }) {
  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(5,10,25,0.96)",
      border: "1px solid rgba(79,195,247,0.25)",
      borderRadius: 8, padding: "10px 14px",
      minWidth: 180, maxWidth: 240,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transition: "opacity 0.2s",
      zIndex: 60,
      textAlign: "left",
    }}>
      <div style={{ fontSize: 9, color: "#e8edf2", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>{item.name}</div>
      <div style={{ fontSize: 7, color: "#7888a8", lineHeight: 1.6, marginBottom: 6 }}>{item.desc}</div>
      <div style={{ fontSize: 7, color: "#4fc3f7", letterSpacing: 0.5 }}>{item.stats}</div>
      {item.price !== undefined && item.price > 0 && (
        <div style={{ fontSize: 7, color: "#ffd54f", marginTop: 4 }}>{item.price} gbux</div>
      )}
    </div>
  );
}

function FishTooltip({ fish, visible }: { fish: typeof allFish[0]; visible: boolean }) {
  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(5,10,25,0.96)",
      border: `1px solid ${RARITY_COLORS[fish.rarity]}44`,
      borderRadius: 8, padding: "10px 14px",
      minWidth: 180, maxWidth: 240,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transition: "opacity 0.2s",
      zIndex: 60,
      textAlign: "left",
    }}>
      <div style={{ fontSize: 9, color: "#e8edf2", letterSpacing: 1, marginBottom: 2, fontWeight: 700 }}>{fish.name}</div>
      <div style={{ fontSize: 7, color: RARITY_COLORS[fish.rarity], letterSpacing: 1, marginBottom: 4 }}>{RARITY_LABELS[fish.rarity]}</div>
      <div style={{ fontSize: 7, color: "#7888a8", lineHeight: 1.6, marginBottom: 4 }}>{fish.desc}</div>
      <div style={{ fontSize: 7, color: "#ffd54f" }}>{fish.points} pts</div>
    </div>
  );
}

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [hoveredLegendary, setHoveredLegendary] = useState<number | null>(null);
  const [hoveredArsenal, setHoveredArsenal] = useState<string | null>(null);
  const [hoveredFish, setHoveredFish] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const parallaxOffset = scrollY * 0.3;

  return (
    <div
      ref={containerRef}
      data-testid="landing-page"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        background: "#030a18",
        color: "#e8edf2",
        fontFamily: "'Press Start 2P', monospace",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{filter:drop-shadow(0 0 15px rgba(79,195,247,0.4))} 50%{filter:drop-shadow(0 0 30px rgba(79,195,247,0.7))} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes bubble-rise { 0%{transform:translateY(0) scale(1);opacity:0.4} 100%{transform:translateY(-100vh) scale(0.5);opacity:0} }
        @keyframes wave { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ripple-drift { 0%{transform:translate(0,0)} 25%{transform:translate(-8px,3px)} 50%{transform:translate(0,6px)} 75%{transform:translate(8px,3px)} 100%{transform:translate(0,0)} }
        @keyframes legendaryRotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes play-pulse { 0%,100%{box-shadow:0 0 20px rgba(79,195,247,0.3),0 0 40px rgba(79,195,247,0.1)} 50%{box-shadow:0 0 30px rgba(79,195,247,0.5),0 0 60px rgba(79,195,247,0.2)} }
        .landing-btn:hover { transform: scale(1.05) !important; }
        .legendary-card:hover { transform: scale(1.08) !important; z-index: 10 !important; }
        .feature-card:hover { border-color: rgba(79,195,247,0.4) !important; background: rgba(15,35,60,0.9) !important; }
      `}</style>

      {/* Ocean Background - Layered base + ripple overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* Base ocean image */}
        <img
          src={oceanBgImg}
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.25,
            filter: "saturate(0.7) hue-rotate(-10deg)",
            transform: `translateY(${parallaxOffset}px)`,
          }}
        />
        {/* Ripple/wave overlay - aligned on top of base, animated for water effect */}
        <img
          src={oceanRippleImg}
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.3,
            filter: "saturate(0.8)",
            animation: "ripple-drift 6s ease-in-out infinite",
            mixBlendMode: "screen",
            transform: `translateY(${parallaxOffset}px)`,
          }}
        />
        {/* Dark gradient overlay for readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(3,10,24,0.65) 0%, rgba(5,20,40,0.45) 40%, rgba(3,10,24,0.8) 100%)",
        }} />
        {/* Bubbles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${10 + i * 15}%`,
            bottom: `-${Math.random() * 20}%`,
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(120,200,255,0.4), rgba(60,150,220,0.1))",
            border: "1px solid rgba(120,200,255,0.15)",
            animation: `bubble-rise ${8 + i * 3}s linear infinite`,
            animationDelay: `${i * 2}s`,
          }} />
        ))}
        {/* God rays */}
        <div style={{
          position: "absolute", top: -100, left: "15%", width: 180, height: "120%",
          background: "linear-gradient(180deg, rgba(79,195,247,0.06) 0%, transparent 60%)",
          transform: "rotate(15deg)", opacity: 0.5,
        }} />
        <div style={{
          position: "absolute", top: -100, left: "65%", width: 140, height: "120%",
          background: "linear-gradient(180deg, rgba(79,195,247,0.04) 0%, transparent 50%)",
          transform: "rotate(-10deg)", opacity: 0.4,
        }} />
      </div>

      {/* Navigation Bar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(3,10,24,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(79,195,247,0.1)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", height: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/assets/logo.png" alt="Grudge Angeler" style={{ height: 30, imageRendering: "pixelated" }} />
          <span style={{ fontSize: 8, letterSpacing: 2, color: "#4fc3f7" }}>GRUDGE ANGELER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="#features" data-testid="nav-features" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>FEATURES</a>
          <a href="#legendaries" data-testid="nav-legendaries" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>LEGENDARIES</a>
          <a href="#factions" data-testid="nav-factions" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>FACTIONS</a>
          <Link href="/codex">
            <a data-testid="nav-codex" style={{
              fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
              borderRadius: 4, transition: "color 0.2s",
            }}>CODEX</a>
          </Link>
          <a href="/gameboard.html" data-testid="nav-gameboard" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>GAME BOARD</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "80px 20px 40px",
      }}>
        <img
          src="/assets/logo.png"
          alt="Grudge Angeler"
          style={{
            width: 200, maxWidth: "60vw", imageRendering: "pixelated",
            animation: "pulse-glow 3s ease-in-out infinite",
            marginBottom: 20,
          }}
        />
        <h1 style={{
          fontSize: "clamp(16px, 4vw, 32px)", letterSpacing: 4,
          background: "linear-gradient(135deg, #4fc3f7, #ffd54f)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: 12,
        }}>
          GRUDGE ANGELER
        </h1>
        <p style={{
          fontSize: "clamp(6px, 1.5vw, 9px)", color: "#8899a8", maxWidth: 500,
          lineHeight: 2, letterSpacing: 1, marginBottom: 30,
        }}>
          Cast your line into a pixel art ocean of mystery. Hunt 17 species across
          5 rarity tiers. Pursue The Legendary 10. Conquer the abyss.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/game">
            <a
              data-testid="button-play"
              className="landing-btn"
              style={{
                display: "inline-block", padding: "14px 36px",
                background: "linear-gradient(135deg, #0a3a6b, #0d4a8a)",
                border: "2px solid rgba(79,195,247,0.5)", borderRadius: 8,
                color: "#4fc3f7", fontSize: 12, letterSpacing: 3,
                textDecoration: "none", cursor: "pointer",
                animation: "play-pulse 2s ease-in-out infinite",
                transition: "transform 0.2s",
              }}
            >
              PLAY NOW
            </a>
          </Link>
          <Link href="/codex">
            <a
              data-testid="button-codex"
              className="landing-btn"
              style={{
                display: "inline-block", padding: "14px 28px",
                background: "rgba(10,15,30,0.8)",
                border: "1px solid rgba(196,160,80,0.3)", borderRadius: 8,
                color: "#c4a050", fontSize: 10, letterSpacing: 2,
                textDecoration: "none", cursor: "pointer",
                transition: "transform 0.2s",
              }}
            >
              THE LEGENDARY CODEX
            </a>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          animation: "float 2s ease-in-out infinite",
        }}>
          <div style={{ fontSize: 6, color: "#4a6070", letterSpacing: 2 }}>SCROLL DOWN</div>
          <div style={{ textAlign: "center", color: "#4a6070", marginTop: 4, fontSize: 10 }}>v</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 40,
          background: "linear-gradient(135deg, #4fc3f7, #8899a8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>GAME FEATURES</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                background: "rgba(10,25,50,0.7)",
                border: "1px solid rgba(79,195,247,0.12)",
                borderRadius: 10, padding: 20,
                display: "flex", alignItems: "flex-start", gap: 14,
                transition: "all 0.3s",
                animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
              }}
            >
              <img src={f.icon} alt="" style={{
                width: 40, height: 40, imageRendering: "pixelated",
                flexShrink: 0, objectFit: "contain",
              }} />
              <div>
                <div style={{ fontSize: 8, color: "#4fc3f7", letterSpacing: 1, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 7, color: "#8899a8", lineHeight: 1.8 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legendaries Section */}
      <section id="legendaries" style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 8,
          background: "linear-gradient(135deg, #ffd54f, #f0a020)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>THE LEGENDARY 10</h2>
        <p style={{
          textAlign: "center", fontSize: 7, color: "#4a6070",
          letterSpacing: 1, marginBottom: 40, lineHeight: 2,
        }}>
          Ultra-rare mythic creatures lurking in the deepest waters. Each with a story. Each worth a fortune.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 14,
          maxWidth: 900,
          margin: "0 auto",
        }}>
          {legendaryFish.map((fish, i) => (
            <div
              key={i}
              className="legendary-card"
              data-testid={`legendary-card-${i}`}
              onMouseEnter={() => setHoveredLegendary(i)}
              onMouseLeave={() => setHoveredLegendary(null)}
              onClick={() => navigate(`/codex/${toSlug(fish.name)}?from=home`)}
              style={{
                background: "rgba(8,18,35,0.9)",
                border: `1px solid ${hoveredLegendary === i ? "rgba(79,195,247,0.25)" : "rgba(79,195,247,0.08)"}`,
                borderRadius: 10,
                textAlign: "center",
                transition: "all 0.3s",
                cursor: "pointer",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "relative", zIndex: 1, padding: 16 }}>
                <div style={{
                  width: 80, height: 80, margin: "0 auto 10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <div style={{
                    position: "relative", zIndex: 1,
                    animation: hoveredLegendary === i ? "float 2s ease-in-out infinite" : "none",
                  }}>
                    <img
                      src={fish.img}
                      alt={fish.name}
                      style={{
                        width: fish.name === "The Seal at the Seam" ? 56 : 72,
                        height: fish.name === "The Seal at the Seam" ? 56 : 72,
                        objectFit: "contain",
                        imageRendering: "auto",
                      }}
                    />
                  </div>
                </div>
                <div style={{
                  fontSize: 5, color: "#6a8090", letterSpacing: 2, marginBottom: 4,
                }}>CHAPTER {fish.chapter}</div>
                <div style={{
                  fontSize: 7, color: "#e8edf2", letterSpacing: 1,
                }}>{fish.name}</div>
                <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 2 }}>
                  {[...Array(5)].map((_, s) => (
                    <span key={s} style={{ color: "#ffd54f", fontSize: 6 }}>*</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Link href="/codex">
            <a
              data-testid="button-view-codex"
              className="landing-btn"
              style={{
                display: "inline-block", padding: "12px 24px",
                background: "rgba(196,160,80,0.1)",
                border: "1px solid rgba(196,160,80,0.3)", borderRadius: 8,
                color: "#c4a050", fontSize: 8, letterSpacing: 2,
                textDecoration: "none", cursor: "pointer",
                transition: "transform 0.2s",
              }}
            >
              READ THE FULL CODEX
            </a>
          </Link>
        </div>
      </section>

      {/* The Seal at the Seam - Special Lore Section */}
      <section style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 800, margin: "0 auto",
      }}>
        <div style={{
          background: "rgba(5,10,25,0.9)",
          border: "1px solid rgba(30,60,140,0.25)",
          borderRadius: 14, padding: "40px 30px",
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          <img
            src={sealAtTheSeamImg}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "110%", height: "110%",
              objectFit: "contain",
              imageRendering: "pixelated",
              opacity: 0.06,
              pointerEvents: "none",
              filter: "blur(1px)",
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 50% 40%, rgba(30,60,140,0.2), transparent 60%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 6, color: "#4a6070", letterSpacing: 4, marginBottom: 12 }}>CHAPTER X</div>
            <img
              src={sealAtTheSeamImg}
              alt="The Seal at the Seam"
              style={{
                width: 80, height: 80, imageRendering: "pixelated",
                filter: "drop-shadow(0 0 20px rgba(30,60,140,0.5))",
                marginBottom: 16,
                display: "block", margin: "0 auto 16px",
              }}
            />
            <h3 style={{
              fontSize: 12, letterSpacing: 3,
              background: "linear-gradient(135deg, #3060a0, #8899cc)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", marginBottom: 8,
            }}>THE SEAL AT THE SEAM</h3>
            <div style={{
              fontSize: 7, color: "#556688", letterSpacing: 2, marginBottom: 16,
            }}>The Guardian of the Lowest Deep</div>
            <p style={{
              fontSize: 7, color: "#7788aa", lineHeight: 2.2,
              fontFamily: "'Georgia', serif", maxWidth: 600, margin: "0 auto",
            }}>
              There is a place beneath the abyss that has no name in any human language.
              Cartographers leave it blank. Sonar returns nothing. It is not a depth — it is a boundary.
              The fishermen who know of it call it the Seam. The Seal does not resist capture.
              It allows itself to be taken — briefly — as if granting an audience.
            </p>
            <div style={{
              marginTop: 20, fontSize: 5, color: "#334466", letterSpacing: 3,
            }}>0.01% SPAWN RATE &middot; 5000 PTS &middot; THE SEAM</div>
          </div>
        </div>
      </section>

      {/* Factions Section */}
      <section id="factions" style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 900, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 8,
          color: "#e8edf2",
        }}>CHOOSE YOUR FACTION</h2>
        <p style={{
          textAlign: "center", fontSize: 7, color: "#4a6070",
          letterSpacing: 1, marginBottom: 40, lineHeight: 2,
        }}>
          Three factions. Three paths. One ocean. Select your allegiance and fish with pride.
        </p>
        <div style={{
          display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
        }}>
          {factionData.map((faction, i) => (
            <div key={i} style={{
              background: "rgba(10,20,40,0.8)",
              border: `1px solid ${faction.color}33`,
              borderRadius: 12, padding: "30px 40px",
              textAlign: "center", minWidth: 180,
              transition: "all 0.3s",
            }}>
              <img
                src={faction.img}
                alt={faction.name}
                style={{
                  width: 80, height: 80, imageRendering: "pixelated",
                  filter: `drop-shadow(0 0 12px ${faction.color}66)`,
                  marginBottom: 12,
                }}
              />
              <div style={{
                fontSize: 10, color: faction.color, letterSpacing: 2,
              }}>{faction.name.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Equipment Arsenal */}
      <section style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 8,
          color: "#e8edf2",
        }}>YOUR ARSENAL</h2>
        <p style={{
          textAlign: "center", fontSize: 7, color: "#4a6070",
          letterSpacing: 1, marginBottom: 32, lineHeight: 2,
        }}>
          5 rods, 5 live baits, 11 artificial lures, and 22 chum items to master the ocean.
        </p>

        {[
          { label: "RODS", items: arsenalRods, accent: "#ffd54f" },
          { label: "LIVE BAIT", items: arsenalBaits, accent: "#66bb6a" },
          { label: "LURES", items: arsenalLures, accent: "#4fc3f7" },
          { label: "CHUM", items: arsenalChum, accent: "#ff8a65" },
        ].map((category) => (
          <div key={category.label} style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 7, color: category.accent, letterSpacing: 3,
              marginBottom: 12, textAlign: "center",
              opacity: 0.8,
            }}>{category.label}</div>
            <div style={{
              display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
            }}>
              {category.items.map((item) => {
                const key = `${category.label}-${item.name}`;
                return (
                  <div
                    key={key}
                    data-testid={`arsenal-item-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    onMouseEnter={() => setHoveredArsenal(key)}
                    onMouseLeave={() => setHoveredArsenal(null)}
                    style={{
                      width: 52, height: 52,
                      background: hoveredArsenal === key ? "rgba(15,30,60,0.9)" : "rgba(10,20,40,0.7)",
                      border: `1px solid ${hoveredArsenal === key ? category.accent + "55" : "rgba(79,195,247,0.08)"}`,
                      borderRadius: 8, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <ArsenalTooltip item={item} visible={hoveredArsenal === key} />
                    <img src={item.icon} alt={item.name} style={{
                      width: 36, height: 36, imageRendering: "pixelated", objectFit: "contain",
                    }} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Fish Collection */}
      <section style={{
        position: "relative", zIndex: 1, padding: "40px 20px 60px",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 8,
          color: "#e8edf2",
        }}>FISH COLLECTION</h2>
        <p style={{
          textAlign: "center", fontSize: 7, color: "#4a6070",
          letterSpacing: 1, marginBottom: 32, lineHeight: 2,
        }}>
          30 species across 5 rarity tiers. Can you catch them all?
        </p>

        {(["common", "uncommon", "rare", "legendary", "ultra_rare"] as const).map((rarity) => {
          const fishInTier = allFish.filter(f => f.rarity === rarity);
          return (
            <div key={rarity} style={{ marginBottom: 28 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, marginBottom: 12,
              }}>
                <div style={{
                  height: 1, flex: 1, maxWidth: 80,
                  background: `linear-gradient(90deg, transparent, ${RARITY_COLORS[rarity]}40)`,
                }} />
                <div style={{
                  fontSize: 7, color: RARITY_COLORS[rarity], letterSpacing: 3,
                  opacity: 0.9,
                }}>
                  {RARITY_LABELS[rarity].toUpperCase()}
                  <span style={{ color: "#556680", marginLeft: 8, fontSize: 6 }}>
                    ({fishInTier.length})
                  </span>
                </div>
                <div style={{
                  height: 1, flex: 1, maxWidth: 80,
                  background: `linear-gradient(90deg, ${RARITY_COLORS[rarity]}40, transparent)`,
                }} />
              </div>
              <div style={{
                display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
              }}>
                {fishInTier.map((fish) => {
                  const idx = allFish.indexOf(fish);
                  const isUltra = fish.rarity === "ultra_rare";
                  return (
                    <div
                      key={fish.name}
                      data-testid={`fish-card-${fish.name.toLowerCase().replace(/\s+/g, "-")}`}
                      onMouseEnter={() => setHoveredFish(idx)}
                      onMouseLeave={() => setHoveredFish(null)}
                      style={{
                        width: 64, height: 64,
                        background: hoveredFish === idx
                          ? `rgba(${isUltra ? "30,10,50" : "15,25,50"},0.9)`
                          : "rgba(10,20,40,0.6)",
                        border: `1px solid ${hoveredFish === idx ? RARITY_COLORS[rarity] + "55" : RARITY_COLORS[rarity] + "15"}`,
                        borderRadius: 8, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        position: "relative",
                      }}
                    >
                      <FishTooltip fish={fish} visible={hoveredFish === idx} />
                      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img
                          src={fish.img}
                          alt={fish.name}
                          style={{
                            width: 52, height: 52,
                            objectFit: "contain",
                            imageRendering: "auto",
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 40 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginBottom: 16,
          }}>
            <div style={{
              height: 1, flex: 1, maxWidth: 100,
              background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3))",
            }} />
            <div style={{
              fontSize: 8, color: "#c4a050", letterSpacing: 3,
            }}>ACHIEVEMENTS</div>
            <div style={{
              height: 1, flex: 1, maxWidth: 100,
              background: "linear-gradient(90deg, rgba(255,215,0,0.3), transparent)",
            }} />
          </div>
          <div style={{
            display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap",
          }}>
            {fishAchievements.map((ach) => (
              <div
                key={ach.name}
                data-testid={`achievement-${ach.name.toLowerCase().replace(/\s+/g, "-")}`}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(10,20,40,0.7)",
                  border: `1px solid ${ach.color}22`,
                  borderRadius: 8, padding: "8px 14px",
                  transition: "all 0.2s",
                }}
              >
                <img src={ach.icon} alt="" style={{
                  width: 24, height: 24, imageRendering: "pixelated", objectFit: "contain",
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 8, color: ach.color, letterSpacing: 1, marginBottom: 2 }}>{ach.name}</div>
                  <div style={{ fontSize: 6, color: "#556680", letterSpacing: 0.5 }}>{ach.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        position: "relative", zIndex: 1, padding: "80px 20px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "clamp(8px, 2vw, 14px)", color: "#8899a8",
          letterSpacing: 2, marginBottom: 20, lineHeight: 2,
        }}>
          The ocean awaits. The Legendary 10 are watching.
        </div>
        <Link href="/game">
          <a
            data-testid="button-play-bottom"
            className="landing-btn"
            style={{
              display: "inline-block", padding: "16px 48px",
              background: "linear-gradient(135deg, #0a3a6b, #0d4a8a)",
              border: "2px solid rgba(79,195,247,0.5)", borderRadius: 8,
              color: "#4fc3f7", fontSize: 14, letterSpacing: 4,
              textDecoration: "none", cursor: "pointer",
              animation: "play-pulse 2s ease-in-out infinite",
              transition: "transform 0.2s",
            }}
          >
            CAST YOUR LINE
          </a>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(79,195,247,0.08)",
        padding: "30px 20px", textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <Link href="/game">
            <a style={{ fontSize: 6, color: "#4a6070", textDecoration: "none", letterSpacing: 1 }}>PLAY</a>
          </Link>
          <Link href="/codex">
            <a style={{ fontSize: 6, color: "#4a6070", textDecoration: "none", letterSpacing: 1 }}>CODEX</a>
          </Link>
          <a href="/gameboard.html" style={{ fontSize: 6, color: "#4a6070", textDecoration: "none", letterSpacing: 1 }}>GAME BOARD</a>
        </div>
        <div style={{ fontSize: 5, color: "#2a3a4a", letterSpacing: 2 }}>
          GRUDGE ANGELER &middot; molochdagod &middot; 2026
        </div>
        <div style={{ fontSize: 5, color: "#1a2a3a", letterSpacing: 1, marginTop: 6 }}>
          A Grudge Studio Production
        </div>
      </footer>
    </div>
  );
}
