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
  { name: "Eel", catchAsset: "/assets/catch/7.png", catchW: 60, catchH: 12, creatureFolder: "4", idleFrames: 4, walkFrames: 4, points: 40, rarity: "common", weight: 20, minDepth: 0.3, speed: 1.3, description: "A slippery serpentine fish." },
  { name: "Salmon", catchAsset: "/assets/catch/8.png", catchW: 60, catchH: 12, creatureFolder: "5", idleFrames: 4, walkFrames: 6, points: 60, rarity: "uncommon", weight: 12, minDepth: 0.35, speed: 1.1, description: "A prized pink-fleshed fish." },
];

const JUNK_ITEMS = [
  { name: "Old Barrel", asset: "/assets/catch/Barrel.png", w: 12, h: 14, points: 5, description: "A barnacle-covered barrel from a sunken ship." },
  { name: "Wooden Box", asset: "/assets/catch/Box.png", w: 12, h: 10, points: 5, description: "A waterlogged wooden crate." },
  { name: "Treasure Chest", asset: "/assets/catch/Chest.png", w: 22, h: 12, points: 100, description: "A chest glittering with gold coins!" },
];

type GameState = "title" | "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed" | "swimming" | "boarding";

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
    reelGauge: 0.5,
    isReeling: false,
    isRightMouseDown: false,
    leftClickQueued: 0,
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
    boatX: 0,
    boardingPhase: 0 as number,
    boardingTargetX: 0,
    boardingTimer: 0,
    lastFishermanX: 0,
    lastFishermanY: 0,
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
    const sizeMultiplier = 0.5 + Math.random() * Math.random() * 4.5;
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
        if (stateRef.current.gameState === "reeling") {
          stateRef.current.leftClickQueued++;
        }
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
      if (stateRef.current.gameState === "reeling") {
        stateRef.current.leftClickQueued++;
      }
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
      const key = e.key.toLowerCase();
      stateRef.current.keysDown.add(key);
      if (["a", "d", "w", "s", " ", "e"].includes(key)) e.preventDefault();
      if (key === "e" && stateRef.current.gameState === "idle" && !stateRef.current.showBoatPrompt) {
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
        }
      }
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
      s.waterOffset += 0.12 * dt;

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
        s.playerX = Math.max(pierLeftBound, Math.min(W - 40, s.playerX));

        if (s.gameState === "casting") {
          s.aimX = Math.max(10, Math.min(W - 10, s.mouseX));
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
      }

      if (s.gameState === "reeling" && !s.inBoat) {
        const REEL_WALK_SPEED = 1.8;
        if (s.keysDown.has("a")) {
          s.playerX -= REEL_WALK_SPEED * dt;
        }
        if (s.keysDown.has("d")) {
          s.playerX += REEL_WALK_SPEED * dt;
        }
        s.playerX = Math.max(pierLeftBound, Math.min(W - 40, s.playerX));
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
            s.gameState = "idle";
            s.playerVY = 0;
            s.jumpVY = 0;
            s.facingLeft = true;
            syncUI();
          }
        }
      }

      const BOAT_SPEED = 2.0;
      if (s.inBoat && (s.gameState === "idle" || s.gameState === "casting")) {
        if (s.keysDown.has("a")) {
          s.boatX -= BOAT_SPEED * dt;
        }
        if (s.keysDown.has("d")) {
          s.boatX += BOAT_SPEED * dt;
        }
        s.boatX = Math.max(20, Math.min(W - 74 * boatScale - 20, s.boatX));
        if (s.gameState === "casting") {
          s.aimX = Math.max(10, Math.min(W - 10, s.mouseX));
          s.aimY = Math.max(waterY + 20, Math.min(H - 40, s.mouseY));
        }
      }
      if (s.inBoat && s.gameState === "reeling") {
        if (s.keysDown.has("a")) {
          s.boatX -= 1.5 * dt;
        }
        if (s.keysDown.has("d")) {
          s.boatX += 1.5 * dt;
        }
        s.boatX = Math.max(20, Math.min(W - 74 * boatScale - 20, s.boatX));
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
        fishermanX = s.boatX + 30 * boatScale;
        fishermanY = boatDeckY - FRAME_H * SCALE + 12;
        s.playerX = fishermanX;
      } else if (s.gameState === "boarding") {
        fishermanX = s.playerX;
        if (s.boardingPhase === 1) {
          fishermanY = pierY - FRAME_H * SCALE + 12 - s.playerVY;
        } else if (s.boardingPhase === 2) {
          fishermanY = boatDeckY - FRAME_H * SCALE + 12;
          s.playerX = s.boatX + 30 * boatScale;
          fishermanX = s.playerX;
        } else {
          fishermanY = pierY - FRAME_H * SCALE + 12;
        }
      } else {
        fishermanX = s.playerX;
        fishermanY = pierY - FRAME_H * SCALE + 12;
      }

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

      // Surface highlight band - soft glow at water line
      const surfGrad = ctx.createLinearGradient(0, waterY - 2, 0, waterY + 18);
      surfGrad.addColorStop(0, "rgba(136,204,238,0.0)");
      surfGrad.addColorStop(0.3, "rgba(136,204,238,0.12)");
      surfGrad.addColorStop(1, "rgba(136,204,238,0.0)");
      ctx.fillStyle = surfGrad;
      ctx.fillRect(0, waterY - 2, W, 20);

      // Surface shimmer - small horizontal highlight dashes that drift
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 73.7 + s.waterOffset * 3) % (W + 40)) - 20;
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
        for (let x = 0; x < W; x += 2) {
          const wave = Math.sin((x + s.waterOffset * 2.5 + row * 50) * 0.015) * (3 - depth * 1.5) +
                       Math.sin((x + s.waterOffset * 1.8 + row * 30) * 0.028) * (2 - depth);
          if (x === 0) ctx.moveTo(x, wy + wave);
          else ctx.lineTo(x, wy + wave);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Soft caustic light patches - dappled light on water
      for (let i = 0; i < 12; i++) {
        const cx = ((i * 127 + s.waterOffset * 1.2) % (W + 80)) - 40;
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
        const rx = W * 0.12 + i * W * 0.18 + Math.sin(s.time * 0.002 + i * 1.8) * 25;
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
        const bx = (i * 137 + s.time * 0.2) % W;
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
      const hutX = W - hutW - 20;
      const hutY = pierY - hutH + 50 * hutScale;
      drawImage("/assets/objects/Fishing_hut.png", hutX, hutY, hutScale);

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
            s.biteTimer = 120 + Math.random() * 80;
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

        if ((fish.direction > 0 && fish.x > W + 120) || (fish.direction < 0 && fish.x < -120)) {
          s.swimmingFish.splice(i, 1);
          continue;
        }

        const fishDepth = (fish.y - waterY) / (H - waterY);
        const depthAlpha = 0.9 - fishDepth * 0.3;
        ctx.globalAlpha = depthAlpha;

        const creatureScale = SCALE * 0.65 * fish.sizeMultiplier;
        drawSprite(
          `/assets/creatures/${fish.type.creatureFolder}/Walk.png`,
          fish.frame, fish.type.walkFrames,
          fish.x, fish.y, creatureScale,
          fish.direction < 0
        );
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
      let fishermanSprite = "/assets/fisherman/Fisherman_idle.png";
      let fishermanFrameCount = 4;
      let rodTipKey = "idle";
      let isWalking = false;
      let fishingFlip = (s.gameState === "idle" || s.gameState === "casting" || s.gameState === "waiting" || s.gameState === "bite" || s.gameState === "reeling" || s.gameState === "caught" || s.gameState === "missed" || s.gameState === "boarding");
      const charCenterX = fishermanX + (SPRITE_FRAME_W * SCALE) / 2;
      if (s.gameState === "casting") {
        fishingFlip = s.aimX < charCenterX;
      } else if (s.gameState === "waiting" || s.gameState === "bite" || s.gameState === "reeling" || s.gameState === "caught" || s.gameState === "missed") {
        fishingFlip = s.hookX < charCenterX;
      }

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
        drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);

        if (isMoving && s.jumpVY === 0 && Math.random() < 0.06 * dt) {
          addParticles(s.swimX + (s.facingLeft ? -20 : 20), s.swimY, 2, "#88ccff", 1.5, "bubble");
        }
        ctx.globalAlpha = 1;
      } else if (s.gameState === "boarding") {
        if (s.boardingPhase === 0) {
          fishermanSprite = "/assets/fisherman/Fisherman_walk.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.12) % 6;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);
        } else if (s.boardingPhase === 1) {
          fishermanSprite = "/assets/fisherman/Fisherman_jump.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.min(Math.floor(s.boardingTimer / 4), 5);
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, true);
        } else {
          fishermanSprite = "/assets/fisherman/Fisherman_idle.png";
          fishermanFrameCount = 4;
          fishermanFrame = 0;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, true);
        }
        rodTipKey = "";
      } else if (s.gameState === "idle") {
        const moving = s.keysDown.has("a") || s.keysDown.has("d");
        if (moving && !s.inBoat) {
          fishermanSprite = "/assets/fisherman/Fisherman_walk.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.12) % 6;
          isWalking = true;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, s.facingLeft);
        } else {
          fishermanSprite = "/assets/fisherman/Fisherman_idle.png";
          fishermanFrameCount = 4;
          fishermanFrame = Math.floor(s.time * 0.04) % 4;
          drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, fishingFlip);
        }
      } else {
        if (s.gameState === "casting") {
          fishermanSprite = "/assets/fisherman/Fisherman_hook.png";
          fishermanFrameCount = 6;
          fishermanFrame = Math.floor(s.time * 0.08) % 6;
          rodTipKey = "hook";
        } else if (s.gameState === "waiting" || s.gameState === "bite") {
          fishermanSprite = "/assets/fisherman/Fisherman_fish.png";
          fishermanFrameCount = 4;
          fishermanFrame = Math.floor(s.time * 0.05) % 4;
          rodTipKey = "fish";
        } else if (s.gameState === "reeling") {
          fishermanSprite = "/assets/fisherman/Fisherman_fish.png";
          fishermanFrameCount = 4;
          fishermanFrame = Math.floor(s.time * 0.15) % 4;
          rodTipKey = "fish";
        } else if (s.gameState === "caught") {
          fishermanSprite = "/assets/fisherman/Fisherman_fish.png";
          fishermanFrameCount = 4;
          fishermanFrame = 3;
          rodTipKey = "fish";
        }
        drawSprite(fishermanSprite, fishermanFrame, fishermanFrameCount, fishermanX, fishermanY, SCALE, fishingFlip);
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
          s.hookedFishDir < 0
        );
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
            s.waitTimer = 30 + Math.random() * 50;
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
        const rarityDiff = s.currentCatch
          ? (s.currentCatch.rarity === "legendary" ? 1.8 : s.currentCatch.rarity === "rare" ? 1.4 : s.currentCatch.rarity === "uncommon" ? 1.15 : 1)
          : 1;
        const sizeDiff = 1 + (s.hookedFishSize - 1) * 0.08;
        const difficultyMult = rarityDiff * Math.min(1.5, sizeDiff);

        const fishMoveSpeed = (s.currentCatch?.speed || 1.0) * 1.2 * difficultyMult;
        s.hookedFishX += s.hookedFishVX * dt;
        s.hookedFishFrameTimer += dt;
        if (s.hookedFishFrameTimer > 6) {
          s.hookedFishFrameTimer = 0;
          s.hookedFishFrame = (s.hookedFishFrame + 1) % (s.currentCatch?.walkFrames || 4);
        }
        if (Math.random() < (0.012 * difficultyMult) * dt) {
          s.hookedFishVX = (Math.random() > 0.5 ? 1 : -1) * fishMoveSpeed * (0.5 + Math.random() * 0.8);
        }
        s.hookedFishDir = s.hookedFishVX > 0 ? 1 : -1;
        s.hookedFishX = Math.max(20, Math.min(W - 20, s.hookedFishX));
        s.hookedFishY += Math.sin(s.time * 0.04) * 0.15;
        s.hookedFishY = Math.max(waterY + 15, Math.min(H - 30, s.hookedFishY));

        if (Math.random() < 0.03 * dt) {
          addParticles(s.hookedFishX, s.hookedFishY - 5, 2, "#88ccff", 1, "bubble");
        }

        const alignDist = Math.abs(s.playerX - s.hookedFishX);
        const maxAlignDist = W * 0.4;
        const alignment = Math.max(0, 1 - alignDist / maxAlignDist);
        const alignmentBonus = 0.6 + alignment * 0.4;

        const fishSpeed = (0.004 + s.rodLevel * 0.0005) * difficultyMult * (1.0 / alignmentBonus);
        s.reelTarget += s.reelDirection * fishSpeed * dt;
        if (Math.random() < (0.008 * difficultyMult) * dt) s.reelDirection *= -1;
        if (s.reelTarget >= 0.88) { s.reelTarget = 0.88; s.reelDirection = -1; }
        if (s.reelTarget <= 0.12) { s.reelTarget = 0.12; s.reelDirection = 1; }

        const dtSec = dt / 60;

        const clickMoveRight = 0.05;
        while (s.leftClickQueued > 0) {
          s.reelProgress = Math.min(0.95, s.reelProgress + clickMoveRight);
          s.leftClickQueued--;
        }

        if (s.isRightMouseDown) {
          s.reelProgress = Math.max(0.05, s.reelProgress - 0.40 * dtSec);
        } else if (!s.isReeling) {
          const driftRight = 0.05 * (1.0 / alignmentBonus) * dtSec;
          s.reelProgress = Math.min(0.95, s.reelProgress + driftRight);
        }

        const catchZoneHalf = (0.08 + s.rodLevel * 0.015);
        const fishInZone = s.reelTarget >= (s.reelProgress - catchZoneHalf) && s.reelTarget <= (s.reelProgress + catchZoneHalf);

        const gaugeGainRate = 0.003 * alignmentBonus;
        if (fishInZone) {
          s.reelGauge = Math.min(1.0, s.reelGauge + gaugeGainRate * dt);
          s.hookedFishY -= 0.3 * dt;
          if (Math.random() < 0.04 * dt) addParticles(s.hookedFishX, s.hookedFishY, 2, "#2ecc71", 1.5, "sparkle");
        } else {
          s.reelGauge = Math.max(0, s.reelGauge - 0.004 * difficultyMult * dt);
          s.hookedFishY += 0.15 * dt;
        }

        if (s.reelGauge >= 1.0) {
          s.gameState = "caught";
          s.showCatchTimer = 200;
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

          if (s.totalCaught % 5 === 0 && s.rodLevel < 5) s.rodLevel++;

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
          const sizeLabel = s.hookedFishSize < 1 ? "Tiny" : s.hookedFishSize < 1.5 ? "Small" : s.hookedFishSize < 2.5 ? "Medium" : s.hookedFishSize < 4 ? "Large" : "Massive";
          ctx.fillText(`${s.currentCatch.rarity.toUpperCase()} - ${sizeLabel} (${s.hookedFishSize.toFixed(1)}x)`, W / 2, boxY + 88);
        }

        const catchAsset = s.currentCatch?.catchAsset || s.currentJunk?.asset;
        if (catchAsset) {
          const catchImg = getImg(catchAsset);
          if (catchImg && catchImg.complete) {
            const cs = 3 + Math.min(3, s.hookedFishSize);
            ctx.drawImage(catchImg, W / 2 - catchImg.width * cs / 2, boxY + 98, catchImg.width * cs, catchImg.height * cs);
          }
        }

        const fishWt = Math.round(s.hookedFishSize * (s.currentCatch?.points || 5) * 0.3 * 10) / 10;
        if (s.currentCatch) {
          ctx.fillStyle = "#78909c";
          ctx.font = "8px 'Press Start 2P', monospace";
          ctx.fillText(`${fishWt} lbs`, W / 2, boxY + boxH - 45);
        }

        const pts = (s.currentCatch?.points || s.currentJunk?.points || 0) * s.hookedFishSize;
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
        ctx.fillStyle = "rgba(0,10,30,0.45)";
        ctx.fillRect(0, 0, W, H);

        // --- Underwater creature swarm across the whole screen ---
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

        // --- Floating bubbles in title ---
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

        // --- Title text ---
        const titleY = H * 0.2;

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

        ctx.fillStyle = "#90a4ae";
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText("A Pixel Art Fishing Adventure", W / 2, titleY + 90);

        // Start prompt
        const blink = Math.sin(s.time * 0.06) > -0.2;
        if (blink) {
          ctx.fillStyle = "#ecf0f1";
          ctx.font = "14px 'Press Start 2P', monospace";
          ctx.fillText("CLICK TO START", W / 2, titleY + 130);
        }

        // Controls
        ctx.fillStyle = "#607d8b";
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillText("CLICK to cast | AIM with mouse | A/D to walk", W / 2, H * 0.92);
        ctx.fillText("SPACE to swim | RIGHT-CLICK to cancel", W / 2, H * 0.92 + 16);
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

    if (s.gameState === "swimming" || s.gameState === "boarding") {
      return;
    }

    if (s.gameState === "idle") {
      s.gameState = "casting";
      s.castPower = 0;
      s.castDirection = 1;
      if (s.inBoat) {
        s.aimX = s.mouseX || (s.playerX - 100);
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
      s.leftClickQueued = 0;
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
    stateRef.current.mouseX = e.clientX;
  }, []);

  const handleTouchMove = useCallback((_e: React.TouchEvent<HTMLCanvasElement>) => {
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
        style={{ cursor: uiState.gameState === "casting" ? "crosshair" : "default" }}
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
            const catchZoneW = (0.16 + uiState.rodLevel * 0.03) * 100;
            const catchZoneLeft = Math.max(0, Math.min(100 - catchZoneW, (uiState.reelProgress - 0.08 - uiState.rodLevel * 0.015) * 100));
            const fishLeft = uiState.reelTarget * 100;
            const gaugePercent = uiState.reelGauge * 100;
            const fishInZone = uiState.reelTarget >= (uiState.reelProgress - 0.08 - uiState.rodLevel * 0.015) &&
                               uiState.reelTarget <= (uiState.reelProgress + 0.08 + uiState.rodLevel * 0.015);
            return (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ pointerEvents: "none" }} data-testid="reel-bar">
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
                    <img src="/assets/icons/Icons_05.png" alt="" style={{ width: 20, height: 20, imageRendering: "pixelated" }} />
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
              <span style={{ color: "#b0bec5", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Click to cast  |  A/D to walk</span>
              <span style={{ color: "#5dade2", fontSize: 8, textShadow: "1px 1px 0 #000" }}>SPACE to dive in</span>
            </div>
          )}
          {uiState.gameState === "idle" && uiState.inBoat && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center px-4 py-2 flex flex-col gap-1" style={{ background: "rgba(8,15,25,0.7)", borderRadius: 8, pointerEvents: "none" }} data-testid="boat-idle-prompt">
              <span style={{ color: "#b0bec5", fontSize: 10, textShadow: "1px 1px 0 #000" }}>Click to cast  |  A/D to move boat</span>
              <span style={{ color: "#f1c40f", fontSize: 8, textShadow: "1px 1px 0 #000" }}>E near pier to exit boat</span>
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
                        {rarity}
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
                  <div style={{ color: rarityColor(ft.rarity), fontSize: 6, textTransform: "uppercase" }}>{ft.rarity}</div>
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
