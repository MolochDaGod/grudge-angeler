import { useState, useRef, useEffect, useCallback } from "react";

const REF_W = 1280;
const WORLD_LEFT = -(REF_W * 3) - 200;
const WORLD_RIGHT = REF_W * 5 + 200;
const WORLD_WIDTH = WORLD_RIGHT - WORLD_LEFT;
const WORLD_HEIGHT = 2400;
const WATER_Y = WORLD_HEIGHT * 0.38;

const ZONE_COLORS: Record<string, { color: string; label: string }> = {
  sand: { color: "rgba(228,196,120,0.45)", label: "Sand / Beach" },
  shallow: { color: "rgba(100,181,246,0.40)", label: "Shallow Water" },
  pier: { color: "rgba(141,110,99,0.50)", label: "Pier / Dock" },
  mid: { color: "rgba(30,100,180,0.45)", label: "Mid Water" },
  deep: { color: "rgba(15,50,120,0.50)", label: "Deep Water" },
  abyss: { color: "rgba(8,15,40,0.60)", label: "Abyss" },
  sky: { color: "rgba(135,206,235,0.30)", label: "Sky" },
  restricted: { color: "rgba(255,60,60,0.40)", label: "No Fish Zone" },
  predator: { color: "rgba(200,30,30,0.35)", label: "Predator Zone" },
  legendary: { color: "rgba(255,215,0,0.35)", label: "Legendary Spawn" },
  crab: { color: "rgba(255,140,60,0.40)", label: "Crab Area" },
  boat: { color: "rgba(100,200,100,0.35)", label: "Boat Access" },
  erase: { color: "rgba(0,0,0,0)", label: "Eraser" },
};

interface PaintStroke {
  x: number;
  y: number;
  w: number;
  h: number;
  zone: string;
}

export default function AdminMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedZone, setSelectedZone] = useState("sand");
  const [brushSize, setBrushSize] = useState(80);
  const [strokes, setStrokes] = useState<PaintStroke[]>([]);
  const [isPainting, setIsPainting] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.12);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const worldToScreen = useCallback((wx: number, wy: number) => {
    return {
      x: (wx - WORLD_LEFT) * zoom + panOffset.x,
      y: wy * zoom + panOffset.y,
    };
  }, [zoom, panOffset]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - panOffset.x) / zoom + WORLD_LEFT,
      y: (sy - panOffset.y) / zoom,
    };
  }, [zoom, panOffset]);

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

    const skyGrad = ctx.createLinearGradient(tl.x, tl.y, tl.x, tl.y + (WATER_Y * zoom));
    skyGrad.addColorStop(0, "#1a2a4a");
    skyGrad.addColorStop(1, "#2a4a6a");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(tl.x, tl.y, worldScreenW, WATER_Y * zoom);

    const waterGrad = ctx.createLinearGradient(tl.x, tl.y + WATER_Y * zoom, tl.x, br.y);
    waterGrad.addColorStop(0, "#1a5a8a");
    waterGrad.addColorStop(0.3, "#0d3a6a");
    waterGrad.addColorStop(0.7, "#061a3a");
    waterGrad.addColorStop(1, "#030a1a");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(tl.x, tl.y + WATER_Y * zoom, worldScreenW, worldScreenH - WATER_Y * zoom);

    const beachLeft = WORLD_RIGHT - REF_W * 2.5;
    const beachScreen = worldToScreen(beachLeft, WATER_Y - 60);
    const beachEndScreen = worldToScreen(WORLD_RIGHT, WATER_Y + 200);
    const sandGrad = ctx.createLinearGradient(beachScreen.x, beachScreen.y, beachScreen.x, beachEndScreen.y);
    sandGrad.addColorStop(0, "rgba(228,196,120,0.6)");
    sandGrad.addColorStop(1, "rgba(194,154,80,0.3)");
    ctx.fillStyle = sandGrad;
    ctx.fillRect(beachScreen.x, beachScreen.y, beachEndScreen.x - beachScreen.x, beachEndScreen.y - beachScreen.y);

    for (const stroke of strokesRef.current) {
      if (stroke.zone === "erase") continue;
      const zoneInfo = ZONE_COLORS[stroke.zone];
      if (!zoneInfo) continue;
      const sp = worldToScreen(stroke.x, stroke.y);
      ctx.fillStyle = zoneInfo.color;
      ctx.fillRect(sp.x, sp.y, stroke.w * zoom, stroke.h * zoom);
    }

    ctx.strokeStyle = "rgba(79,195,247,0.6)";
    ctx.lineWidth = 2;
    const wlScreen = worldToScreen(WORLD_LEFT, WATER_Y);
    const wrScreen = worldToScreen(WORLD_RIGHT, WATER_Y);
    ctx.beginPath();
    ctx.moveTo(wlScreen.x, wlScreen.y);
    ctx.lineTo(wrScreen.x, wrScreen.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    const zoneMarkers = [
      { x: 0, label: "Zone 2 Right (x=0)", color: "#64b5f6" },
      { x: -REF_W, label: "Zone 3 Start (x=-W)", color: "#42a5f5" },
      { x: -(REF_W * 3) - 200, label: "Zone 4 / Abyss Start (x=-3W-200)", color: "#7c4dff" },
      { x: REF_W * 0.85, label: "Shop Area", color: "#66bb6a" },
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
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(m.label, ms.x, tl.y + 16);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "9px monospace";
        ctx.fillText(`x=${Math.round(m.x)}`, ms.x, tl.y + 28);
      }
    }
    ctx.setLineDash([]);

    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      const gridStep = REF_W * 0.5;
      for (let gx = Math.ceil(WORLD_LEFT / gridStep) * gridStep; gx <= WORLD_RIGHT; gx += gridStep) {
        const gs = worldToScreen(gx, 0);
        ctx.beginPath();
        ctx.moveTo(gs.x, tl.y);
        ctx.lineTo(gs.x, br.y);
        ctx.stroke();
      }
      for (let gy = 0; gy <= WORLD_HEIGHT; gy += gridStep) {
        const gs = worldToScreen(WORLD_LEFT, gy);
        ctx.beginPath();
        ctx.moveTo(tl.x, gs.y);
        ctx.lineTo(br.x, gs.y);
        ctx.stroke();
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
        const zs1 = worldToScreen(z.x1, WATER_Y + 30);
        const zs2 = worldToScreen(z.x2, WATER_Y + 30);
        const cx = (zs1.x + zs2.x) / 2;
        ctx.fillStyle = z.color;
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(z.label, cx, zs1.y);
        ctx.fillStyle = z.color + "40";
        ctx.fillRect(zs1.x, tl.y, zs2.x - zs1.x, br.y - tl.y);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(tl.x, tl.y, worldScreenW, worldScreenH);

  }, [worldToScreen, zoom, showGrid, showLabels]);

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

  useEffect(() => { draw(); }, [draw, strokes, panOffset, zoom, showGrid, showLabels]);

  useEffect(() => {
    setPanOffset({
      x: window.innerWidth * 0.5 - (WORLD_WIDTH * 0.5) * zoom,
      y: 40,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
      return;
    }
    setIsPainting(true);
    paint(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      });
      return;
    }
    if (isPainting) {
      paint(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsPainting(false);
    setIsPanning(false);
  };

  const paint = (sx: number, sy: number) => {
    const world = screenToWorld(sx, sy);
    const halfBrush = brushSize / 2;
    if (selectedZone === "erase") {
      setStrokes(prev => prev.filter(s => {
        const overlapX = s.x < world.x + halfBrush && s.x + s.w > world.x - halfBrush;
        const overlapY = s.y < world.y + halfBrush && s.y + s.h > world.y - halfBrush;
        return !(overlapX && overlapY);
      }));
    } else {
      setStrokes(prev => [...prev, {
        x: world.x - halfBrush,
        y: world.y - halfBrush,
        w: brushSize,
        h: brushSize,
        zone: selectedZone,
      }]);
    }
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

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const exportData = () => {
    const data = JSON.stringify(strokes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-map-zones.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0e1a", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ cursor: isPanning ? "grabbing" : isPainting ? "crosshair" : "crosshair", display: "block" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      <div style={{
        position: "absolute", top: 10, left: 10, background: "rgba(10,14,26,0.95)",
        border: "1px solid rgba(79,195,247,0.2)", borderRadius: 8, padding: 12,
        color: "#ccc", fontFamily: "monospace", fontSize: 11, maxWidth: 220,
        maxHeight: "calc(100vh - 20px)", overflowY: "auto",
      }}>
        <div style={{ fontSize: 14, fontWeight: "bold", color: "#4fc3f7", marginBottom: 10, letterSpacing: 2 }}>
          ADMIN MAP
        </div>
        <div style={{ fontSize: 9, color: "#667", marginBottom: 10 }}>
          Click to paint zones. Shift+drag or right-click to pan. Scroll to zoom.
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>BRUSH SIZE: {brushSize}px</div>
          <input
            type="range" min={20} max={400} value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ fontSize: 9, color: "#889", marginBottom: 4 }}>ZONE TYPE:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
          {Object.entries(ZONE_COLORS).map(([key, val]) => (
            <button
              key={key}
              data-testid={`zone-btn-${key}`}
              onClick={() => setSelectedZone(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 8px", borderRadius: 4, border: "none",
                background: selectedZone === key ? "rgba(79,195,247,0.2)" : "transparent",
                outline: selectedZone === key ? "1px solid rgba(79,195,247,0.5)" : "none",
                cursor: "pointer", textAlign: "left", color: "#ccc",
                fontSize: 10, fontFamily: "monospace",
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                background: key === "erase"
                  ? "repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 50% / 6px 6px"
                  : val.color.replace(/[\d.]+\)$/, "0.9)"),
                border: "1px solid rgba(255,255,255,0.15)",
              }} />
              {val.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          <button
            data-testid="btn-toggle-grid"
            onClick={() => setShowGrid(g => !g)}
            style={{
              padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)",
              background: showGrid ? "rgba(79,195,247,0.2)" : "transparent",
              color: "#aaa", fontSize: 9, fontFamily: "monospace", cursor: "pointer",
            }}
          >
            {showGrid ? "GRID ON" : "GRID OFF"}
          </button>
          <button
            data-testid="btn-toggle-labels"
            onClick={() => setShowLabels(l => !l)}
            style={{
              padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)",
              background: showLabels ? "rgba(79,195,247,0.2)" : "transparent",
              color: "#aaa", fontSize: 9, fontFamily: "monospace", cursor: "pointer",
            }}
          >
            {showLabels ? "LABELS ON" : "LABELS OFF"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          <button
            data-testid="btn-clear"
            onClick={() => setStrokes([])}
            style={{
              padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,60,60,0.3)",
              background: "rgba(255,60,60,0.1)", color: "#f66",
              fontSize: 9, fontFamily: "monospace", cursor: "pointer",
            }}
          >
            CLEAR ALL
          </button>
          <button
            data-testid="btn-undo"
            onClick={() => setStrokes(prev => prev.slice(0, -1))}
            style={{
              padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent", color: "#aaa",
              fontSize: 9, fontFamily: "monospace", cursor: "pointer",
            }}
          >
            UNDO
          </button>
          <button
            data-testid="btn-export"
            onClick={exportData}
            style={{
              padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(100,200,100,0.3)",
              background: "rgba(100,200,100,0.1)", color: "#6c6",
              fontSize: 9, fontFamily: "monospace", cursor: "pointer",
            }}
          >
            EXPORT
          </button>
        </div>

        <div style={{ fontSize: 9, color: "#556", marginTop: 6 }}>
          Zoom: {(zoom * 100).toFixed(0)}% | Strokes: {strokes.length}
        </div>
        <div style={{ fontSize: 8, color: "#445", marginTop: 4 }}>
          World: {WORLD_WIDTH.toFixed(0)}x{WORLD_HEIGHT} | Ref W={REF_W}
        </div>
      </div>

      <a
        href="/game"
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
