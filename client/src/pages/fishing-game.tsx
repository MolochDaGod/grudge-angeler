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
  rarity: "common" | "uncommon" | "rare" | "legendary";
  weight: number;
  minDepth: number;
  speed: number;
  description: string;
}

const FISH_TYPES: FishType[] = [
  { name: "Minnow", catchAsset: "/assets/catch/1.png", catchW: 24, catchH: 6, creatureFolder: "1", idleFrames: 4, walkFrames: 4, points: 10, rarity: "common", weight: 40, minDepth: 0.15, speed: 1.5, description: "A tiny silver fish, common in shallow waters." },
  { name: "Perch", catchAsset: "/assets/catch/2.png", catchW: 32, catchH: 12, creatureFolder: "2", idleFrames: 4, walkFrames: 6, points: 25, rarity: "common", weight: 30, minDepth: 0.25, speed: 1.2, description: "A striped freshwater fish with sharp fins." },
  { name: "Bass", catchAsset: "/assets/catch/3.png", catchW: 40, catchH: 12, creatureFolder: "3", idleFrames: 4, walkFrames: 4, points: 50, rarity: "uncommon", weight: 15, minDepth: 0.35, speed: 1.0, description: "A strong fighter popular with anglers." },
  { name: "Catfish", catchAsset: "/assets/catch/4.png", catchW: 52, catchH: 12, creatureFolder: "4", idleFrames: 4, walkFrames: 4, points: 75, rarity: "uncommon", weight: 8, minDepth: 0.45, speed: 0.8, description: "A bottom-dweller with long whiskers." },
  { name: "Swordfish", catchAsset: "/assets/catch/5.png", catchW: 56, catchH: 24, creatureFolder: "5", idleFrames: 4, walkFrames: 6, points: 150, rarity: "rare", weight: 4, minDepth: 0.55, speed: 1.8, description: "A powerful ocean predator with a sharp bill." },
  { name: "Whale", catchAsset: "/assets/catch/6.png", catchW: 108, catchH: 22, creatureFolder: "6", idleFrames: 6, walkFrames: 6, points: 300, rarity: "legendary", weight: 1, minDepth: 0.65, speed: 0.5, description: "The king of the deep. Incredibly rare!" },
  { name: "Eel", catchAsset: "/assets/catch/7.png", catchW: 60, catchH: 12, creatureFolder: "1", idleFrames: 4, walkFrames: 4, points: 40, rarity: "common", weight: 20, minDepth: 0.3, speed: 1.3, description: "A slippery serpentine fish." },
  { name: "Salmon", catchAsset: "/assets/catch/8.png", catchW: 60, catchH: 12, creatureFolder: "3", idleFrames: 4, walkFrames: 4, points: 60, rarity: "uncommon", weight: 12, minDepth: 0.35, speed: 1.1, description: "A prized pink-fleshed fish." },
];

const JUNK_ITEMS = [
  { name: "Old Barrel", asset: "/assets/catch/Barrel.png", w: 12, h: 14, points: 5, description: "A barnacle-covered barrel from a sunken ship." },
  { name: "Wooden Box", asset: "/assets/catch/Box.png", w: 12, h: 10, points: 5, description: "A waterlogged wooden crate." },
  { name: "Treasure Chest", asset: "/assets/catch/Chest.png", w: 22, h: 12, points: 100, description: "A chest glittering with gold coins!" },
];

type GameState = "title" | "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed" | "swimming";

interface SwimmingFish {
  x: number;
  y: number;
  type: FishType;
  direction: number;
  frame: number;
  frameTimer: number;
  speed: number;
}

interface CaughtEntry {
  type: FishType | null;
  junk: typeof JUNK_ITEMS[0] | null;
  count: number;
  bestCombo: number;
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
    gameState: "title" as GameState,
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
    catchPopY: 0,
    mouseX: 0,
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
  });

  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [uiState, setUiState] = useState({
    gameState: "title" as GameState,
    score: 0,
    combo: 0,
    totalCaught: 0,
    currentCatch: null as FishType | null,
    currentJunk: null as typeof JUNK_ITEMS[0] | null,
    reelProgress: 0.5,
    castPower: 0,
    rodLevel: 1,
    bestCombo: 0,
    caughtCollection: [] as [string, CaughtEntry][],
    missReason: "",
    showCatchTimer: 0,
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

  const spawnFish = useCallback((canvasW: number, waterStartY: number, canvasH: number) => {
    const s = stateRef.current;
    const totalWeight = FISH_TYPES.reduce((a, f) => a + f.weight, 0);
    let r = Math.random() * totalWeight;
    let fishType = FISH_TYPES[0];
    for (const ft of FISH_TYPES) {
      r -= ft.weight;
      if (r <= 0) { fishType = ft; break; }
    }
    const waterRange = canvasH - waterStartY;
    const minY = waterStartY + waterRange * fishType.minDepth;
    const maxY = canvasH - 60;
    const y = minY + Math.random() * Math.max(10, maxY - minY);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const x = direction > 0 ? -80 : canvasW + 80;
    s.swimmingFish.push({
      x, y, type: fishType, direction, frame: 0, frameTimer: 0,
      speed: fishType.speed * (0.7 + Math.random() * 0.6),
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

  useEffect(() => {
    const s = stateRef.current;
    s.stars = Array.from({ length: s.starCount }, () => ({
      x: Math.random(), y: Math.random() * 0.4, size: 1 + Math.random() * 2, twinkle: Math.random() * Math.PI * 2,
    }));

    const assets = [
      "/assets/fisherman/Fisherman_idle.png",
      "/assets/fisherman/Fisherman_fish.png",
      "/assets/fisherman/Fisherman_hook.png",
      "/assets/fisherman/Fisherman_walk.png",
      "/assets/fisherman/Fisherman_swim.png",
      "/assets/fisherman/Fisherman_swim2.png",
      "/assets/fisherman/Fisherman_jump.png",
      "/assets/fisherman/Fisherman_idle2.png",
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
    ];
    Promise.all(assets.map(a => loadImage(a)));
  }, [loadImage]);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setUiState({
      gameState: s.gameState,
      score: s.score,
      combo: s.combo,
      totalCaught: s.totalCaught,
      currentCatch: s.currentCatch,
      currentJunk: s.currentJunk,
      reelProgress: s.reelProgress,
      castPower: s.castPower,
      rodLevel: s.rodLevel,
      bestCombo: s.bestCombo,
      caughtCollection: Array.from(s.caughtCollection.entries()),
      missReason: s.missReason,
      showCatchTimer: s.showCatchTimer,
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
      if (st.gameState === "reeling") {
        st.reelProgress = e.clientX / canvas.width;
      }
    };
    const onDocTouchMove = (e: TouchEvent) => {
      const st = stateRef.current;
      if (st.gameState === "reeling" && e.touches[0]) {
        st.reelProgress = e.touches[0].clientX / canvas.width;
      }
    };
    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("touchmove", onDocTouchMove);

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      stateRef.current.keysDown.add(key);
      if (["a", "d", "w", "s", " "].includes(key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keysDown.delete(e.key.toLowerCase());
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const PIER_Y_RATIO = 0.38;
    const WATER_START_RATIO = 0.42;
    const FISHERMAN_X_RATIO = 0.45;

    const getImg = (src: string) => imagesRef.current.get(src);

    const drawSprite = (src: string, frameIndex: number, totalFrames: number, x: number, y: number, scale: number, flipX = false) => {
      const img = getImg(src);
      if (!img || !img.complete) return;
      const fw = img.width / totalFrames;
      const fh = img.height;
      ctx.save();
      if (flipX) {
        ctx.translate(x + fw * scale, y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, frameIndex * fw, 0, fw, fh, 0, 0, fw * scale, fh * scale);
      } else {
        ctx.drawImage(img, frameIndex * fw, 0, fw, fh, x, y, fw * scale, fh * scale);
      }
      ctx.restore();
    };

    const drawImage = (src: string, x: number, y: number, scale: number) => {
      const img = getImg(src);
      if (!img || !img.complete) return;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
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
      s.waterOffset += 0.3 * dt;

      const WALK_SPEED = 2.5;
      const SWIM_SPEED = 2.0;
      const pierLeftBound = defaultFishermanX - 80;

      if (s.gameState === "idle") {
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
        s.playerX = Math.max(pierLeftBound, Math.min(W - 40, s.playerX));

        if (s.keysDown.has(" ")) {
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

          s.swimX = Math.max(10, Math.min(W - 10, s.swimX));
          s.swimY = Math.max(waterY + 5, Math.min(H - 30, s.swimY));

          const dockNearX = s.swimX > pierLeftBound - 40 && s.swimX < W;
          const dockNearY = s.swimY < waterY + 60;
          if (s.keysDown.has(" ") && dockNearX && dockNearY) {
            s.keysDown.delete(" ");
            s.gameState = "idle";
            s.isSwimming = false;
            s.playerX = Math.max(pierLeftBound, Math.min(W - 40, s.swimX));
            addParticles(s.swimX, waterY, 15, "#5dade2", 3, "splash");
            addRipple(s.swimX, waterY);
            syncUI();
          }
        }
      }

      const fishermanX = s.isSwimming ? s.swimX : s.playerX;
      const fishermanY = s.isSwimming
        ? s.swimY - FRAME_H * SCALE * 0.5
        : pierY - FRAME_H * SCALE + 12;

      ctx.imageSmoothingEnabled = false;

      ctx.save();
      if (s.screenShake > 0) {
        s.screenShake -= dt;
        const shakeX = (Math.random() - 0.5) * s.screenShake * 2;
        const shakeY = (Math.random() - 0.5) * s.screenShake * 2;
        ctx.translate(shakeX, shakeY);
      }

      // Sky gradient - day/night cycle based on score milestones
      const dayPhase = Math.sin(s.time * 0.002) * 0.5 + 0.5;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, waterY);
      const skyR = Math.floor(30 + dayPhase * 105);
      const skyG = Math.floor(30 + dayPhase * 176);
      const skyB = Math.floor(62 + dayPhase * 173);
      skyGrad.addColorStop(0, `rgb(${skyR},${skyG},${skyB})`);
      skyGrad.addColorStop(0.6, `rgb(${Math.min(255, skyR + 40)},${Math.min(255, skyG + 30)},${Math.min(255, skyB + 20)})`);
      skyGrad.addColorStop(1, `rgb(${Math.min(255, skyR + 80)},${Math.min(255, skyG + 50)},${Math.min(255, skyB + 30)})`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, waterY + 5);

      // Stars (visible when dark)
      if (dayPhase < 0.4) {
        const starAlpha = (0.4 - dayPhase) / 0.4;
        for (const star of s.stars) {
          const twinkle = Math.sin(s.time * 0.05 + star.twinkle) * 0.5 + 0.5;
          ctx.globalAlpha = starAlpha * twinkle;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(star.x * W, star.y * H, star.size, star.size);
        }
        ctx.globalAlpha = 1;
      }

      // Sun/Moon
      const sunX = W * 0.85;
      const sunY = 50 + dayPhase * 30;
      if (dayPhase > 0.5) {
        ctx.fillStyle = "#f39c12";
        ctx.shadowColor = "#f39c12";
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "#ecf0f1";
        ctx.shadowColor = "#bdc3c7";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(sunX, sunY + 20, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Clouds
      ctx.globalAlpha = 0.25 + dayPhase * 0.15;
      for (let i = 0; i < 6; i++) {
        const cx = ((s.time * 0.15 + i * 220) % (W + 300)) - 150;
        const cy = 50 + i * 25 + Math.sin(s.time * 0.008 + i * 2) * 4;
        ctx.fillStyle = dayPhase > 0.5 ? "#ffffff" : "#8899aa";
        ctx.beginPath();
        ctx.ellipse(cx, cy, 50 + i * 8, 14 + i * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 35, cy - 4, 35 + i * 5, 10 + i * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx - 20, cy + 2, 30 + i * 4, 10 + i, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Distant mountains/hills
      ctx.fillStyle = `rgba(${40 + dayPhase * 60}, ${50 + dayPhase * 80}, ${60 + dayPhase * 80}, 0.4)`;
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      for (let x = 0; x <= W; x += 20) {
        const hillY = waterY - 20 - Math.sin(x * 0.003) * 30 - Math.sin(x * 0.007 + 2) * 15;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(W, waterY);
      ctx.fill();

      // Water
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, H);
      const wDeep = dayPhase > 0.5 ? 0 : 20;
      waterGrad.addColorStop(0, `rgb(${41 - wDeep},${128 - wDeep * 2},${185 - wDeep})`);
      waterGrad.addColorStop(0.3, `rgb(${26 - wDeep},${111 - wDeep * 2},${160 - wDeep})`);
      waterGrad.addColorStop(0.6, `rgb(${20 - wDeep},${85 - wDeep * 2},${128 - wDeep})`);
      waterGrad.addColorStop(1, `rgb(${13 - wDeep},${59 - wDeep},${94 - wDeep})`);
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterY, W, H - waterY);

      // Water surface shimmer
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      for (let x = 0; x < W; x += 3) {
        const waveH = Math.sin((x + s.waterOffset * 12) * 0.025) * 3 +
                      Math.sin((x + s.waterOffset * 8) * 0.04) * 1.5;
        if (waveH > 1) {
          ctx.fillRect(x, waterY + waveH - 2, 2, 2);
        }
      }
      ctx.globalAlpha = 1;

      // Water waves
      for (let row = 0; row < 10; row++) {
        const wy = waterY + row * 25 + 8;
        const waveAlpha = 0.08 - row * 0.005;
        ctx.globalAlpha = Math.max(0, waveAlpha);
        ctx.strokeStyle = row % 2 === 0 ? "#88ccee" : "#2980b9";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
          const wave = Math.sin((x + s.waterOffset * 10 + row * 40) * 0.02) * 3 +
                       Math.sin((x + s.waterOffset * 14 + row * 25) * 0.035) * 2;
          if (x === 0) ctx.moveTo(x, wy + wave);
          else ctx.lineTo(x, wy + wave);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Light rays in water
      ctx.globalAlpha = 0.025 + dayPhase * 0.015;
      for (let i = 0; i < 7; i++) {
        const rx = W * 0.1 + i * W * 0.12 + Math.sin(s.time * 0.004 + i * 1.5) * 30;
        ctx.fillStyle = dayPhase > 0.5 ? "#ffffcc" : "#aaccff";
        ctx.beginPath();
        ctx.moveTo(rx - 8, waterY);
        ctx.lineTo(rx + 40, H);
        ctx.lineTo(rx + 55, H);
        ctx.lineTo(rx + 12, waterY);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Underwater bubbles
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 20; i++) {
        const bx = (i * 137 + s.time * 0.4) % W;
        const by = waterY + 40 + ((i * 97 + s.time * 0.25) % Math.max(1, H - waterY - 50));
        const br = 1 + Math.sin(s.time * 0.04 + i) * 0.5 + Math.random() * 0.5;
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
      const pierRight = W + 20;
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

        // Pier support posts using vertical sections from tileset
        const postSrcX = 80;
        const postSrcY = 0;
        const postSrcW = 10;
        const postSrcH = 64;
        const postDrawW = postSrcW * pierScale;
        const postDrawH = postSrcH * pierScale;

        for (let px = pierStartX + 40; px < pierRight - 30; px += 100) {
          ctx.drawImage(pierTiles, postSrcX, postSrcY, postSrcW, postSrcH,
            px, pierY + plankDrawH - 4, postDrawW, postDrawH);
        }
      } else {
        const pierWidth = pierRight - pierStartX;
        const plankColors = ["#6b4423", "#5a3a1a", "#7a5030", "#634020", "#6b4423"];
        for (let py = 0; py < 5; py++) {
          ctx.fillStyle = plankColors[py];
          ctx.fillRect(pierStartX, pierY + py * 8, pierWidth, 8);
        }
        ctx.fillStyle = "#4a2a10";
        for (let px = pierStartX + 40; px < pierRight - 30; px += 100) {
          ctx.fillRect(px, pierY + 40, 8, 80);
        }
      }

      // Pier shadow in water
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#000000";
      ctx.fillRect(pierStartX, waterY, pierRight - pierStartX, 12);
      ctx.globalAlpha = 1;

      // Fishing hut - positioned so stairs align with pier surface
      const hutScale = 2.2;
      const hutW = 192 * hutScale;
      const hutH = 122 * hutScale;
      const hutX = W - hutW - 20;
      const hutY = pierY - hutH + 35 * hutScale;
      drawImage("/assets/objects/Fishing_hut.png", hutX, hutY, hutScale);

      // Boat floating on water (subtle bob)
      const boatBob = Math.sin(s.time * 0.025) * 2;
      const boatScale = 2.5;
      drawImage("/assets/objects/Boat.png", pierStartX - 74 * boatScale - 30, waterY - 10 * boatScale + boatBob, boatScale);

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
      drawImage("/assets/objects/Grass2.png", W - 50, objY - 25 * 1.6 + 3, 1.6);
      drawImage("/assets/objects/Grass4.png", W - 25, objY - 23 * 1.4 + 2, 1.4);

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
      if (s.gameState !== "title") {
        if (s.swimmingFish.length < 10 && Math.random() < 0.012 * dt) {
          spawnFish(W, waterY, H);
        }
      }

      for (let i = s.swimmingFish.length - 1; i >= 0; i--) {
        const fish = s.swimmingFish[i];
        fish.x += fish.direction * fish.speed * dt;
        fish.frameTimer += dt;
        if (fish.frameTimer > 8) {
          fish.frameTimer = 0;
          fish.frame = (fish.frame + 1) % fish.type.walkFrames;
        }

        if ((fish.direction > 0 && fish.x > W + 120) || (fish.direction < 0 && fish.x < -120)) {
          s.swimmingFish.splice(i, 1);
          continue;
        }

        const fishDepth = (fish.y - waterY) / (H - waterY);
        const depthAlpha = 0.9 - fishDepth * 0.3;
        ctx.globalAlpha = depthAlpha;

        const creatureScale = SCALE * 0.65;
        const fishBobY = fish.y + Math.sin(s.time * 0.025 + fish.x * 0.008) * 3;
        drawSprite(
          `/assets/creatures/${fish.type.creatureFolder}/Walk.png`,
          fish.frame, fish.type.walkFrames,
          fish.x, fishBobY, creatureScale,
          fish.direction < 0
        );
        ctx.globalAlpha = 1;
      }

      // Fisherman sprite with per-frame rod tip tracking
      const fishRodTips: Record<string, [number, number][]> = {
        idle: [[10, 8], [10, 9], [10, 8], [10, 7]],
        fish: [[4, 10], [3, 11], [4, 12], [5, 10]],
        hook: [[38, 5], [30, 3], [18, 6], [8, 12], [4, 20], [6, 28]],
      };

      let fishermanFrame = Math.floor(s.time * 0.07) % 4;
      let fishermanSprite = "/assets/fisherman/Fisherman_idle.png";
      let fishermanFrameCount = 4;
      let rodTipKey = "idle";
      let isWalking = false;

      if (s.gameState === "swimming") {
        const isMoving = s.keysDown.has("a") || s.keysDown.has("d") || s.keysDown.has("w") || s.keysDown.has("s");
        if (s.jumpVY !== 0) {
          fishermanSprite = "/assets/fisherman/Fisherman_jump.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.min(Math.floor((s.swimY - waterY + 50) / 15), 5);
        } else if (isMoving) {
          fishermanSprite = "/assets/fisherman/Fisherman_swim.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.12) % 6;
        } else {
          fishermanSprite = "/assets/fisherman/Fisherman_swim2.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.06) % 6;
        }
        rodTipKey = "";

        const swimmerDepth = (s.swimY - waterY) / (H - waterY);
        const swimAlpha = Math.max(0.3, 0.95 - swimmerDepth * 0.4);
        ctx.globalAlpha = swimAlpha;
        drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, !s.facingLeft);

        if (isMoving && s.jumpVY === 0 && Math.random() < 0.06 * dt) {
          addParticles(s.swimX + (s.facingLeft ? 20 : -20), s.swimY, 2, "#88ccff", 1.5, "bubble");
        }
        ctx.globalAlpha = 1;
      } else if (s.gameState === "idle" && (s.keysDown.has("a") || s.keysDown.has("d"))) {
        fishermanSprite = "/assets/fisherman/Fisherman_walk.png";
        fishermanFrameCount = 6;
        fishermanFrame = Math.floor(s.time * 0.12) % 6;
        isWalking = true;
        drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, !s.facingLeft);
      } else {
        if (s.gameState === "casting") {
          fishermanSprite = "/assets/fisherman/Fisherman_hook.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.min(Math.floor(s.castPower / 18), 5);
          rodTipKey = "hook";
        } else if (s.gameState === "waiting" || s.gameState === "bite") {
          fishermanSprite = "/assets/fisherman/Fisherman_fish.png";
          fishermanFrameCount = 4;
          fishermanFrame = Math.floor(s.time * 0.05) % 4;
          rodTipKey = "fish";
        } else if (s.gameState === "reeling") {
          fishermanSprite = "/assets/fisherman/Fisherman_hook.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.18) % 6;
          rodTipKey = "hook";
        } else if (s.gameState === "caught") {
          fishermanSprite = "/assets/fisherman/Fisherman_fish.png";
          fishermanFrameCount = 4;
          fishermanFrame = 3;
          rodTipKey = "fish";
        }
        drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE);
      }

      // Calculate rod tip position in screen coords from sprite-local coords
      let rodTipX = fishermanX + 10 * SCALE;
      let rodTipY = fishermanY + 8 * SCALE;
      if (rodTipKey && fishRodTips[rodTipKey]) {
        const tips = fishRodTips[rodTipKey];
        const tipLocal = tips[Math.min(fishermanFrame, tips.length - 1)];
        rodTipX = fishermanX + tipLocal[0] * SCALE;
        rodTipY = fishermanY + tipLocal[1] * SCALE;
      }

      // Fishing line, bobber, and hook
      if (s.gameState === "waiting" || s.gameState === "bite" || s.gameState === "reeling") {
        s.bobberBob = Math.sin(s.time * 0.08) * 2.5;
        const bobberX = s.hookX;
        let bobberY = waterY + s.bobberBob;

        if (s.gameState === "bite") {
          bobberY += Math.sin(s.time * 0.4) * 6;
          s.lineWobble = Math.sin(s.time * 0.25) * 4;
          if (Math.random() < 0.1 * dt) addRipple(bobberX + (Math.random() - 0.5) * 10, waterY);
        } else {
          s.lineWobble *= 0.93;
        }

        // Fishing line with natural catenary curve (bezier)
        ctx.strokeStyle = "rgba(200,190,170,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        const midX = (rodTipX + bobberX) / 2 + s.lineWobble;
        const sagAmount = Math.max(15, Math.abs(rodTipX - bobberX) * 0.08);
        const sagY = Math.max(rodTipY, bobberY) + sagAmount + Math.sin(s.time * 0.04) * 2;
        ctx.bezierCurveTo(
          rodTipX + (midX - rodTipX) * 0.4, rodTipY + sagAmount * 0.3,
          midX, sagY,
          bobberX, bobberY
        );
        ctx.stroke();

        // Bobber
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

        // Bobber water interaction - small ripple ring
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#88ccee";
        ctx.lineWidth = 0.8;
        const rSize = bobberSize + 2 + Math.sin(s.time * 0.06) * 1.5;
        ctx.beginPath();
        ctx.ellipse(bobberX, bobberY + 2, rSize, rSize * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Hook line going down from bobber
        ctx.strokeStyle = "rgba(180,170,150,0.5)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bobberX, bobberY + bobberSize + 1);
        ctx.lineTo(s.hookX, s.hookY);
        ctx.stroke();

        // Small hook at bottom
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(s.hookX + 3, s.hookY, 3.5, -0.3, Math.PI + 0.3);
        ctx.stroke();
        ctx.fillStyle = "#bbb";
        ctx.fillRect(s.hookX + 2, s.hookY - 4, 1.5, 4);

        // Bite exclamation
        if (s.gameState === "bite") {
          s.exclamationTimer += dt;
          const bounce = Math.abs(Math.sin(s.exclamationTimer * 0.15)) * 8;
          const exScale = 1 + Math.sin(s.exclamationTimer * 0.2) * 0.15;

          ctx.save();
          ctx.translate(bobberX, bobberY - 30 - bounce);
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

      // Draw a visible line during casting too (rod tip to approximate cast direction)
      if (s.gameState === "casting") {
        ctx.strokeStyle = "rgba(200,190,170,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        ctx.lineTo(rodTipX - 15, rodTipY - 10);
        ctx.stroke();
      }

      // Show dock climb indicator when swimming near dock
      if (s.gameState === "swimming" && s.jumpVY === 0) {
        const nearDockX = s.swimX > pierStartX - 40 && s.swimX < W;
        const nearDockY = s.swimY < waterY + 60;
        if (nearDockX && nearDockY) {
          const indicatorAlpha = 0.4 + Math.sin(s.time * 0.08) * 0.2;
          ctx.globalAlpha = indicatorAlpha;
          ctx.fillStyle = "#2ecc71";
          ctx.font = "bold 10px 'Press Start 2P', monospace";
          ctx.textAlign = "center";
          ctx.fillText("SPACE", defaultFishermanX, pierY - 8);
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
          const hookRange = 100;
          const nearbyFish = s.swimmingFish.filter(f =>
            Math.abs(f.x - s.hookX) < hookRange && Math.abs(f.y - s.hookY) < hookRange
          );
          if (nearbyFish.length > 0 || Math.random() < 0.2) {
            s.gameState = "bite";
            s.biteTimer = 70 + Math.random() * 50;
            s.exclamationTimer = 0;
            if (nearbyFish.length > 0) {
              s.currentCatch = nearbyFish[0].type;
            } else {
              const totalW = FISH_TYPES.reduce((a, f) => a + f.weight, 0);
              let rr = Math.random() * totalW;
              s.currentCatch = FISH_TYPES[0];
              for (const ft of FISH_TYPES) { rr -= ft.weight; if (rr <= 0) { s.currentCatch = ft; break; } }
            }
            if (Math.random() < 0.08) {
              s.currentCatch = null;
              s.currentJunk = JUNK_ITEMS[Math.floor(Math.random() * JUNK_ITEMS.length)];
            } else { s.currentJunk = null; }
            addParticles(s.hookX, waterY, 10, "#5dade2", 2.5, "splash");
            addRipple(s.hookX, waterY);
            s.screenShake = 3;
          } else {
            s.waitTimer = 25 + Math.random() * 80;
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
        const difficultyMult = s.currentCatch ? (s.currentCatch.rarity === "legendary" ? 1.5 : s.currentCatch.rarity === "rare" ? 1.2 : 1) : 1;
        s.reelTarget += s.reelDirection * (0.006 + s.rodLevel * 0.001) * difficultyMult * dt;
        if (Math.random() < 0.005 * dt) s.reelDirection *= -1;
        if (s.reelTarget >= 0.85) { s.reelTarget = 0.85; s.reelDirection = -1; }
        if (s.reelTarget <= 0.15) { s.reelTarget = 0.15; s.reelDirection = 1; }

        const greenZone = 0.12 + s.rodLevel * 0.02;
        const diff = Math.abs(s.reelProgress - s.reelTarget);
        if (diff < greenZone) {
          s.hookY -= (1.2 + s.rodLevel * 0.3) * dt;
          if (Math.random() < 0.05 * dt) addParticles(s.hookX, s.hookY, 2, "#2ecc71", 1.5, "sparkle");
          if (s.hookY <= waterY) {
            s.gameState = "caught";
            s.showCatchTimer = 200;
            s.catchPopY = 0;
            s.combo++;
            if (s.combo > s.bestCombo) s.bestCombo = s.combo;
            s.totalCaught++;
            const pts = (s.currentCatch?.points || s.currentJunk?.points || 10) * (1 + (s.combo - 1) * 0.15);
            s.score += Math.floor(pts);

            const name = s.currentCatch?.name || s.currentJunk?.name || "Unknown";
            const existing = s.caughtCollection.get(name);
            if (existing) {
              existing.count++;
              if (s.combo > existing.bestCombo) existing.bestCombo = s.combo;
            } else {
              s.caughtCollection.set(name, { type: s.currentCatch, junk: s.currentJunk, count: 1, bestCombo: s.combo });
            }

            if (s.totalCaught % 5 === 0 && s.rodLevel < 5) s.rodLevel++;

            addParticles(s.hookX, waterY, 25, "#f1c40f", 5, "sparkle");
            addParticles(s.hookX, waterY, 15, "#ffffff", 3, "splash");
            addRipple(s.hookX, waterY, 50);
            s.flashTimer = 12;
            s.screenShake = 5;
            syncUI();
          }
        } else if (diff > 0.35) {
          s.hookY += 0.6 * dt;
          if (s.hookY > H - 40) {
            s.gameState = "missed";
            s.missReason = "The fish broke free!";
            s.combo = 0;
            s.showCatchTimer = 100;
            syncUI();
          }
        }
      }

      if (s.gameState === "caught" || s.gameState === "missed") {
        s.showCatchTimer -= dt;
        if (s.showCatchTimer <= 0) {
          s.gameState = "idle";
          s.currentCatch = null;
          s.currentJunk = null;
          syncUI();
        }
      }

      // Caught display on canvas
      if (s.gameState === "caught" && s.showCatchTimer > 0) {
        s.catchPopY = Math.min(s.catchPopY + 2 * dt, 1);
        const eased = 1 - Math.pow(1 - Math.min(1, s.catchPopY), 3);
        const alpha = Math.min(1, s.showCatchTimer / 30);
        ctx.globalAlpha = alpha * eased;

        const boxW = Math.min(340, W * 0.8);
        const boxH = 200;
        const boxX = W / 2 - boxW / 2;
        const boxY = H / 2 - boxH / 2 - 60 + (1 - eased) * 50;

        ctx.fillStyle = "rgba(8,15,25,0.85)";
        drawRoundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();
        ctx.strokeStyle = s.currentCatch?.rarity === "legendary" ? "#f1c40f" :
                          s.currentCatch?.rarity === "rare" ? "#9b59b6" :
                          s.currentCatch?.rarity === "uncommon" ? "#2ecc71" : "#3498db";
        ctx.lineWidth = 2;
        drawRoundRect(boxX, boxY, boxW, boxH, 16);
        ctx.stroke();

        ctx.fillStyle = "#f1c40f";
        ctx.font = "bold 22px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText("CAUGHT!", W / 2, boxY + 38);

        const catchName = s.currentCatch?.name || s.currentJunk?.name || "";
        const rarityColor = s.currentCatch ?
          (s.currentCatch.rarity === "legendary" ? "#f1c40f" :
           s.currentCatch.rarity === "rare" ? "#9b59b6" :
           s.currentCatch.rarity === "uncommon" ? "#2ecc71" : "#ecf0f1") : "#ecf0f1";

        ctx.fillStyle = rarityColor;
        ctx.font = "bold 14px 'Press Start 2P', monospace";
        ctx.fillText(catchName, W / 2, boxY + 68);

        if (s.currentCatch) {
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "9px 'Press Start 2P', monospace";
          ctx.fillText(s.currentCatch.rarity.toUpperCase(), W / 2, boxY + 88);
        }

        const catchAsset = s.currentCatch?.catchAsset || s.currentJunk?.asset;
        if (catchAsset) {
          const catchImg = getImg(catchAsset);
          if (catchImg && catchImg.complete) {
            const cs = 5;
            ctx.drawImage(catchImg, W / 2 - catchImg.width * cs / 2, boxY + 100, catchImg.width * cs, catchImg.height * cs);
          }
        }

        const pts = s.currentCatch?.points || s.currentJunk?.points || 0;
        const comboMult = 1 + (s.combo - 1) * 0.15;
        ctx.fillStyle = "#f1c40f";
        ctx.font = "bold 12px 'Press Start 2P', monospace";
        ctx.fillText(`+${Math.floor(pts * comboMult)} pts`, W / 2, boxY + boxH - 25);
        if (s.combo > 1) {
          ctx.fillStyle = "#e74c3c";
          ctx.font = "10px 'Press Start 2P', monospace";
          ctx.fillText(`x${s.combo} COMBO BONUS!`, W / 2, boxY + boxH - 8);
        }

        ctx.globalAlpha = 1;
      }

      // Flash
      if (s.flashTimer > 0) {
        s.flashTimer -= dt;
        ctx.globalAlpha = s.flashTimer / 12 * 0.15;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      // Title screen
      if (s.gameState === "title") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);

        const titleY = H * 0.28;

        // Glow behind title
        ctx.shadowColor = "#3498db";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#4fc3f7";
        ctx.font = "bold 48px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText("PIXEL", W / 2, titleY);
        ctx.shadowColor = "#f1c40f";
        ctx.fillStyle = "#ffd54f";
        ctx.fillText("FISHER", W / 2, titleY + 58);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.fillStyle = "#78909c";
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText("A Pixel Art Fishing Adventure", W / 2, titleY + 95);

        // Animated fish icons
        const fishIconY = titleY + 130;
        for (let i = 0; i < 3; i++) {
          const fOffset = Math.sin(s.time * 0.06 + i * 2) * 8;
          drawSprite(`/assets/creatures/${i + 1}/Walk.png`, Math.floor(s.time * 0.08) % 4, (i === 1 ? 6 : 4), W / 2 - 80 + i * 60, fishIconY + fOffset, 1.5, i % 2 === 0);
        }

        // Start prompt
        const blink = Math.sin(s.time * 0.06) > -0.2;
        if (blink) {
          ctx.fillStyle = "#ecf0f1";
          ctx.font = "14px 'Press Start 2P', monospace";
          ctx.fillText("CLICK TO START", W / 2, fishIconY + 70);
        }

        // Controls
        ctx.fillStyle = "#607d8b";
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillText("CLICK to cast & reel", W / 2, fishIconY + 100);
        ctx.fillText("A/D to walk  |  SPACE to swim", W / 2, fishIconY + 118);
        ctx.fillText("W/A/S/D to swim  |  SPACE to climb out", W / 2, fishIconY + 136);

        // Bottom decoration
        const catchIcons = ["/assets/catch/1.png", "/assets/catch/3.png", "/assets/catch/5.png", "/assets/catch/Chest.png"];
        for (let i = 0; i < catchIcons.length; i++) {
          const ci = getImg(catchIcons[i]);
          if (ci && ci.complete) {
            const bob = Math.sin(s.time * 0.04 + i * 1.5) * 3;
            ctx.drawImage(ci, W / 2 - 100 + i * 55, fishIconY + 150 + bob, ci.width * 3, ci.height * 3);
          }
        }
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
      document.removeEventListener("touchmove", onDocTouchMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [loadImage, spawnFish, addParticles, addRipple, syncUI]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.width;
    const H = canvas.height;
    const waterY = H * 0.42;
    const defaultFX = W * 0.45;

    if (s.gameState === "title") {
      s.gameState = "idle";
      s.playerX = defaultFX;
      for (let i = 0; i < 6; i++) spawnFish(W, waterY, H);
      syncUI();
      return;
    }

    if (s.gameState === "swimming") {
      return;
    }

    if (s.gameState === "idle") {
      s.gameState = "casting";
      s.castPower = 0;
      s.castDirection = 1;
      syncUI();
      return;
    }

    if (s.gameState === "casting") {
      s.gameState = "waiting";
      const power = s.castPower / 100;
      const fishermanX = s.playerX;
      s.hookX = fishermanX - 60 - power * Math.min(250, W * 0.3);
      s.hookY = waterY + 10;
      s.hookTargetY = waterY + 30 + power * (H - waterY - 100);
      s.waitTimer = 40 + Math.random() * 80;
      addParticles(s.hookX, waterY, 15, "#5dade2", 3, "splash");
      addRipple(s.hookX, waterY);
      syncUI();
      return;
    }

    if (s.gameState === "bite") {
      s.gameState = "reeling";
      s.reelProgress = 0.5;
      s.reelTarget = 0.5;
      s.reelDirection = Math.random() > 0.5 ? 1 : -1;
      syncUI();
      return;
    }

    if (s.gameState === "reeling") {
      return;
    }

    if (s.gameState === "caught" || s.gameState === "missed") {
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    s.mouseX = e.clientX;
    if (s.gameState === "reeling") {
      s.reelProgress = e.clientX / canvas.width;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    if (s.gameState === "reeling") {
      e.preventDefault();
      s.reelProgress = e.touches[0].clientX / canvas.width;
    }
  }, []);

  const rarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "#f59e0b";
      case "rare": return "#a855f7";
      case "uncommon": return "#22c55e";
      default: return "#94a3b8";
    }
  };

  const rarityBg = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "rgba(245,158,11,0.1)";
      case "rare": return "rgba(168,85,247,0.1)";
      case "uncommon": return "rgba(34,197,94,0.1)";
      default: return "rgba(148,163,184,0.05)";
    }
  };

  const [showCollection, setShowCollection] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ fontFamily: "'Press Start 2P', monospace", background: "#0a0f1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        data-testid="game-canvas"
      />

      {uiState.gameState !== "title" && (
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
          </div>

          {/* HUD Top Right - Rod Level */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5" style={{ pointerEvents: "none" }} data-testid="hud-rod">
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 8, border: "1px solid rgba(155,89,182,0.3)" }}>
              <img src="/assets/icons/Icons_07.png" alt="" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
              <span style={{ color: "#9b59b6", fontSize: 10 }}>Lv.{uiState.rodLevel}</span>
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

          {/* Cast Power Bar */}
          {uiState.gameState === "casting" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ pointerEvents: "none" }} data-testid="cast-power-bar">
              <span style={{ color: "#ecf0f1", fontSize: 10, textShadow: "1px 1px 0 #000" }}>CAST POWER</span>
              <div className="w-56 h-5 relative" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", overflow: "hidden" }}>
                <div
                  className="h-full"
                  style={{
                    width: `${uiState.castPower}%`,
                    background: uiState.castPower > 80 ? "linear-gradient(90deg, #e74c3c, #c0392b)" :
                                uiState.castPower > 50 ? "linear-gradient(90deg, #f39c12, #e67e22)" :
                                "linear-gradient(90deg, #2ecc71, #27ae60)",
                    borderRadius: 8,
                    transition: "none",
                    boxShadow: uiState.castPower > 80 ? "0 0 10px rgba(231,76,60,0.5)" : "none",
                  }}
                />
              </div>
              <span style={{ color: "#f1c40f", fontSize: 9, textShadow: "1px 1px 0 #000" }}>Click to cast!</span>
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

          {/* Reeling Minigame */}
          {uiState.gameState === "reeling" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ pointerEvents: "none" }} data-testid="reel-bar">
              <span style={{ color: "#ecf0f1", fontSize: 9, textShadow: "1px 1px 0 #000" }}>KEEP THE RED BAR IN THE GREEN ZONE!</span>
              <div className="relative" style={{ width: Math.min(320, window.innerWidth * 0.7), height: 28, background: "rgba(8,15,25,0.85)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", overflow: "hidden" }}>
                <div
                  className="absolute h-full"
                  style={{
                    left: `${Math.max(0, (stateRef.current.reelTarget - 0.12 - stateRef.current.rodLevel * 0.02) * 100)}%`,
                    width: `${(0.24 + stateRef.current.rodLevel * 0.04) * 100}%`,
                    background: "rgba(46,204,113,0.3)",
                    borderRadius: 6,
                  }}
                />
                <div
                  className="absolute top-0.5 w-3"
                  style={{
                    left: `calc(${uiState.reelProgress * 100}% - 6px)`,
                    height: 24,
                    background: "#e74c3c",
                    borderRadius: 4,
                    boxShadow: "0 0 8px rgba(231,76,60,0.6)",
                  }}
                />
              </div>
              <span style={{ color: "#78909c", fontSize: 8, textShadow: "1px 1px 0 #000" }}>Move your mouse left and right!</span>
            </div>
          )}

          {/* Missed */}
          {uiState.gameState === "missed" && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center px-5 py-3 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.85)", borderRadius: 10, border: "1px solid rgba(231,76,60,0.3)", pointerEvents: "none" }} data-testid="missed-display">
              <span style={{ color: "#e74c3c", fontSize: 11, textShadow: "1px 1px 0 #000" }}>{uiState.missReason}</span>
              <span style={{ color: "#607d8b", fontSize: 8 }}>Click to try again</span>
            </div>
          )}

          {/* Idle Prompt */}
          {uiState.gameState === "idle" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-4 py-2 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.7)", borderRadius: 8, pointerEvents: "none" }} data-testid="idle-prompt">
              <span style={{ color: "#b0bec5", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Click to cast  |  A/D to walk</span>
              <span style={{ color: "#5dade2", fontSize: 8, textShadow: "1px 1px 0 #000" }}>SPACE to dive in</span>
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

      {/* Collection Panel */}
      {showCollection && (
        <div
          className="absolute top-0 right-0 h-full flex flex-col"
          style={{
            width: Math.min(340, window.innerWidth * 0.85),
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

          {/* Stats bar */}
          <div className="flex gap-3 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-1">
              <span style={{ color: "#f1c40f", fontSize: 8 }}>Score:</span>
              <span style={{ color: "#ffd54f", fontSize: 8 }}>{uiState.score}</span>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: "#3498db", fontSize: 8 }}>Caught:</span>
              <span style={{ color: "#5dade2", fontSize: 8 }}>{uiState.totalCaught}</span>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: "#e74c3c", fontSize: 8 }}>Best:</span>
              <span style={{ color: "#f5b7b1", fontSize: 8 }}>x{uiState.bestCombo}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
            {uiState.caughtCollection.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-8 gap-3">
                <img src="/assets/icons/Icons_03.png" alt="" className="w-10 h-10 opacity-30" style={{ imageRendering: "pixelated" }} />
                <span style={{ color: "#455a64", fontSize: 8, textAlign: "center", lineHeight: "1.5" }}>
                  No fish caught yet!<br />Start fishing to fill<br />your collection.
                </span>
              </div>
            )}
            {uiState.caughtCollection.map(([name, entry]) => (
              <div
                key={name}
                className="flex items-center gap-2.5 p-2.5"
                style={{
                  background: rarityBg(entry.type?.rarity || "common"),
                  borderRadius: 8,
                  border: `1px solid ${rarityColor(entry.type?.rarity || "common")}30`,
                }}
              >
                <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                  <img
                    src={entry.type?.catchAsset || entry.junk?.asset || ""}
                    alt={name}
                    style={{ imageRendering: "pixelated", transform: "scale(2.5)", maxWidth: 36, maxHeight: 36 }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: rarityColor(entry.type?.rarity || "common"), fontSize: 9 }}>{name}</div>
                  <div style={{ color: "#607d8b", fontSize: 7, marginTop: 2 }}>
                    Caught: {entry.count} | Best: x{entry.bestCombo}
                  </div>
                  {entry.type && (
                    <div style={{ fontSize: 7, color: rarityColor(entry.type.rarity), marginTop: 1, opacity: 0.7 }}>
                      {entry.type.rarity.toUpperCase()} - {entry.type.points}pts
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Undiscovered fish */}
            {uiState.caughtCollection.length > 0 && uiState.caughtCollection.length < FISH_TYPES.length + JUNK_ITEMS.length && (
              <div className="mt-2 px-2">
                <span style={{ color: "#37474f", fontSize: 7 }}>
                  {FISH_TYPES.length + JUNK_ITEMS.length - uiState.caughtCollection.length} more species to discover...
                </span>
              </div>
            )}
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
