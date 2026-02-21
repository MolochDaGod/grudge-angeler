import { useState, useRef, useEffect, useCallback } from "react";

interface FishDef {
  name: string;
  icon: string;
  catchAsset: string;
  creatureFolder: string;
  idleFrames: number;
  walkFrames: number;
  points: number;
  rarity: string;
  weight: number;
  minDepth: number;
  speed: number;
  description: string;
  tint?: string;
  baseScale?: number;
  beachCrab?: boolean;
  spriteSheet?: string;
  spriteRow?: number;
  spriteFrameSize?: number;
}

const FISH_TYPES: FishDef[] = [
  { name: "Minnow", icon: "/assets/fish-images/minnow.png", catchAsset: "/assets/catch/minnow-silver-common.png", creatureFolder: "minnow-silver-common", idleFrames: 2, walkFrames: 2, points: 10, rarity: "common", weight: 40, minDepth: 0.15, speed: 1.5, description: "A tiny silver fish, common in shallow waters.", tint: "rgba(200,210,230,0.2)", baseScale: 0.6 },
  { name: "Jellyfish", icon: "/assets/fish-images/jellyfish.png", catchAsset: "/assets/catch/jellyfish-translucent-common.png", creatureFolder: "jellyfish-translucent-common", idleFrames: 4, walkFrames: 4, points: 20, rarity: "common", weight: 25, minDepth: 0.2, speed: 0.7, description: "A translucent jellyfish drifting with the current.", tint: "rgba(120,80,255,0.2)" },
  { name: "Perch", icon: "/assets/fish-images/perch.png", catchAsset: "/assets/catch/perch-striped-common.png", creatureFolder: "perch-striped-common", idleFrames: 2, walkFrames: 2, points: 25, rarity: "common", weight: 30, minDepth: 0.25, speed: 1.2, description: "A striped freshwater fish with sharp fins." },
  { name: "Bass", icon: "/assets/fish-images/bass.png", catchAsset: "/assets/catch/bass-green-uncommon.png", creatureFolder: "bass-green-uncommon", idleFrames: 4, walkFrames: 4, points: 50, rarity: "uncommon", weight: 15, minDepth: 0.35, speed: 1.0, description: "A strong fighter popular with anglers.", tint: "rgba(60,80,40,0.3)" },
  { name: "Catfish", icon: "/assets/fish-images/catfish.png", catchAsset: "/assets/catch/catfish-brown-uncommon.png", creatureFolder: "catfish-brown-uncommon", idleFrames: 4, walkFrames: 4, points: 75, rarity: "uncommon", weight: 8, minDepth: 0.45, speed: 0.8, description: "A bottom-dweller with long whiskers.", tint: "rgba(160,120,80,0.15)" },
  { name: "Swordfish", icon: "/assets/fish-images/swordfish.png", catchAsset: "/assets/catch/swordfish-blue-rare.png", creatureFolder: "swordfish-blue-rare", idleFrames: 2, walkFrames: 2, points: 150, rarity: "rare", weight: 4, minDepth: 0.55, speed: 1.8, description: "A powerful ocean predator with a sharp bill." },
  { name: "Stingray", icon: "/assets/fish-images/stingray.png", catchAsset: "/assets/catch/stingray-gray-rare.png", creatureFolder: "stingray-gray-rare", idleFrames: 2, walkFrames: 2, points: 100, rarity: "rare", weight: 5, minDepth: 0.45, speed: 1.4, description: "A flat-bodied ray gliding silently along the ocean floor.", tint: "rgba(100,110,130,0.25)", baseScale: 1.2 },
  { name: "Whale", icon: "/assets/fish-images/whale.png", catchAsset: "/assets/catch/whale-blue-legendary.png", creatureFolder: "whale-blue-legendary", idleFrames: 2, walkFrames: 2, points: 300, rarity: "legendary", weight: 1, minDepth: 0.65, speed: 0.5, description: "The king of the deep. Incredibly rare!", tint: "rgba(40,80,180,0.45)", baseScale: 1.8 },
  { name: "Eel", icon: "/assets/fish-images/eel.png", catchAsset: "/assets/catch/eel-dark-common.png", creatureFolder: "eel-dark-common", idleFrames: 4, walkFrames: 6, points: 40, rarity: "common", weight: 20, minDepth: 0.3, speed: 1.3, description: "A slippery serpentine fish.", tint: "rgba(50,60,70,0.15)" },
  { name: "Octopus", icon: "/assets/fish-images/octopus.png", catchAsset: "/assets/catch/octopus-red-common.png", creatureFolder: "octopus-red-common", idleFrames: 6, walkFrames: 6, points: 35, rarity: "common", weight: 15, minDepth: 0.25, speed: 0.9, description: "A clever red octopus with grasping tentacles." },
  { name: "Salmon", icon: "/assets/fish-images/salmon.png", catchAsset: "/assets/catch/salmon-pink-uncommon.png", creatureFolder: "salmon-pink-uncommon", idleFrames: 4, walkFrames: 4, points: 60, rarity: "uncommon", weight: 12, minDepth: 0.35, speed: 1.1, description: "A prized pink-fleshed fish.", tint: "rgba(220,100,80,0.4)" },
  { name: "Electric Eel", icon: "/assets/fish-images/electric-eel.png", catchAsset: "/assets/catch/electric-eel-yellow-uncommon.png", creatureFolder: "electric-eel-yellow-uncommon", idleFrames: 4, walkFrames: 6, points: 65, rarity: "uncommon", weight: 10, minDepth: 0.4, speed: 1.6, description: "A shocking eel crackling with electric charge." },
  { name: "Blue Ring Octopus", icon: "/assets/fish-images/blue-ring-octopus.png", catchAsset: "/assets/catch/blue-ring-octopus-blue-uncommon.png", creatureFolder: "blue-ring-octopus-blue-uncommon", idleFrames: 6, walkFrames: 6, points: 55, rarity: "uncommon", weight: 8, minDepth: 0.35, speed: 1.0, description: "A small but deadly octopus with glowing blue rings." },
  { name: "Moray Eel", icon: "/assets/fish-images/moray-eel.png", catchAsset: "/assets/catch/moray-eel-brown-rare.png", creatureFolder: "moray-eel-brown-rare", idleFrames: 4, walkFrames: 6, points: 90, rarity: "rare", weight: 6, minDepth: 0.5, speed: 1.1, description: "A thick-bodied eel lurking in reef crevices." },
  { name: "Anglerfish", icon: "/assets/fish-images/anglerfish.png", catchAsset: "/assets/catch/anglerfish-dark-rare.png", creatureFolder: "anglerfish-dark-rare", idleFrames: 2, walkFrames: 2, points: 120, rarity: "rare", weight: 5, minDepth: 0.55, speed: 0.6, description: "A deep-sea predator with a bioluminescent lure." },
  { name: "Deep Sea Angler", icon: "/assets/fish-images/deep-sea-angler.png", catchAsset: "/assets/catch/deep-sea-angler-dark-rare.png", creatureFolder: "deep-sea-angler-dark-rare", idleFrames: 2, walkFrames: 2, points: 140, rarity: "rare", weight: 3, minDepth: 0.65, speed: 0.5, description: "A pitch-black anglerfish with a sinister yellow glow." },
  { name: "Phantom Minnow", icon: "/assets/fish-images/phantom-minnow.png", catchAsset: "/assets/catch/phantom-minnow-spectral-ultra_rare.png", creatureFolder: "phantom-minnow-spectral-ultra_rare", idleFrames: 2, walkFrames: 2, points: 500, rarity: "ultra_rare", weight: 0.3, minDepth: 0.55, speed: 2.2, description: "A ghostly minnow wreathed in spectral flame.", baseScale: 1.8 },
  { name: "Volcanic Perch", icon: "/assets/fish-images/volcanic-perch.png", catchAsset: "/assets/catch/volcanic-perch-molten-ultra_rare.png", creatureFolder: "volcanic-perch-molten-ultra_rare", idleFrames: 4, walkFrames: 4, points: 600, rarity: "ultra_rare", weight: 0.25, minDepth: 0.6, speed: 1.6, description: "A perch superheated by deep-sea vents.", baseScale: 2.0 },
  { name: "Abyssal Bass", icon: "/assets/fish-images/abyssal-bass.png", catchAsset: "/assets/catch/abyssal-bass-dark-ultra_rare.png", creatureFolder: "abyssal-bass-dark-ultra_rare", idleFrames: 4, walkFrames: 4, points: 750, rarity: "ultra_rare", weight: 0.2, minDepth: 0.65, speed: 1.4, description: "A colossal bass from the deepest trenches.", baseScale: 2.2 },
  { name: "Frost Catfish", icon: "/assets/fish-images/frost-catfish.png", catchAsset: "/assets/catch/frost-catfish-ice-ultra_rare.png", creatureFolder: "frost-catfish-ice-ultra_rare", idleFrames: 4, walkFrames: 4, points: 800, rarity: "ultra_rare", weight: 0.18, minDepth: 0.6, speed: 0.9, description: "An ancient catfish encased in living ice.", baseScale: 2.3 },
  { name: "Storm Swordfish", icon: "/assets/fish-images/storm-swordfish.png", catchAsset: "/assets/catch/storm-swordfish-electric-ultra_rare.png", creatureFolder: "storm-swordfish-electric-ultra_rare", idleFrames: 2, walkFrames: 2, points: 1000, rarity: "ultra_rare", weight: 0.12, minDepth: 0.7, speed: 2.5, description: "A swordfish that rides lightning bolts.", baseScale: 2.0 },
  { name: "Celestial Whale", icon: "/assets/fish-images/celestial-whale.png", catchAsset: "/assets/catch/celestial-whale-cosmic-ultra_rare.png", creatureFolder: "celestial-whale-cosmic-ultra_rare", idleFrames: 2, walkFrames: 2, points: 2000, rarity: "ultra_rare", weight: 0.05, minDepth: 0.75, speed: 0.4, description: "A cosmic whale that swallowed a dying star.", baseScale: 2.5 },
  { name: "Neon Eel", icon: "/assets/fish-images/neon-eel.png", catchAsset: "/assets/catch/neon-eel-neon-ultra_rare.png", creatureFolder: "neon-eel-neon-ultra_rare", idleFrames: 4, walkFrames: 4, points: 650, rarity: "ultra_rare", weight: 0.22, minDepth: 0.55, speed: 1.9, description: "A bioluminescent eel pulsing with neon colors.", baseScale: 2.0 },
  { name: "Golden Salmon", icon: "/assets/fish-images/golden-salmon.png", catchAsset: "/assets/catch/golden-salmon-gold-ultra_rare.png", creatureFolder: "golden-salmon-gold-ultra_rare", idleFrames: 4, walkFrames: 4, points: 700, rarity: "ultra_rare", weight: 0.2, minDepth: 0.6, speed: 1.5, description: "A legendary salmon with solid gold scales.", baseScale: 2.1 },
  { name: "Shadow Leviathan", icon: "/assets/fish-images/shadow-leviathan.png", catchAsset: "/assets/catch/shadow-leviathan-shadow-ultra_rare.png", creatureFolder: "shadow-leviathan-shadow-ultra_rare", idleFrames: 2, walkFrames: 2, points: 1500, rarity: "ultra_rare", weight: 0.08, minDepth: 0.8, speed: 0.6, description: "A titanic shadow beast from beyond the abyss.", tint: "rgba(140,15,15,0.5)", baseScale: 2.5 },
  { name: "The Seal at the Seam", icon: "/assets/fish-images/seal-at-the-seam.png", catchAsset: "/assets/fish-images/seal-at-the-seam.png", creatureFolder: "seal-at-the-seam-cosmic-ultra_rare", idleFrames: 6, walkFrames: 6, points: 5000, rarity: "ultra_rare", weight: 0.02, minDepth: 0.9, speed: 0.3, description: "A living sigil at the boundary of reality.", tint: "rgba(20,40,120,0.5)", baseScale: 2.8 },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#a0a0a0",
  uncommon: "#4caf50",
  rare: "#2196f3",
  legendary: "#ff9800",
  ultra_rare: "#e040fb",
};

const btnStyle = (color: string, bg: string): React.CSSProperties => ({
  padding: "5px 10px",
  borderRadius: 4,
  border: `1px solid ${color}40`,
  background: `${color}18`,
  color,
  fontSize: 10,
  fontFamily: "monospace",
  cursor: "pointer",
  fontWeight: "bold",
});

interface CreatureSpriteInfo {
  folder: string;
  hasIdle: boolean;
  hasWalk: boolean;
  hasFrames: boolean;
  category?: string;
  spritePath?: string;
}

export default function AdminFish() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animSpeed, setAnimSpeed] = useState(200);
  const [showIdle, setShowIdle] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [tintOverride, setTintOverride] = useState("");
  const [scaleOverride, setScaleOverride] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");
  const [spriteOverride, setSpriteOverride] = useState("");
  const [allSprites, setAllSprites] = useState<CreatureSpriteInfo[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    fetch("/api/creature-sprites")
      .then(r => r.json())
      .then(data => setAllSprites(data))
      .catch(() => {});
  }, []);

  const fish = FISH_TYPES[selectedIdx];
  const activeFolder = spriteOverride || fish.creatureFolder;
  const overrideInfo = spriteOverride ? allSprites.find(s => s.folder === spriteOverride) : null;
  const defaultFrames = showIdle ? fish.idleFrames : fish.walkFrames;
  const [detectedFrames, setDetectedFrames] = useState<number | null>(null);
  const totalFrames = detectedFrames || defaultFrames;
  const spriteType = showIdle ? "Idle" : "Walk";
  const basePath = overrideInfo?.spritePath || `/assets/creatures/${activeFolder}`;
  const spriteSrc = activeFolder ? `${basePath}/${spriteType}.png` : "";

  const isWhale = fish.name === "Whale" && !spriteOverride;
  const whaleFrames = [
    "/assets/creatures/whale-blue-legendary/whale_frame1.png",
    "/assets/creatures/whale-blue-legendary/whale_frame2.png",
  ];

  const getImg = useCallback((src: string): HTMLImageElement | null => {
    if (!src) return null;
    const cached = imgCache.current.get(src);
    if (cached) return cached;
    const img = new Image();
    img.src = src;
    imgCache.current.set(src, img);
    return img;
  }, []);

  useEffect(() => {
    setCurrentFrame(0);
    setSpriteOverride("");
    setDetectedFrames(null);
  }, [selectedIdx, showIdle]);

  useEffect(() => {
    if (isWhale) { setDetectedFrames(null); return; }
    if (!spriteSrc) { setDetectedFrames(null); return; }
    const img = new Image();
    img.onload = () => {
      const h = img.naturalHeight;
      if (h > 0) {
        const fc = Math.round(img.naturalWidth / h);
        setDetectedFrames(fc > 0 ? fc : 1);
      }
    };
    img.src = spriteSrc;
  }, [spriteSrc, isWhale]);

  useEffect(() => {
    if (!playing) return;
    const maxFrames = isWhale ? 2 : totalFrames;
    const speed = isWhale ? 1500 : animSpeed;
    const interval = setInterval(() => {
      setCurrentFrame(f => (f + 1) % maxFrames);
    }, speed);
    return () => clearInterval(interval);
  }, [playing, totalFrames, animSpeed, isWhale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(79,195,247,0.08)";
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (isWhale) {
      const wImg = getImg(whaleFrames[currentFrame % 2]);
      if (wImg && wImg.complete && wImg.naturalWidth > 0) {
        const scale = parseFloat(scaleOverride) || fish.baseScale || 1;
        const maxDim = Math.min(W - 40, H - 40);
        const imgScale = Math.min(maxDim / wImg.naturalWidth, maxDim / wImg.naturalHeight) * scale * 0.5;
        const dw = wImg.naturalWidth * imgScale;
        const dh = wImg.naturalHeight * imgScale;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        if (flipX) ctx.scale(-1, 1);
        const tint = tintOverride || fish.tint;
        if (tint) {
          ctx.drawImage(wImg, -dw / 2, -dh / 2, dw, dh);
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = tint;
          ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
          ctx.globalCompositeOperation = "source-over";
        } else {
          ctx.drawImage(wImg, -dw / 2, -dh / 2, dw, dh);
        }
        ctx.restore();
      }
    } else {
      const img = getImg(spriteSrc);
      if (img && img.complete && img.naturalWidth > 0) {
        const fw = img.naturalWidth / totalFrames;
        const fh = img.naturalHeight;
        const scale = parseFloat(scaleOverride) || fish.baseScale || 1;
        const maxDim = Math.min(W - 40, H - 40);
        const imgScale = Math.min(maxDim / fw, maxDim / fh) * scale * 0.4;
        const dw = fw * imgScale;
        const dh = fh * imgScale;
        const sx = currentFrame * fw;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        if (flipX) ctx.scale(-1, 1);
        const tint = tintOverride || fish.tint;
        if (tint) {
          ctx.drawImage(img, sx, 0, fw, fh, -dw / 2, -dh / 2, dw, dh);
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = tint;
          ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
          ctx.globalCompositeOperation = "source-over";
        } else {
          ctx.drawImage(img, sx, 0, fw, fh, -dw / 2, -dh / 2, dw, dh);
        }
        ctx.restore();
      }
    }

    ctx.fillStyle = "rgba(79,195,247,0.5)";
    ctx.font = "9px monospace";
    ctx.fillText(`Frame: ${currentFrame + 1}/${isWhale ? 2 : totalFrames}`, 8, H - 8);
    ctx.fillText(`${spriteType} | ${fish.name}`, 8, H - 20);
  }, [currentFrame, fish, spriteSrc, flipX, tintOverride, scaleOverride, showIdle, totalFrames, isWhale, getImg, whaleFrames]);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError("");
    setAiResult(null);
    try {
      const resp = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Pixel art sprite of ${fish.name} fish for a 2D fishing game. ${aiPrompt}. Style: 16-bit pixel art, transparent background, side view, clean outlines.`,
          size: "1024x1024",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Generation failed");
      if (data.b64_json) {
        setAiResult(`data:image/png;base64,${data.b64_json}`);
      } else if (data.url) {
        setAiResult(data.url);
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to generate");
    } finally {
      setAiGenerating(false);
    }
  };

  const rarityColor = RARITY_COLORS[fish.rarity] || "#888";

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0e1a", display: "flex", fontFamily: "monospace", color: "#ccc" }}>
      <div style={{
        width: 280, minWidth: 280, height: "100%", borderRight: "1px solid rgba(79,195,247,0.15)",
        overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ fontSize: 14, fontWeight: "bold", color: "#4fc3f7", letterSpacing: 2 }}>
          ADMIN FISH EDITOR
        </div>
        <div style={{ fontSize: 8, color: "#556" }}>
          Select a fish to preview sprites, adjust animation, and generate new assets with AI.
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>SELECT FISH:</div>
          <select
            data-testid="select-fish"
            value={selectedIdx}
            onChange={e => setSelectedIdx(Number(e.target.value))}
            style={{
              width: "100%", padding: "5px 6px", borderRadius: 4,
              border: "1px solid rgba(79,195,247,0.2)", background: "rgba(255,255,255,0.05)",
              color: "#ccc", fontSize: 10, fontFamily: "monospace",
            }}
          >
            {FISH_TYPES.map((f, i) => (
              <option key={f.name} value={i} style={{ background: "#0a0e1a", color: RARITY_COLORS[f.rarity] || "#ccc" }}>
                {f.name} ({f.rarity})
              </option>
            ))}
          </select>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <img src={fish.icon} alt={fish.name} style={{ width: 28, height: 28, imageRendering: "pixelated" }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: "bold", color: rarityColor }}>{fish.name}</div>
              <div style={{ fontSize: 8, color: "#778" }}>{fish.rarity.toUpperCase()} | {fish.points} pts</div>
            </div>
          </div>
          <div style={{ fontSize: 8, color: "#667", lineHeight: 1.4 }}>{fish.description}</div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>STATS:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, fontSize: 8, color: "#99a" }}>
            <span>Speed: <span style={{ color: "#4fc3f7" }}>{fish.speed}</span></span>
            <span>Weight: <span style={{ color: "#4fc3f7" }}>{fish.weight}%</span></span>
            <span>Depth: <span style={{ color: "#4fc3f7" }}>{(fish.minDepth * 100).toFixed(0)}%</span></span>
            <span>Scale: <span style={{ color: "#4fc3f7" }}>{fish.baseScale || 1}</span></span>
            <span>Idle Frames: <span style={{ color: "#4fc3f7" }}>{fish.idleFrames}</span></span>
            <span>Walk Frames: <span style={{ color: "#4fc3f7" }}>{fish.walkFrames}</span></span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>ANIMATION:</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            <button
              data-testid="btn-toggle-play"
              onClick={() => setPlaying(p => !p)}
              style={btnStyle(playing ? "#e74c3c" : "#2ecc71", "")}
            >
              {playing ? "PAUSE" : "PLAY"}
            </button>
            <button
              data-testid="btn-prev-frame"
              onClick={() => { setPlaying(false); setCurrentFrame(f => (f - 1 + totalFrames) % totalFrames); }}
              style={btnStyle("#4fc3f7", "")}
            >
              PREV
            </button>
            <button
              data-testid="btn-next-frame"
              onClick={() => { setPlaying(false); setCurrentFrame(f => (f + 1) % totalFrames); }}
              style={btnStyle("#4fc3f7", "")}
            >
              NEXT
            </button>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            <button
              data-testid="btn-toggle-idle-walk"
              onClick={() => setShowIdle(v => !v)}
              style={btnStyle(showIdle ? "#ff9800" : "#4fc3f7", "")}
            >
              {showIdle ? "IDLE" : "WALK"}
            </button>
            <button
              data-testid="btn-flip"
              onClick={() => setFlipX(v => !v)}
              style={btnStyle(flipX ? "#f1c40f" : "#889", "")}
            >
              FLIP
            </button>
          </div>
          <div style={{ fontSize: 8, color: "#667", marginBottom: 2 }}>Animation Speed (ms):</div>
          <input
            data-testid="input-anim-speed"
            type="range" min={50} max={1000} value={animSpeed}
            onChange={e => setAnimSpeed(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#4fc3f7" }}
          />
          <div style={{ fontSize: 8, color: "#556", textAlign: "center" }}>{animSpeed}ms</div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>VISUAL OVERRIDES:</div>
          <div style={{ fontSize: 8, color: "#667", marginBottom: 2 }}>Tint (rgba):</div>
          <input
            data-testid="input-tint"
            type="text"
            value={tintOverride}
            onChange={e => setTintOverride(e.target.value)}
            placeholder={fish.tint || "none"}
            style={{
              width: "100%", padding: "4px 6px", borderRadius: 4, boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
              color: "#ccc", fontSize: 9, fontFamily: "monospace", marginBottom: 6,
            }}
          />
          <div style={{ fontSize: 8, color: "#667", marginBottom: 2 }}>Scale Override:</div>
          <input
            data-testid="input-scale"
            type="text"
            value={scaleOverride}
            onChange={e => setScaleOverride(e.target.value)}
            placeholder={String(fish.baseScale || 1)}
            style={{
              width: "100%", padding: "4px 6px", borderRadius: 4, boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
              color: "#ccc", fontSize: 9, fontFamily: "monospace",
            }}
          />
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>ASSETS:</div>
          <div style={{ fontSize: 8, color: "#556", marginBottom: 2 }}>
            Folder: <span style={{ color: "#4fc3f7" }}>/creatures/{activeFolder}/</span>
          </div>
          <div style={{ fontSize: 8, color: "#556", marginBottom: 2 }}>
            Icon: <span style={{ color: "#4fc3f7" }}>{fish.icon.split("/").pop()}</span>
          </div>
          <div style={{ fontSize: 8, color: "#556", marginBottom: 6 }}>
            Catch: <span style={{ color: "#4fc3f7" }}>{fish.catchAsset.split("/").pop()}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>SWAP SPRITE:</div>
          <div style={{ fontSize: 8, color: "#556", marginBottom: 4 }}>
            Preview a different creature sprite for this fish.
          </div>
          <select
            data-testid="select-sprite-override"
            value={spriteOverride}
            onChange={e => { setSpriteOverride(e.target.value); setCurrentFrame(0); }}
            style={{
              width: "100%", padding: "5px 6px", borderRadius: 4,
              border: "1px solid rgba(224,64,251,0.2)", background: "rgba(255,255,255,0.05)",
              color: "#ccc", fontSize: 9, fontFamily: "monospace",
            }}
          >
            <option value="" style={{ background: "#0a0e1a", color: "#4fc3f7" }}>
              (default: {fish.creatureFolder})
            </option>
            {(() => {
              const cats = ["creature", "predator", "guardian", "npc"];
              const catLabels: Record<string, string> = { creature: "FISH / CREATURES", predator: "PREDATORS", guardian: "GUARDIAN", npc: "NPCs" };
              const catColors: Record<string, string> = { creature: "#4fc3f7", predator: "#e74c3c", guardian: "#2ecc71", npc: "#f39c12" };
              return cats.flatMap(cat => {
                const items = allSprites.filter(s => s.category === cat);
                if (items.length === 0) return [];
                return [
                  <option key={`__cat_${cat}`} disabled style={{ background: "#060a14", color: catColors[cat], fontWeight: "bold", fontSize: 10 }}>
                    {"── " + catLabels[cat] + " ──"}
                  </option>,
                  ...items.map(s => (
                    <option
                      key={s.folder}
                      value={s.folder}
                      style={{
                        background: "#0a0e1a",
                        color: s.folder === fish.creatureFolder ? "#4fc3f7" : "#ccc",
                      }}
                    >
                      {"  "}{s.folder}{!s.hasIdle && !s.hasWalk ? " (no sprites)" : ""}{s.hasFrames ? " [frames]" : ""}
                    </option>
                  )),
                ];
              });
            })()}
          </select>
          {spriteOverride && (
            <button
              data-testid="btn-reset-sprite"
              onClick={() => { setSpriteOverride(""); setCurrentFrame(0); }}
              style={{ ...btnStyle("#e74c3c", ""), marginTop: 4, width: "100%" }}
            >
              RESET TO DEFAULT
            </button>
          )}
        </div>

        <a
          href="/game"
          data-testid="link-back-game"
          style={{
            marginTop: "auto", padding: "6px 14px", borderRadius: 6,
            background: "rgba(79,195,247,0.15)", border: "1px solid rgba(79,195,247,0.3)",
            color: "#4fc3f7", fontSize: 10, textDecoration: "none", letterSpacing: 1,
            textAlign: "center",
          }}
        >
          BACK TO GAME
        </a>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#080d1a", position: "relative",
        }}>
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            data-testid="canvas-sprite-preview"
            style={{ border: "1px solid rgba(79,195,247,0.12)", borderRadius: 4, imageRendering: "pixelated" }}
          />
          <div style={{
            position: "absolute", top: 10, right: 10, fontSize: 10,
            color: rarityColor, fontWeight: "bold", letterSpacing: 1,
          }}>
            {fish.rarity.toUpperCase()}
          </div>
        </div>

        <div style={{
          height: 220, minHeight: 220, borderTop: "1px solid rgba(79,195,247,0.15)",
          padding: 12, overflowY: "auto", background: "#0a0e1a",
        }}>
          <div style={{ fontSize: 11, fontWeight: "bold", color: "#e040fb", marginBottom: 6, letterSpacing: 1 }}>
            AI SPRITE GENERATOR
          </div>
          <div style={{ fontSize: 8, color: "#556", marginBottom: 6 }}>
            Describe what you want to generate. The fish name and pixel art style are added automatically.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input
              data-testid="input-ai-prompt"
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. glowing blue scales, deep sea theme..."
              style={{
                flex: 1, padding: "6px 8px", borderRadius: 4,
                border: "1px solid rgba(224,64,251,0.25)", background: "rgba(255,255,255,0.04)",
                color: "#ccc", fontSize: 10, fontFamily: "monospace",
              }}
            />
            <button
              data-testid="btn-generate-ai"
              onClick={handleGenerate}
              disabled={aiGenerating || !aiPrompt.trim()}
              style={{
                ...btnStyle("#e040fb", ""),
                opacity: aiGenerating || !aiPrompt.trim() ? 0.5 : 1,
                minWidth: 80,
              }}
            >
              {aiGenerating ? "GENERATING..." : "GENERATE"}
            </button>
          </div>
          {aiError && (
            <div data-testid="text-ai-error" style={{ fontSize: 9, color: "#e74c3c", marginBottom: 6 }}>{aiError}</div>
          )}
          {aiResult && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <img
                data-testid="img-ai-result"
                src={aiResult}
                alt="AI Generated"
                style={{ width: 128, height: 128, borderRadius: 4, border: "1px solid rgba(224,64,251,0.3)", imageRendering: "pixelated", objectFit: "contain", background: "#0a0e1a" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#e040fb", marginBottom: 4, fontWeight: "bold" }}>GENERATED RESULT</div>
                <div style={{ fontSize: 8, color: "#667", marginBottom: 6 }}>
                  Right-click the image to save. Then place it in the creature folder for this fish.
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <a
                    href={aiResult}
                    download={`${fish.creatureFolder}_generated.png`}
                    data-testid="link-download-ai"
                    style={btnStyle("#2ecc71", "")}
                  >
                    DOWNLOAD
                  </a>
                  <button
                    data-testid="btn-clear-ai"
                    onClick={() => { setAiResult(null); setAiError(""); }}
                    style={btnStyle("#e74c3c", "")}
                  >
                    CLEAR
                  </button>
                </div>
              </div>
            </div>
          )}
          {!aiResult && !aiGenerating && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <div style={{ fontSize: 8, color: "#445" }}>Quick prompts:</div>
              {["swimming animation frame", "idle pose with fins spread", "attack pose aggressive", "glowing aura effect"].map(p => (
                <button
                  key={p}
                  onClick={() => setAiPrompt(p)}
                  style={{ padding: "2px 6px", borderRadius: 3, border: "1px solid rgba(224,64,251,0.15)", background: "transparent", color: "#889", fontSize: 8, fontFamily: "monospace", cursor: "pointer" }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
