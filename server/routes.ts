import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "@shared/schema";

const RARITY_COLORS: Record<string, number> = {
  common: 0xa0a0a0,
  uncommon: 0x4caf50,
  rare: 0x2196f3,
  legendary: 0xff9800,
  ultra_rare: 0xe040fb,
};

async function sendDiscordCatch(data: {
  fishName: string;
  weight: number;
  length: number;
  rarity: string;
  username: string;
  earnings: number;
  icon: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_FISH;
  if (!webhookUrl) return;

  const baseUrl = "https://ocean-angler-grudge.replit.app";
  const color = RARITY_COLORS[data.rarity] ?? 0x607d8b;
  const stars = data.rarity === "ultra_rare" ? 5 : data.rarity === "legendary" ? 4 : data.rarity === "rare" ? 3 : data.rarity === "uncommon" ? 2 : 1;
  const starStr = Array(stars).fill("\u2B50").join("");

  const embed = {
    title: `${data.fishName} Caught!`,
    color,
    thumbnail: { url: `${baseUrl}${data.icon}` },
    fields: [
      { name: "Angler", value: data.username || "Anonymous", inline: true },
      { name: "Rarity", value: `${data.rarity.replace("_", " ").toUpperCase()} ${starStr}`, inline: true },
      { name: "Weight", value: `${data.weight} lbs`, inline: true },
      { name: "Length", value: `${data.length}"`, inline: true },
      { name: "Earnings", value: `${data.earnings} gbux`, inline: true },
    ],
    footer: { text: "Grudge Angeler", icon_url: `${baseUrl}/assets/grudge_logo.png` },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {}
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const VALID_CATEGORIES = ["biggest_catch", "session_catches", "legendary_catches"];

  app.get("/api/leaderboard/:category", async (req, res) => {
    try {
      const { category } = req.params;
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const entries = await storage.getLeaderboard(category, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", async (req, res) => {
    try {
      const parsed = insertLeaderboardSchema.parse(req.body);
      if (!VALID_CATEGORIES.includes(parsed.category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      const entry = await storage.submitLeaderboardEntry(parsed);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid leaderboard entry" });
    }
  });

  app.post("/api/discord-catch", async (req, res) => {
    try {
      const { fishName, weight, length, rarity, username, earnings, icon } = req.body;
      if (!fishName || weight === undefined || !rarity) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      sendDiscordCatch({
        fishName,
        weight: Number(weight),
        length: Number(length) || 0,
        rarity,
        username: username || "Anonymous",
        earnings: Number(earnings) || 0,
        icon: icon || "",
      });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Failed to send discord notification" });
    }
  });

  return httpServer;
}
