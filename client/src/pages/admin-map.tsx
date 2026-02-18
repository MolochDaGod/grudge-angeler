import { useState, useRef, useEffect, useCallback } from "react";

const REF_W = 1280;
const WORLD_LEFT = -(REF_W * 3) - 200;
const WORLD_RIGHT = REF_W * 5 + 200;
const WORLD_WIDTH = WORLD_RIGHT - WORLD_LEFT;
const WORLD_HEIGHT = 3200;
const PIER_Y_RATIO = 0.38;
const WATER_Y_RATIO = 0.42;
const REF_H = 720;
const PIER_Y = REF_H * PIER_Y_RATIO;
const WATER_Y = REF_H * WATER_Y_RATIO;

const STORAGE_KEY = "grudge-angeler-admin-map";

interface MapArea {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  locked: boolean;
  zIndex: number;
  isFish?: boolean;
  isCrab?: boolean;
  canSwim?: boolean;
  isDock?: boolean;
  isSand?: boolean;
  isPredator?: boolean;
}

interface DepthSlope {
  shallowX: number;
  shallowY: number;
  deepX: number;
  deepY: number;
}

interface GameImage {
  id: string;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

interface SavedMapData {
  areas: MapArea[];
  depthSlope: DepthSlope;
  version: number;
}

const DEFAULT_DEPTH_SLOPE: DepthSlope = {
  shallowX: WORLD_RIGHT,
  shallowY: WATER_Y + 50,
  deepX: WORLD_LEFT,
  deepY: WATER_Y + 1600,
};

const DEFAULT_AREAS: MapArea[] = [
  { id: "sky", label: "Sky", x: WORLD_LEFT, y: 0, w: WORLD_WIDTH, h: PIER_Y, color: "rgba(135,206,235,0.2)", locked: false, zIndex: 1 },
  { id: "beach", label: "Beach / Sand", x: REF_W * 2.6, y: PIER_Y - 30, w: REF_W * 2.5, h: WATER_Y - PIER_Y + 80, color: "rgba(228,196,120,0.4)", locked: false, zIndex: 5, isSand: true, isCrab: true },
  { id: "shallow", label: "Shallow Water", x: 0, y: WATER_Y, w: REF_W * 5, h: 150, color: "rgba(100,181,246,0.3)", locked: false, zIndex: 15, isFish: true, canSwim: true },
  { id: "mid-water", label: "Mid Water", x: -REF_W, y: WATER_Y + 150, w: REF_W * 6, h: 250, color: "rgba(30,100,180,0.3)", locked: false, zIndex: 15, isFish: true, canSwim: true },
  { id: "deep-water", label: "Deep Water", x: -(REF_W * 3) - 200, y: WATER_Y + 400, w: REF_W * 4, h: 400, color: "rgba(15,50,120,0.35)", locked: false, zIndex: 15, isFish: true, canSwim: true },
  { id: "abyss", label: "Abyss", x: -(REF_W * 3) - 200, y: WATER_Y + 800, w: REF_W * 3, h: 600, color: "rgba(8,15,40,0.5)", locked: false, zIndex: 15, isFish: true, canSwim: true },
  { id: "pier-surface", label: "Pier / Dock Surface", x: REF_W * -0.2, y: PIER_Y - 10, w: REF_W * 3.2, h: 30, color: "rgba(141,110,99,0.5)", locked: false, zIndex: 50, isDock: true },
  { id: "crab-zone", label: "Crab Area", x: REF_W * 3, y: PIER_Y + 5, w: REF_W * 1.5, h: 40, color: "rgba(255,140,60,0.35)", locked: false, zIndex: 10, isCrab: true, isSand: true },
  { id: "predator-deep", label: "Predator Zone (Sharks)", x: -(REF_W * 2), y: WATER_Y + 300, w: REF_W * 2, h: 500, color: "rgba(200,30,30,0.2)", locked: false, zIndex: 20, isFish: true, canSwim: true, isPredator: true },
  { id: "predator-abyss", label: "Predator Zone (Kraken)", x: -(REF_W * 3) - 200, y: WATER_Y + 700, w: REF_W * 1.5, h: 700, color: "rgba(150,20,60,0.2)", locked: false, zIndex: 20, isFish: true, canSwim: true, isPredator: true },
];

const GAME_IMAGES: GameImage[] = [
  { id: "dock-front", src: "/assets/dock_front.png", x: REF_W * -0.15, y: PIER_Y - 50, w: REF_W * 2.5, h: 60, label: "Dock Front" },
  { id: "dock-struct", src: "/assets/dock_structure_full.png", x: REF_W * 0.1, y: PIER_Y - 80, w: REF_W * 1.5, h: 100, label: "Dock Structure" },
  { id: "dock-legs-uw", src: "/assets/dock_legs_underwater.png", x: REF_W * 0.2, y: WATER_Y + 10, w: 200, h: 180, label: "Dock Legs UW" },
  { id: "dock-legs-wl", src: "/assets/dock_legs_waterline.png", x: REF_W * 0.2, y: WATER_Y - 30, w: 150, h: 80, label: "Dock Legs WL" },
  { id: "fishing-hut", src: "/assets/objects/Fishing_hut.png", x: REF_W * 0.85, y: PIER_Y - 192 * 2.2, w: 192 * 2.2, h: 192 * 2.2, label: "Fishing Hut" },
  { id: "boat", src: "/assets/objects/Boat.png", x: REF_W * 0.1, y: WATER_Y - 20, w: 120, h: 60, label: "Boat" },
  { id: "stay-sign1", src: "/assets/objects/Stay.png", x: REF_W * 1.6, y: PIER_Y - 32, w: 30, h: 30, label: "Stay Sign" },
  { id: "barrel1", src: "/assets/objects/Fishbarrel1.png", x: REF_W * 1.8, y: PIER_Y - 22, w: 22, h: 20, label: "Fish Barrel" },
  { id: "grass1", src: "/assets/objects/Grass1.png", x: REF_W * 2.0, y: PIER_Y - 40, w: 33, h: 40, label: "Grass 1" },
  { id: "fishrod-stand", src: "/assets/objects/Fish-rod.png", x: REF_W * 2.2, y: PIER_Y - 42, w: 26, h: 42, label: "Fish Rod Stand" },
  { id: "barrel2", src: "/assets/objects/Fishbarrel2.png", x: REF_W * 2.5, y: PIER_Y - 24, w: 22, h: 24, label: "Fish Barrel 2" },
  { id: "uw-bg", src: "/assets/underwater_bg.png", x: WORLD_LEFT, y: WATER_Y, w: WORLD_WIDTH, h: 500, label: "Underwater BG (tiled)" },
  { id: "plants", src: "/assets/plants_sheet.png", x: WORLD_LEFT, y: WATER_Y + 300, w: 400, h: 100, label: "Plants Sheet" },
  { id: "bait-shop", src: "/assets/objects/Fishing_hut.png", x: REF_W * 3.5, y: PIER_Y - 120, w: 120, h: 120, label: "Bait Shop (Beach)" },
];

const AREA_PALETTE = [
  { color: "rgba(135,206,235,0.25)", label: "Sky" },
  { color: "rgba(228,196,120,0.4)", label: "Sand" },
  { color: "rgba(141,110,99,0.5)", label: "Pier" },
  { color: "rgba(100,181,246,0.3)", label: "Shallow" },
  { color: "rgba(30,100,180,0.3)", label: "Mid Water" },
  { color: "rgba(15,50,120,0.35)", label: "Deep" },
  { color: "rgba(8,15,40,0.5)", label: "Abyss" },
  { color: "rgba(255,140,60,0.35)", label: "Crab" },
  { color: "rgba(200,30,30,0.2)", label: "Predator" },
  { color: "rgba(255,215,0,0.25)", label: "Legendary" },
  { color: "rgba(100,200,100,0.3)", label: "Boat Access" },
  { color: "rgba(180,60,220,0.25)", label: "Custom" },
];

function loadSavedMap(): SavedMapData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedMapData;
    if (data.areas && Array.isArray(data.areas)) {
      data.areas = data.areas.map(a => ({ ...a, zIndex: a.zIndex ?? 10 }));
      return data;
    }
    return null;
  } catch { return null; }
}

function saveMap(areas: MapArea[], depthSlope: DepthSlope) {
  const data: SavedMapData = { areas, depthSlope, version: 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function AdminMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const saved = useRef(loadSavedMap());
  const [areas, setAreas] = useState<MapArea[]>(saved.current?.areas || DEFAULT_AREAS);
  const [depthSlope, setDepthSlope] = useState<DepthSlope>(saved.current?.depthSlope || DEFAULT_DEPTH_SLOPE);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.12);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showDepthSlope, setShowDepthSlope] = useState(true);
  const [dragMode, setDragMode] = useState<null | "move" | "resize-br" | "resize-bl" | "resize-tr" | "resize-tl" | "resize-r" | "resize-b" | "resize-l" | "resize-t" | "slope-shallow" | "slope-deep">(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, areaX: 0, areaY: 0, areaW: 0, areaH: 0 });
  const [newAreaColor, setNewAreaColor] = useState(0);
  const [newAreaLabel, setNewAreaLabel] = useState("New Area");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [surfaceGenerating, setSurfaceGenerating] = useState(false);
  const [surfaceResult, setSurfaceResult] = useState<string | null>(null);
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const areasRef = useRef(areas);
  areasRef.current = areas;
  const depthSlopeRef = useRef(depthSlope);
  depthSlopeRef.current = depthSlope;
  const slopeDragStart = useRef({ x: 0, y: 0, origX: 0, origY: 0 });

  const getImg = useCallback((src: string): HTMLImageElement | null => {
    if (loadedImages.current.has(src)) return loadedImages.current.get(src)!;
    const img = new Image();
    img.src = src;
    loadedImages.current.set(src, img);
    img.onload = () => draw();
    return null;
  }, []);

  const worldToScreen = useCallback((wx: number, wy: number) => ({
    x: (wx - WORLD_LEFT) * zoom + panOffset.x,
    y: wy * zoom + panOffset.y,
  }), [zoom, panOffset]);

  const screenToWorld = useCallback((sx: number, sy: number) => ({
    x: (sx - panOffset.x) / zoom + WORLD_LEFT,
    y: (sy - panOffset.y) / zoom,
  }), [zoom, panOffset]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, cw, ch);

    const tl = worldToScreen(WORLD_LEFT, 0);
    const br = worldToScreen(WORLD_RIGHT, WORLD_HEIGHT);
    const worldScreenW = br.x - tl.x;
    const worldScreenH = br.y - tl.y;

    const skyGrad = ctx.createLinearGradient(tl.x, tl.y, tl.x, tl.y + (PIER_Y * zoom));
    skyGrad.addColorStop(0, "#1a2a4a");
    skyGrad.addColorStop(1, "#2a4a6a");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(tl.x, tl.y, worldScreenW, PIER_Y * zoom);

    const waterGrad = ctx.createLinearGradient(tl.x, tl.y + WATER_Y * zoom, tl.x, br.y);
    waterGrad.addColorStop(0, "#1a5a8a");
    waterGrad.addColorStop(0.3, "#0d3a6a");
    waterGrad.addColorStop(0.7, "#061a3a");
    waterGrad.addColorStop(1, "#030a1a");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(tl.x, tl.y + WATER_Y * zoom, worldScreenW, worldScreenH - WATER_Y * zoom);

    const beachLeft = WORLD_RIGHT - REF_W * 2.5;
    const bs = worldToScreen(beachLeft, PIER_Y - 20);
    const be = worldToScreen(WORLD_RIGHT, WATER_Y + 80);
    const sandGrad = ctx.createLinearGradient(bs.x, bs.y, bs.x, be.y);
    sandGrad.addColorStop(0, "rgba(228,196,120,0.5)");
    sandGrad.addColorStop(1, "rgba(194,154,80,0.2)");
    ctx.fillStyle = sandGrad;
    ctx.fillRect(bs.x, bs.y, be.x - bs.x, be.y - bs.y);

    if (showImages) {
      for (const gi of GAME_IMAGES) {
        const img = getImg(gi.src);
        if (img && img.complete && img.naturalWidth > 0) {
          const sp = worldToScreen(gi.x, gi.y);
          const sw = gi.w * zoom;
          const sh = gi.h * zoom;
          ctx.globalAlpha = gi.id === "uw-bg" ? 0.15 : 0.8;
          ctx.drawImage(img, sp.x, sp.y, sw, sh);
          ctx.globalAlpha = 1;
          if (showLabels) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = `${Math.max(7, 9 * zoom / 0.12)}px monospace`;
            ctx.textAlign = "left";
            ctx.fillText(gi.label, sp.x + 2, sp.y + sh - 2);
          }
        }
      }
    }

    const sortedAreas = [...areasRef.current].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const area of sortedAreas) {
      const sp = worldToScreen(area.x, area.y);
      const sw = area.w * zoom;
      const sh = area.h * zoom;
      ctx.fillStyle = area.color;
      ctx.fillRect(sp.x, sp.y, sw, sh);
      ctx.strokeStyle = selectedArea === area.id ? "#f1c40f" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = selectedArea === area.id ? 2 : 1;
      ctx.setLineDash(selectedArea === area.id ? [] : [4, 4]);
      ctx.strokeRect(sp.x, sp.y, sw, sh);
      ctx.setLineDash([]);

      if (showLabels) {
        ctx.fillStyle = selectedArea === area.id ? "#f1c40f" : "rgba(255,255,255,0.7)";
        ctx.font = `bold ${Math.max(8, 11 * zoom / 0.12)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(area.label, sp.x + sw / 2, sp.y + sh / 2 + 4);
        const flags: string[] = [];
        if (area.isFish) flags.push("FISH");
        if (area.isCrab) flags.push("CRAB");
        if (area.canSwim) flags.push("SWIM");
        if (area.isDock) flags.push("DOCK");
        if (area.isSand) flags.push("SAND");
        if (area.isPredator) flags.push("PRED");
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = `${Math.max(6, 8 * zoom / 0.12)}px monospace`;
        ctx.fillText(`${Math.round(area.w)}x${Math.round(area.h)} z:${area.zIndex || 0}`, sp.x + sw / 2, sp.y + sh / 2 + 16);
        if (flags.length > 0) {
          ctx.fillStyle = "rgba(79,195,247,0.5)";
          ctx.font = `${Math.max(5, 7 * zoom / 0.12)}px monospace`;
          ctx.fillText(flags.join(" "), sp.x + sw / 2, sp.y + sh / 2 + 26);
        }
      }

      if (selectedArea === area.id) {
        const hs = 5;
        const handles = [
          { x: sp.x, y: sp.y },
          { x: sp.x + sw, y: sp.y },
          { x: sp.x, y: sp.y + sh },
          { x: sp.x + sw, y: sp.y + sh },
          { x: sp.x + sw / 2, y: sp.y },
          { x: sp.x + sw, y: sp.y + sh / 2 },
          { x: sp.x + sw / 2, y: sp.y + sh },
          { x: sp.x, y: sp.y + sh / 2 },
        ];
        for (const h of handles) {
          ctx.fillStyle = "#f1c40f";
          ctx.fillRect(h.x - hs, h.y - hs, hs * 2, hs * 2);
        }
      }
    }

    if (showDepthSlope) {
      const ds = depthSlopeRef.current;
      const sShallow = worldToScreen(ds.shallowX, ds.shallowY);
      const sDeep = worldToScreen(ds.deepX, ds.deepY);
      const sBottomRight = worldToScreen(WORLD_RIGHT, WORLD_HEIGHT);
      const sBottomLeft = worldToScreen(WORLD_LEFT, WORLD_HEIGHT);

      ctx.beginPath();
      ctx.moveTo(sShallow.x, sShallow.y);
      ctx.lineTo(sDeep.x, sDeep.y);
      ctx.lineTo(sBottomLeft.x, sBottomLeft.y);
      ctx.lineTo(sBottomRight.x, sBottomRight.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(8,15,40,0.25)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sShallow.x, sShallow.y);
      ctx.lineTo(sDeep.x, sDeep.y);
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const handleR = 8;
      ctx.beginPath();
      ctx.arc(sShallow.x, sShallow.y, handleR, 0, Math.PI * 2);
      ctx.fillStyle = "#2ecc71";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sDeep.x, sDeep.y, handleR, 0, Math.PI * 2);
      ctx.fillStyle = "#e74c3c";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (showLabels) {
        ctx.font = `bold ${Math.max(8, 10 * zoom / 0.12)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#2ecc71";
        ctx.fillText("SHALLOW", sShallow.x, sShallow.y - 14);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = `${Math.max(6, 8 * zoom / 0.12)}px monospace`;
        ctx.fillText(`y=${Math.round(ds.shallowY)}`, sShallow.x, sShallow.y - 4);
        ctx.font = `bold ${Math.max(8, 10 * zoom / 0.12)}px monospace`;
        ctx.fillStyle = "#e74c3c";
        ctx.fillText("DEEP", sDeep.x, sDeep.y - 14);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = `${Math.max(6, 8 * zoom / 0.12)}px monospace`;
        ctx.fillText(`y=${Math.round(ds.deepY)}`, sDeep.x, sDeep.y - 4);

        const midX = (sShallow.x + sDeep.x) / 2;
        const midY = (sShallow.y + sDeep.y) / 2;
        const angleDeg = Math.round(Math.atan2(ds.deepY - ds.shallowY, ds.shallowX - ds.deepX) * 180 / Math.PI);
        ctx.font = `bold ${Math.max(9, 12 * zoom / 0.12)}px monospace`;
        ctx.fillStyle = "#e74c3c";
        ctx.fillText(`DEPTH SLOPE: ${angleDeg}deg`, midX, midY - 6);
      }
    }

    ctx.strokeStyle = "rgba(79,195,247,0.6)";
    ctx.lineWidth = 2;
    const wl = worldToScreen(WORLD_LEFT, WATER_Y);
    const wr = worldToScreen(WORLD_RIGHT, WATER_Y);
    ctx.beginPath();
    ctx.moveTo(wl.x, wl.y);
    ctx.lineTo(wr.x, wr.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(200,160,80,0.4)";
    ctx.lineWidth = 2;
    const pl = worldToScreen(WORLD_LEFT, PIER_Y);
    const pr = worldToScreen(WORLD_RIGHT, PIER_Y);
    ctx.beginPath();
    ctx.moveTo(pl.x, pl.y);
    ctx.lineTo(pr.x, pr.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    const zoneMarkers = [
      { x: 0, label: "Zone 2 / Pier Right (x=0)", color: "#64b5f6" },
      { x: -REF_W, label: "Zone 3 Start (x=-W)", color: "#42a5f5" },
      { x: -(REF_W * 3) - 200, label: "Zone 4 / Abyss (x=-3W-200)", color: "#7c4dff" },
      { x: REF_W * 0.85, label: "Shop / Hut", color: "#66bb6a" },
      { x: REF_W * 2.6, label: "License Gate", color: "#ff9800" },
      { x: REF_W * 3.5, label: "Bait Shop", color: "#ff7043" },
    ];
    for (const m of zoneMarkers) {
      const ms = worldToScreen(m.x, 0);
      ctx.strokeStyle = m.color + "60";
      ctx.beginPath();
      ctx.moveTo(ms.x, tl.y);
      ctx.lineTo(ms.x, br.y);
      ctx.stroke();
      if (showLabels) {
        ctx.fillStyle = m.color;
        ctx.font = `${Math.max(8, 10 * zoom / 0.12)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(m.label, ms.x, tl.y + 14);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = `${Math.max(6, 8 * zoom / 0.12)}px monospace`;
        ctx.fillText(`x=${Math.round(m.x)}`, ms.x, tl.y + 26);
      }
    }
    ctx.setLineDash([]);

    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      const gridStep = REF_W * 0.5;
      for (let gx = Math.ceil(WORLD_LEFT / gridStep) * gridStep; gx <= WORLD_RIGHT; gx += gridStep) {
        const gs = worldToScreen(gx, 0);
        ctx.beginPath(); ctx.moveTo(gs.x, tl.y); ctx.lineTo(gs.x, br.y); ctx.stroke();
      }
      for (let gy = 0; gy <= WORLD_HEIGHT; gy += gridStep) {
        const gs = worldToScreen(WORLD_LEFT, gy);
        ctx.beginPath(); ctx.moveTo(tl.x, gs.y); ctx.lineTo(br.x, gs.y); ctx.stroke();
      }
    }

    if (showLabels) {
      const zones = [
        { x1: WORLD_LEFT, x2: -(REF_W * 3) - 200, label: "ZONE 4: ABYSS", color: "#7c4dff" },
        { x1: -(REF_W * 3) - 200, x2: -REF_W, label: "ZONE 3: DEEP", color: "#2196f3" },
        { x1: -REF_W, x2: 0, label: "ZONE 2: PIER / MID", color: "#4caf50" },
        { x1: 0, x2: WORLD_RIGHT, label: "ZONE 1: BEACH / SHALLOW", color: "#ff9800" },
      ];
      for (const z of zones) {
        const zs1 = worldToScreen(z.x1, WATER_Y + 20);
        const zs2 = worldToScreen(z.x2, WATER_Y + 20);
        const cx = (zs1.x + zs2.x) / 2;
        ctx.fillStyle = z.color;
        ctx.font = `bold ${Math.max(9, 12 * zoom / 0.12)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(z.label, cx, zs1.y);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(tl.x, tl.y, worldScreenW, worldScreenH);
  }, [worldToScreen, zoom, showGrid, showLabels, showImages, showDepthSlope, selectedArea, getImg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => { draw(); }, [draw, areas, depthSlope, panOffset, zoom, showGrid, showLabels, showImages, showDepthSlope, selectedArea]);

  useEffect(() => {
    setPanOffset({
      x: window.innerWidth * 0.5 - (WORLD_WIDTH * 0.5) * zoom,
      y: 40,
    });
  }, []);

  const getSlopeHandleAt = (sx: number, sy: number): "slope-shallow" | "slope-deep" | null => {
    if (!showDepthSlope) return null;
    const ds = depthSlopeRef.current;
    const sShallow = worldToScreen(ds.shallowX, ds.shallowY);
    const sDeep = worldToScreen(ds.deepX, ds.deepY);
    const hr = 12;
    if (Math.abs(sx - sShallow.x) < hr && Math.abs(sy - sShallow.y) < hr) return "slope-shallow";
    if (Math.abs(sx - sDeep.x) < hr && Math.abs(sy - sDeep.y) < hr) return "slope-deep";
    return null;
  };

  const getHandleAt = (sx: number, sy: number): string | null => {
    if (!selectedArea) return null;
    const area = areasRef.current.find(a => a.id === selectedArea);
    if (!area) return null;
    const sp = worldToScreen(area.x, area.y);
    const sw = area.w * zoom;
    const sh = area.h * zoom;
    const hs = 8;
    const corners = [
      { name: "resize-tl", x: sp.x, y: sp.y },
      { name: "resize-tr", x: sp.x + sw, y: sp.y },
      { name: "resize-bl", x: sp.x, y: sp.y + sh },
      { name: "resize-br", x: sp.x + sw, y: sp.y + sh },
      { name: "resize-t", x: sp.x + sw / 2, y: sp.y },
      { name: "resize-r", x: sp.x + sw, y: sp.y + sh / 2 },
      { name: "resize-b", x: sp.x + sw / 2, y: sp.y + sh },
      { name: "resize-l", x: sp.x, y: sp.y + sh / 2 },
    ];
    for (const c of corners) {
      if (Math.abs(sx - c.x) < hs && Math.abs(sy - c.y) < hs) return c.name;
    }
    return null;
  };

  const getAreaAt = (sx: number, sy: number): string | null => {
    for (let i = areasRef.current.length - 1; i >= 0; i--) {
      const area = areasRef.current[i];
      const sp = worldToScreen(area.x, area.y);
      const sw = area.w * zoom;
      const sh = area.h * zoom;
      if (sx >= sp.x && sx <= sp.x + sw && sy >= sp.y && sy <= sp.y + sh) return area.id;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
      return;
    }

    const slopeHandle = getSlopeHandleAt(e.clientX, e.clientY);
    if (slopeHandle) {
      setDragMode(slopeHandle);
      const ds = depthSlopeRef.current;
      const orig = slopeHandle === "slope-shallow"
        ? { origX: ds.shallowX, origY: ds.shallowY }
        : { origX: ds.deepX, origY: ds.deepY };
      slopeDragStart.current = { x: e.clientX, y: e.clientY, ...orig };
      setSelectedArea(null);
      return;
    }

    const handle = getHandleAt(e.clientX, e.clientY);
    if (handle) {
      const area = areasRef.current.find(a => a.id === selectedArea)!;
      setDragMode(handle as any);
      setDragStart({ x: e.clientX, y: e.clientY, areaX: area.x, areaY: area.y, areaW: area.w, areaH: area.h });
      return;
    }

    const areaId = getAreaAt(e.clientX, e.clientY);
    if (areaId) {
      setSelectedArea(areaId);
      const area = areasRef.current.find(a => a.id === areaId)!;
      setDragMode("move");
      setDragStart({ x: e.clientX, y: e.clientY, areaX: area.x, areaY: area.y, areaW: area.w, areaH: area.h });
    } else {
      setSelectedArea(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      });
      return;
    }

    if (dragMode === "slope-shallow" || dragMode === "slope-deep") {
      const dx = (e.clientX - slopeDragStart.current.x) / zoom;
      const dy = (e.clientY - slopeDragStart.current.y) / zoom;
      const newX = Math.max(WORLD_LEFT, Math.min(WORLD_RIGHT, slopeDragStart.current.origX + dx));
      const newY = Math.max(WATER_Y, Math.min(WORLD_HEIGHT, slopeDragStart.current.origY + dy));
      setDepthSlope(prev => dragMode === "slope-shallow"
        ? { ...prev, shallowX: newX, shallowY: newY }
        : { ...prev, deepX: newX, deepY: newY }
      );
      return;
    }

    if (!dragMode || !selectedArea) return;
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;
    setAreas(prev => prev.map(a => {
      if (a.id !== selectedArea) return a;
      switch (dragMode) {
        case "move":
          return { ...a, x: dragStart.areaX + dx, y: dragStart.areaY + dy };
        case "resize-br":
          return { ...a, w: Math.max(20, dragStart.areaW + dx), h: Math.max(20, dragStart.areaH + dy) };
        case "resize-r":
          return { ...a, w: Math.max(20, dragStart.areaW + dx) };
        case "resize-b":
          return { ...a, h: Math.max(20, dragStart.areaH + dy) };
        case "resize-bl":
          return { ...a, x: dragStart.areaX + dx, w: Math.max(20, dragStart.areaW - dx), h: Math.max(20, dragStart.areaH + dy) };
        case "resize-tl":
          return { ...a, x: dragStart.areaX + dx, y: dragStart.areaY + dy, w: Math.max(20, dragStart.areaW - dx), h: Math.max(20, dragStart.areaH - dy) };
        case "resize-tr":
          return { ...a, y: dragStart.areaY + dy, w: Math.max(20, dragStart.areaW + dx), h: Math.max(20, dragStart.areaH - dy) };
        case "resize-l":
          return { ...a, x: dragStart.areaX + dx, w: Math.max(20, dragStart.areaW - dx) };
        case "resize-t":
          return { ...a, y: dragStart.areaY + dy, h: Math.max(20, dragStart.areaH - dy) };
        default: return a;
      }
    }));
  };

  const handleMouseUp = () => {
    setDragMode(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.03, Math.min(1.5, zoom * factor));
    const mx = e.clientX;
    const my = e.clientY;
    setPanOffset(prev => ({
      x: mx - (mx - prev.x) * (newZoom / zoom),
      y: my - (my - prev.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
  };

  const addArea = () => {
    const viewCenter = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const palette = AREA_PALETTE[newAreaColor];
    const id = `area-${Date.now()}`;
    setAreas(prev => [...prev, {
      id,
      label: newAreaLabel || "New Area",
      x: viewCenter.x - 200,
      y: viewCenter.y - 50,
      w: 400,
      h: 200,
      color: palette.color,
      locked: false,
      zIndex: 10,
    }]);
    setSelectedArea(id);
    setNewAreaLabel("New Area");
  };

  const addAreaBelow = () => {
    const allAreas = areasRef.current;
    let anchorArea: MapArea | undefined;
    if (selectedArea) {
      anchorArea = allAreas.find(a => a.id === selectedArea);
    }
    if (!anchorArea && allAreas.length > 0) {
      anchorArea = allAreas.reduce((lowest, a) => (a.y + a.h > lowest.y + lowest.h ? a : lowest), allAreas[0]);
    }
    const palette = AREA_PALETTE[newAreaColor];
    const id = `area-${Date.now()}`;
    const newY = anchorArea ? anchorArea.y + anchorArea.h + 20 : WATER_Y + 500;
    setAreas(prev => [...prev, {
      id,
      label: newAreaLabel || "New Area",
      x: anchorArea ? anchorArea.x : WORLD_LEFT,
      y: newY,
      w: anchorArea ? anchorArea.w : WORLD_WIDTH * 0.5,
      h: 300,
      color: palette.color,
      locked: false,
      zIndex: anchorArea ? (anchorArea.zIndex || 10) : 10,
    }]);
    setSelectedArea(id);
    setNewAreaLabel("New Area");
  };

  const deleteArea = () => {
    if (!selectedArea) return;
    setAreas(prev => prev.filter(a => a.id !== selectedArea));
    setSelectedArea(null);
  };

  const duplicateArea = () => {
    if (!selectedArea) return;
    const src = areasRef.current.find(a => a.id === selectedArea);
    if (!src) return;
    const id = `area-${Date.now()}`;
    setAreas(prev => [...prev, { ...src, id, y: src.y + src.h + 20, label: src.label + " (copy)" }]);
    setSelectedArea(id);
  };

  const handleSave = () => {
    saveMap(areas, depthSlope);
    setSaveStatus("SAVED!");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleLoad = () => {
    const data = loadSavedMap();
    if (data) {
      setAreas(data.areas);
      if (data.depthSlope) setDepthSlope(data.depthSlope);
      setSaveStatus("LOADED!");
    } else {
      setSaveStatus("No saved data");
    }
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const exportData = () => {
    const data = JSON.stringify({ areas, depthSlope, version: 1 }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-map-areas.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sel = selectedArea ? areas.find(a => a.id === selectedArea) : null;

  const cursorStyle = (() => {
    if (isPanning) return "grabbing";
    if (dragMode === "move") return "move";
    if (dragMode === "slope-shallow" || dragMode === "slope-deep") return "grab";
    if (dragMode?.includes("resize")) return "nwse-resize";
    return "crosshair";
  })();

  const angleDeg = Math.round(Math.atan2(depthSlope.deepY - depthSlope.shallowY, depthSlope.shallowX - depthSlope.deepX) * 180 / Math.PI);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0e1a", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ cursor: cursorStyle, display: "block" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      />

      <div style={{
        position: "absolute", top: 10, left: 10, background: "rgba(10,14,26,0.95)",
        border: "1px solid rgba(79,195,247,0.2)", borderRadius: 8, padding: 12,
        color: "#ccc", fontFamily: "monospace", fontSize: 11, width: 240,
        maxHeight: "calc(100vh - 20px)", overflowY: "auto",
      }}>
        <div style={{ fontSize: 14, fontWeight: "bold", color: "#4fc3f7", marginBottom: 8, letterSpacing: 2 }}>
          ADMIN MAP
        </div>
        <div style={{ fontSize: 8, color: "#667", marginBottom: 8 }}>
          Click area to select. Drag to move. Drag handles to resize. Shift+drag to pan. Scroll to zoom.
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          <button
            data-testid="btn-toggle-grid"
            onClick={() => setShowGrid(g => !g)}
            style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", background: showGrid ? "rgba(79,195,247,0.2)" : "transparent", color: "#aaa", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
          >
            GRID
          </button>
          <button
            data-testid="btn-toggle-labels"
            onClick={() => setShowLabels(l => !l)}
            style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", background: showLabels ? "rgba(79,195,247,0.2)" : "transparent", color: "#aaa", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
          >
            LABELS
          </button>
          <button
            data-testid="btn-toggle-images"
            onClick={() => setShowImages(i => !i)}
            style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", background: showImages ? "rgba(79,195,247,0.2)" : "transparent", color: "#aaa", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
          >
            IMAGES
          </button>
          <button
            data-testid="btn-toggle-slope"
            onClick={() => setShowDepthSlope(d => !d)}
            style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(231,76,60,0.3)", background: showDepthSlope ? "rgba(231,76,60,0.2)" : "transparent", color: showDepthSlope ? "#e74c3c" : "#aaa", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
          >
            SLOPE
          </button>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: "#e74c3c", marginBottom: 4, fontWeight: "bold" }}>DEPTH SLOPE</div>
          <div style={{ fontSize: 8, color: "#778", marginBottom: 4 }}>
            Drag the green (shallow) and red (deep) handles on the map to set the ocean floor angle.
          </div>
          <div style={{ fontSize: 9, color: "#ccc", marginBottom: 2 }}>
            Angle: <span style={{ color: "#e74c3c", fontWeight: "bold" }}>{angleDeg}deg</span>
          </div>
          <div style={{ fontSize: 8, color: "#667" }}>
            Shallow Y: {Math.round(depthSlope.shallowY)} | Deep Y: {Math.round(depthSlope.deepY)}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>NEW AREA:</div>
          <input
            data-testid="input-area-label"
            type="text"
            value={newAreaLabel}
            onChange={e => setNewAreaLabel(e.target.value)}
            style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#ccc", fontSize: 10, fontFamily: "monospace", marginBottom: 4, boxSizing: "border-box" }}
            placeholder="Area name..."
          />
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 6 }}>
            {AREA_PALETTE.map((p, i) => (
              <div
                key={i}
                onClick={() => setNewAreaColor(i)}
                title={p.label}
                style={{
                  width: 18, height: 18, borderRadius: 3, cursor: "pointer",
                  background: p.color.replace(/[\d.]+\)$/, "0.9)"),
                  border: newAreaColor === i ? "2px solid #f1c40f" : "1px solid rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              data-testid="btn-add-area"
              onClick={addArea}
              style={{ flex: 1, padding: "4px", borderRadius: 4, border: "1px solid rgba(100,200,100,0.3)", background: "rgba(100,200,100,0.1)", color: "#6c6", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
            >
              + ADD HERE
            </button>
            <button
              data-testid="btn-add-below"
              onClick={addAreaBelow}
              style={{ flex: 1, padding: "4px", borderRadius: 4, border: "1px solid rgba(100,150,200,0.3)", background: "rgba(100,150,200,0.1)", color: "#6ac", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
            >
              + ADD BELOW
            </button>
          </div>
        </div>

        {sel && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: "#f1c40f", marginBottom: 4 }}>SELECTED: {sel.label}</div>
            <div style={{ fontSize: 8, color: "#778", marginBottom: 4 }}>
              Pos: ({Math.round(sel.x)}, {Math.round(sel.y)}) Size: {Math.round(sel.w)}x{Math.round(sel.h)}
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 8, color: "#aab", minWidth: 40 }}>Z-INDEX</span>
                <input
                  data-testid="input-zindex"
                  type="range"
                  min={1}
                  max={100}
                  value={sel.zIndex || 10}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setAreas(prev => prev.map(a => a.id === sel.id ? { ...a, zIndex: val } : a));
                  }}
                  style={{ flex: 1, height: 12, cursor: "pointer", accentColor: "#f1c40f" }}
                />
                <input
                  data-testid="input-zindex-number"
                  type="number"
                  min={1}
                  max={100}
                  value={sel.zIndex || 10}
                  onChange={e => {
                    const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                    setAreas(prev => prev.map(a => a.id === sel.id ? { ...a, zIndex: val } : a));
                  }}
                  style={{ width: 36, padding: "2px 4px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#f1c40f", fontSize: 10, fontFamily: "monospace", textAlign: "center" }}
                />
              </div>
              <div style={{ fontSize: 7, color: "#556", marginBottom: 4 }}>
                1=back, 5=sand, 10=crab, 15=water/fish, 20=predator, 50=dock, 100=front
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 8, color: "#aab", marginBottom: 3 }}>LAYER FLAGS</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {([
                  { key: "isFish" as const, label: "FISH", color: "#4fc3f7", desc: "Fish spawn here" },
                  { key: "isCrab" as const, label: "CRAB", color: "#ff9040", desc: "Crabs spawn here" },
                  { key: "canSwim" as const, label: "SWIM", color: "#66bb6a", desc: "Player can swim" },
                  { key: "isDock" as const, label: "DOCK", color: "#8d6e63", desc: "Dock surface" },
                  { key: "isSand" as const, label: "SAND", color: "#e4c478", desc: "Beach sand" },
                  { key: "isPredator" as const, label: "PRED", color: "#ef5350", desc: "Predators spawn" },
                ]).map(flag => (
                  <button
                    key={flag.key}
                    data-testid={`btn-flag-${flag.key}`}
                    title={flag.desc}
                    onClick={() => {
                      setAreas(prev => prev.map(a => a.id === sel.id ? { ...a, [flag.key]: !a[flag.key] } : a));
                    }}
                    style={{
                      padding: "2px 5px", borderRadius: 3, fontSize: 8, fontFamily: "monospace", cursor: "pointer",
                      border: `1px solid ${sel[flag.key] ? flag.color : "rgba(255,255,255,0.12)"}`,
                      background: sel[flag.key] ? `${flag.color}33` : "transparent",
                      color: sel[flag.key] ? flag.color : "#667",
                    }}
                  >
                    {flag.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 8, color: "#aab", marginBottom: 3 }}>RENAME</div>
              <input
                data-testid="input-rename-area"
                type="text"
                value={sel.label}
                onChange={e => {
                  setAreas(prev => prev.map(a => a.id === sel.id ? { ...a, label: e.target.value } : a));
                }}
                style={{ width: "100%", padding: "3px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#ccc", fontSize: 9, fontFamily: "monospace", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 4 }}>
              <button
                data-testid="btn-duplicate"
                onClick={duplicateArea}
                style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(79,195,247,0.3)", background: "rgba(79,195,247,0.1)", color: "#4fc3f7", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
              >
                DUPE
              </button>
              <button
                data-testid="btn-delete-area"
                onClick={deleteArea}
                style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,60,60,0.3)", background: "rgba(255,60,60,0.1)", color: "#f66", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
              >
                DELETE
              </button>
            </div>
            <div style={{ fontSize: 8, color: "#556" }}>
              Drag handles to resize. Drag center to move.
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>AREAS ({areas.length}):</div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {[...areas].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(a => (
              <div
                key={a.id}
                onClick={() => setSelectedArea(a.id)}
                style={{
                  padding: "3px 6px", marginBottom: 2, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  background: selectedArea === a.id ? "rgba(241,196,15,0.15)" : "transparent",
                  border: selectedArea === a.id ? "1px solid rgba(241,196,15,0.3)" : "1px solid transparent",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 2, background: a.color.replace(/[\d.]+\)$/, "0.8)"), flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: selectedArea === a.id ? "#f1c40f" : "#aaa", flex: 1 }}>{a.label}</span>
                <span style={{ fontSize: 7, color: "#667", fontFamily: "monospace", flexShrink: 0 }}>z{a.zIndex || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button
            data-testid="btn-save"
            onClick={handleSave}
            style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(46,204,113,0.5)", background: "rgba(46,204,113,0.15)", color: "#2ecc71", fontSize: 10, fontFamily: "monospace", cursor: "pointer", fontWeight: "bold" }}
          >
            SAVE MAP
          </button>
          <button
            data-testid="btn-load"
            onClick={handleLoad}
            style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(79,195,247,0.4)", background: "rgba(79,195,247,0.1)", color: "#4fc3f7", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}
          >
            LOAD
          </button>
        </div>
        {saveStatus && (
          <div style={{ fontSize: 10, color: "#2ecc71", textAlign: "center", marginTop: 4, fontWeight: "bold" }}>
            {saveStatus}
          </div>
        )}

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          <button
            data-testid="btn-reset"
            onClick={() => { setAreas(DEFAULT_AREAS); setDepthSlope(DEFAULT_DEPTH_SLOPE); setSelectedArea(null); }}
            style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,60,60,0.3)", background: "rgba(255,60,60,0.1)", color: "#f66", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
          >
            RESET
          </button>
          <button
            data-testid="btn-export"
            onClick={exportData}
            style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(100,200,100,0.3)", background: "rgba(100,200,100,0.1)", color: "#6c6", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}
          >
            EXPORT JSON
          </button>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 9, color: "#e040fb", marginBottom: 4, fontWeight: "bold" }}>AI SURFACE GEN</div>
          <div style={{ fontSize: 7, color: "#556", marginBottom: 4 }}>
            Generate underwater background layer images using AI.
          </div>
          <button
            data-testid="btn-generate-surface"
            disabled={surfaceGenerating}
            onClick={async () => {
              setSurfaceGenerating(true);
              setSurfaceResult(null);
              try {
                const resp = await fetch("/api/generate-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    prompt: "Pixel art underwater ocean background layer for a 2D fishing game. Seamless horizontal tileable pattern. Deep blue ocean gradient with coral reef silhouettes, kelp forests, and scattered light rays. 16-bit pixel art style, moody atmosphere, side-scrolling game perspective.",
                    size: "1024x1024",
                  }),
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || "Failed");
                const url = data.b64_json ? `data:image/png;base64,${data.b64_json}` : data.url;
                setSurfaceResult(url || null);
              } catch (err: any) {
                setSurfaceResult("ERROR: " + (err.message || "Failed"));
              } finally {
                setSurfaceGenerating(false);
              }
            }}
            style={{
              width: "100%", padding: "5px 8px", borderRadius: 4,
              border: "1px solid rgba(224,64,251,0.4)", background: "rgba(224,64,251,0.12)",
              color: "#e040fb", fontSize: 10, fontFamily: "monospace", cursor: surfaceGenerating ? "wait" : "pointer",
              fontWeight: "bold", opacity: surfaceGenerating ? 0.5 : 1,
            }}
          >
            {surfaceGenerating ? "GENERATING..." : "GENERATE SURFACE"}
          </button>
          {surfaceResult && !surfaceResult.startsWith("ERROR") && (
            <div style={{ marginTop: 4 }}>
              <img src={surfaceResult} alt="Generated surface" style={{ width: "100%", borderRadius: 4, border: "1px solid rgba(224,64,251,0.2)" }} />
              <a
                href={surfaceResult}
                download="underwater_surface_generated.png"
                data-testid="link-download-surface"
                style={{ display: "block", textAlign: "center", marginTop: 2, fontSize: 8, color: "#2ecc71", textDecoration: "underline" }}
              >
                DOWNLOAD
              </a>
            </div>
          )}
          {surfaceResult && surfaceResult.startsWith("ERROR") && (
            <div style={{ fontSize: 8, color: "#e74c3c", marginTop: 4 }}>{surfaceResult}</div>
          )}
        </div>

        <div style={{ fontSize: 8, color: "#445", marginTop: 6 }}>
          Zoom: {(zoom * 100).toFixed(0)}% | Ref W={REF_W} H={REF_H}
        </div>
        <div style={{ fontSize: 7, color: "#334", marginTop: 2 }}>
          Coords match game at 1280x720. Pier Y={Math.round(PIER_Y)} Water Y={Math.round(WATER_Y)}
        </div>
      </div>

      <a
        href="/game"
        data-testid="link-back-game"
        style={{
          position: "absolute", bottom: 10, right: 10,
          padding: "6px 14px", borderRadius: 6,
          background: "rgba(79,195,247,0.15)", border: "1px solid rgba(79,195,247,0.3)",
          color: "#4fc3f7", fontSize: 10, fontFamily: "monospace",
          textDecoration: "none", letterSpacing: 1,
        }}
      >
        BACK TO GAME
      </a>
    </div>
  );
}
