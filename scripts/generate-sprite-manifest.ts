import fs from "fs";
import path from "path";

const assetsRoot = path.resolve("client", "public", "assets");
const outFile = path.resolve("client", "public", "data", "creature-sprites.json");

interface SpriteEntry {
  folder: string;
  hasIdle: boolean;
  hasWalk: boolean;
  hasFrames: boolean;
  category: string;
  spritePath: string;
}

function scanDir(dir: string, category: string, pathPrefix: string): SpriteEntry[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== "PSD" && d.name !== "frames")
    .map(d => {
      const folderPath = path.join(dir, d.name);
      const files = fs.readdirSync(folderPath);
      return {
        folder: d.name,
        hasIdle: files.includes("Idle.png"),
        hasWalk: files.includes("Walk.png"),
        hasFrames: fs.existsSync(path.join(folderPath, "frames")),
        category,
        spritePath: `${pathPrefix}/${d.name}`,
      };
    });
}

const creatures = scanDir(path.join(assetsRoot, "creatures"), "creature", "/assets/creatures");
const predators = scanDir(path.join(assetsRoot, "predators"), "predator", "/assets/predators");
const npcs = scanDir(path.join(assetsRoot, "npcs"), "npc", "/assets/npcs");

const guardianDir = path.join(assetsRoot, "guardian");
const guardianEntries: SpriteEntry[] = [];
if (fs.existsSync(guardianDir)) {
  const gFiles = fs.readdirSync(guardianDir);
  guardianEntries.push({
    folder: "guardian",
    hasIdle: gFiles.includes("Idle.png"),
    hasWalk: gFiles.includes("Walk.png"),
    hasFrames: false,
    category: "guardian",
    spritePath: "/assets/guardian",
  });
}

const all = [...creatures, ...predators, ...guardianEntries, ...npcs]
  .filter(s => s.hasIdle || s.hasWalk)
  .sort((a, b) => {
    const catOrder: Record<string, number> = { creature: 0, predator: 1, guardian: 2, npc: 3 };
    const ca = catOrder[a.category] ?? 9;
    const cb = catOrder[b.category] ?? 9;
    if (ca !== cb) return ca - cb;
    return a.folder.localeCompare(b.folder);
  });

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(all, null, 2));
console.log(`Generated sprite manifest: ${all.length} entries → ${outFile}`);
