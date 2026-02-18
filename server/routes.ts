import type { Express, Request, Response, CookieOptions } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "@shared/schema";
import { registerImageRoutes } from "./replit_integrations/image/routes";
import fs from "fs";
import path from "path";

const RARITY_COLORS: Record<string, number> = {
  common: 0xa0a0a0,
  uncommon: 0x4caf50,
  rare: 0x2196f3,
  legendary: 0xff9800,
  ultra_rare: 0xe040fb,
};

const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
  ultra_rare: "ULTRA RARE",
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
  const rarityLabel = RARITY_LABELS[data.rarity] || data.rarity.replace("_", " ").toUpperCase();

  const iconUrl = data.icon
    ? `${baseUrl}${data.icon}`
    : `${baseUrl}/assets/grudge_logo.png`;

  const embed: any = {
    title: `\uD83C\uDFA3 ${data.fishName} Caught!`,
    description: `**${data.username || "Anonymous"}** reeled in a **${data.fishName}**!`,
    color,
    thumbnail: { url: iconUrl },
    fields: [
      { name: "Rarity", value: `${rarityLabel} ${starStr}`, inline: true },
      { name: "Weight", value: `${data.weight} lbs`, inline: true },
      { name: "Length", value: `${data.length}"`, inline: true },
      { name: "Earnings", value: `${data.earnings} gbux`, inline: true },
    ],
    footer: { text: "Grudge Angeler \u2022 ocean-angler-grudge.replit.app", icon_url: `${baseUrl}/assets/grudge_logo.png` },
    timestamp: new Date().toISOString(),
  };

  if (data.rarity === "ultra_rare" || data.rarity === "legendary") {
    embed.image = { url: iconUrl };
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Grudge Angeler",
        avatar_url: `${baseUrl}/assets/grudge_logo.png`,
        embeds: [embed],
      }),
    });
    if (!resp.ok) {
      console.error(`Discord webhook failed: ${resp.status} ${resp.statusText}`);
    }
  } catch (err) {
    console.error("Discord webhook error:", err);
  }
}

async function getDiscordTokens(code: string, redirectUri: string) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Discord OAuth not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const resp = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Discord token exchange failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

async function getDiscordUser(accessToken: string) {
  const resp = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error("Failed to fetch Discord user");
  return resp.json();
}

const sessions = new Map<string, { discordId: string; username: string; avatar: string | null; discriminator: string; accessToken: string; expiresAt: number }>();
const oauthStates = new Map<string, number>();

function generateRandomId(len = 48) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

setInterval(() => {
  const now = Date.now();
  const stateKeys = Array.from(oauthStates.keys());
  for (const key of stateKeys) {
    if (now > (oauthStates.get(key) || 0)) oauthStates.delete(key);
  }
  const sessionKeys = Array.from(sessions.keys());
  for (const key of sessionKeys) {
    const s = sessions.get(key);
    if (s && now > s.expiresAt) sessions.delete(key);
  }
}, 60000);

function getBaseUrl(req: Request) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "ocean-angler-grudge.replit.app";
  return `${proto}://${host}`;
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

  app.get("/api/auth/discord", (req: Request, res: Response) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: "Discord OAuth not configured" });
    }
    const base = getBaseUrl(req);
    const redirectUri = `${base}/api/auth/discord/callback`;
    const state = generateRandomId(32);
    oauthStates.set(state, Date.now() + 600000);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify",
      state,
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  });

  app.get("/api/auth/discord/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      if (!code || !state) {
        return res.redirect("/game?auth_error=no_code");
      }
      const stateExpiry = oauthStates.get(state);
      if (!stateExpiry || Date.now() > stateExpiry) {
        oauthStates.delete(state);
        return res.redirect("/game?auth_error=invalid_state");
      }
      oauthStates.delete(state);

      const base = getBaseUrl(req);
      const redirectUri = `${base}/api/auth/discord/callback`;

      const tokens = await getDiscordTokens(code, redirectUri);
      const user = await getDiscordUser(tokens.access_token);

      const sessionId = generateRandomId();
      sessions.set(sessionId, {
        discordId: user.id,
        username: user.global_name || user.username,
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
        discriminator: user.discriminator || "0",
        accessToken: tokens.access_token,
        expiresAt: Date.now() + (tokens.expires_in || 604800) * 1000,
      });

      res.cookie("ga_session", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: (tokens.expires_in || 604800) * 1000,
        path: "/",
      });

      res.redirect("/game?auth=success");
    } catch (err) {
      console.error("Discord OAuth callback error:", err);
      res.redirect("/game?auth_error=callback_failed");
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const sessionId = req.cookies?.ga_session;
    if (!sessionId) {
      return res.json({ authenticated: false });
    }
    const session = sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      if (session) sessions.delete(sessionId);
      return res.json({ authenticated: false });
    }
    res.json({
      authenticated: true,
      user: {
        discordId: session.discordId,
        username: session.username,
        avatar: session.avatar,
      },
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const sessionId = req.cookies?.ga_session;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.clearCookie("ga_session", { path: "/" });
    res.json({ ok: true });
  });

  app.get("/api/creature-sprites", (_req: Request, res: Response) => {
    try {
      const assetsRoot = path.join(process.cwd(), "client", "public", "assets");

      function scanDir(dir: string, category: string, pathPrefix: string) {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir, { withFileTypes: true })
          .filter(d => d.isDirectory() && d.name !== "PSD" && d.name !== "frames")
          .map(d => {
            const folderPath = path.join(dir, d.name);
            const files = fs.readdirSync(folderPath);
            const hasIdle = files.includes("Idle.png");
            const hasWalk = files.includes("Walk.png");
            const hasFrames = fs.existsSync(path.join(folderPath, "frames"));
            return {
              folder: d.name,
              hasIdle,
              hasWalk,
              hasFrames,
              category,
              spritePath: `${pathPrefix}/${d.name}`,
            };
          });
      }

      const creatures = scanDir(path.join(assetsRoot, "creatures"), "creature", "/assets/creatures");
      const predators = scanDir(path.join(assetsRoot, "predators"), "predator", "/assets/predators");
      const npcs = scanDir(path.join(assetsRoot, "npcs"), "npc", "/assets/npcs");
      const guardianDir = path.join(assetsRoot, "guardian");
      const guardianEntries: any[] = [];
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
      res.json(all);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  function getTournamentDateCST(): string {
    const now = new Date();
    const cstOffset = -6 * 60;
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const cstDate = new Date(utcMs + cstOffset * 60000);
    return cstDate.toISOString().split("T")[0];
  }

  function isTournamentActive(): { active: boolean; startsIn?: number; endsIn?: number; date: string } {
    const now = new Date();
    const cstOffset = -6 * 60;
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const cstNow = new Date(utcMs + cstOffset * 60000);
    const dateStr = cstNow.toISOString().split("T")[0];
    const hours = cstNow.getHours();
    const minutes = cstNow.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const startMinutes = 18 * 60;
    const endMinutes = 20 * 60;

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return { active: true, endsIn: (endMinutes - currentMinutes) * 60, date: dateStr };
    } else if (currentMinutes < startMinutes) {
      return { active: false, startsIn: (startMinutes - currentMinutes) * 60, date: dateStr };
    } else {
      const tomorrow = new Date(cstNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      const minutesUntilMidnight = 24 * 60 - currentMinutes;
      return { active: false, startsIn: (minutesUntilMidnight + startMinutes) * 60, date: tomorrowStr };
    }
  }

  app.get("/api/tournament/status", (_req, res) => {
    const status = isTournamentActive();
    res.json(status);
  });

  app.get("/api/tournament/results", async (req, res) => {
    try {
      const dateParam = (req.query.date as string) || getTournamentDateCST();
      const results = await storage.getTournamentResults(dateParam, 50);
      res.json(results);
    } catch {
      res.status(500).json({ message: "Failed to get tournament results" });
    }
  });

  app.post("/api/tournament/submit", async (req, res) => {
    try {
      const status = isTournamentActive();
      if (!status.active) {
        return res.status(400).json({ message: "Tournament is not currently active", status });
      }

      const { playerName, totalCaught, totalWeight, largestCatch, largestFishName, rarityScore, compositeScore } = req.body;
      if (!playerName || compositeScore === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const entry = await storage.submitTournamentEntry({
        playerName,
        tournamentDate: status.date,
        totalCaught: Number(totalCaught) || 0,
        totalWeight: Number(totalWeight) || 0,
        largestCatch: Number(largestCatch) || 0,
        largestFishName: largestFishName || null,
        rarityScore: Number(rarityScore) || 0,
        compositeScore: Number(compositeScore) || 0,
        reward: 0,
      });

      const results = await storage.getTournamentResults(status.date, 50);
      const rank = results.findIndex(r => r.playerName === playerName) + 1;

      sendTournamentWebhook(playerName, Number(compositeScore), rank, results.length, status.date, {
        totalCaught: Number(totalCaught) || 0,
        totalWeight: Number(totalWeight) || 0,
        largestCatch: Number(largestCatch) || 0,
        largestFishName: largestFishName || "",
        rarityScore: Number(rarityScore) || 0,
      });

      res.json({ entry, rank, totalParticipants: results.length });
    } catch (err) {
      console.error("Tournament submit error:", err);
      res.status(500).json({ message: "Failed to submit tournament score" });
    }
  });

  const tourneyWebhookUrl = () => process.env.DISCORD_WEBHOOK_URL_TOURNEY;

  async function sendTournamentWebhook(playerName: string, score: number, rank: number, totalPlayers: number, date: string, stats: { totalCaught: number; totalWeight: number; largestCatch: number; largestFishName: string; rarityScore: number }) {
    const webhookUrl = tourneyWebhookUrl();
    if (!webhookUrl) return;

    const prizePool = 10000;
    const rewards = [0.35, 0.20, 0.15, 0.10, 0.08, 0.05, 0.04, 0.02, 0.005, 0.005];
    const rewardPct = rank <= rewards.length ? rewards[rank - 1] : 0;
    const estimatedReward = Math.floor(prizePool * rewardPct);

    const medalEmoji = rank === 1 ? "\uD83E\uDD47" : rank === 2 ? "\uD83E\uDD48" : rank === 3 ? "\uD83E\uDD49" : "\uD83C\uDFA3";

    const embed: any = {
      title: `${medalEmoji} Tournament Score Submitted!`,
      description: `**${playerName}** posted a tournament score of **${Math.floor(score)}** points!`,
      color: rank <= 3 ? 0xffd700 : 0xe040fb,
      fields: [
        { name: "Rank", value: `#${rank} / ${totalPlayers}`, inline: true },
        { name: "Fish Caught", value: `${stats.totalCaught}`, inline: true },
        { name: "Total Weight", value: `${stats.totalWeight.toFixed(1)} lbs`, inline: true },
        { name: "Largest Catch", value: `${stats.largestCatch.toFixed(1)} lbs${stats.largestFishName ? ` (${stats.largestFishName})` : ""}`, inline: true },
        { name: "Rarity Score", value: `${stats.rarityScore}`, inline: true },
        { name: "Est. Reward", value: `${estimatedReward} gbux`, inline: true },
      ],
      footer: { text: `Daily Tournament ${date} \u2022 6-8 PM CST \u2022 10,000 gbux Prize Pool`, icon_url: `${baseUrl}/assets/grudge_logo.png` },
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Grudge Tournament",
          avatar_url: `${baseUrl}/assets/grudge_logo.png`,
          embeds: [embed],
        }),
      });
    } catch (err) {
      console.error("Tournament webhook error:", err);
    }
  }

  async function sendTournamentStartAnnouncement(date: string) {
    const webhookUrl = tourneyWebhookUrl();
    if (!webhookUrl) return;

    const embed: any = {
      title: "\uD83C\uDFC6 DAILY TOURNAMENT IS LIVE!",
      description: "**The fishing tournament has begun!** Cast your lines, reel in the biggest catches, and climb the leaderboard for a share of the **10,000 GBUX** prize pool!\n\n\u23F0 **Window:** 6:00 PM \u2013 8:00 PM CST\n\uD83C\uDFA3 **Format:** Best 20-minute catch cycle\n\uD83D\uDCB0 **Prize Pool:** 10,000 GBUX",
      color: 0xe040fb,
      fields: [
        { name: "\uD83E\uDD47 1st Place", value: "3,500 gbux", inline: true },
        { name: "\uD83E\uDD48 2nd Place", value: "2,000 gbux", inline: true },
        { name: "\uD83E\uDD49 3rd Place", value: "1,500 gbux", inline: true },
        { name: "4th", value: "1,000", inline: true },
        { name: "5th", value: "800", inline: true },
        { name: "6th", value: "500", inline: true },
        { name: "\uD83D\uDCCA Scoring", value: "Catches \u00D7 10 + Weight \u00D7 5 + Largest \u00D7 20 + Rarity \u00D7 15", inline: false },
      ],
      image: { url: `${baseUrl}/assets/grudge_logo.png` },
      footer: { text: `Grudge Angeler \u2022 ${date} \u2022 Play at ocean-angler-grudge.replit.app`, icon_url: `${baseUrl}/assets/grudge_logo.png` },
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Grudge Tournament",
          avatar_url: `${baseUrl}/assets/grudge_logo.png`,
          content: "@everyone \uD83C\uDFC6 **Daily Tournament is NOW LIVE!** Jump in and compete for 10,000 GBUX!",
          embeds: [embed],
        }),
      });
    } catch (err) {
      console.error("Tournament start webhook error:", err);
    }
  }

  async function sendTournamentEndAnnouncement(date: string) {
    const webhookUrl = tourneyWebhookUrl();
    if (!webhookUrl) return;

    try {
      const results = await storage.getTournamentResults(date, 10);
      if (results.length === 0) return;

      const prizes = [3500, 2000, 1500, 1000, 800, 500, 400, 200, 50, 50];
      const medalEmojis = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3", "7\uFE0F\u20E3", "8\uFE0F\u20E3", "9\uFE0F\u20E3", "\uD83D\uDD1F"];

      let standings = "";
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const medal = i < medalEmojis.length ? medalEmojis[i] : `${i + 1}.`;
        const prize = i < prizes.length ? prizes[i] : 0;
        standings += `${medal} **${r.playerName}** \u2014 ${Math.floor(Number(r.compositeScore))} pts | ${r.totalCaught} fish | ${Number(r.totalWeight).toFixed(1)} lbs | +${prize} gbux\n`;
      }

      const winner = results[0];
      const embed: any = {
        title: "\uD83C\uDFC6 TOURNAMENT RESULTS",
        description: `The daily tournament has ended! **${winner.playerName}** takes the crown with **${Math.floor(Number(winner.compositeScore))}** points!\n\n${standings}`,
        color: 0xffd700,
        fields: [
          { name: "Total Participants", value: `${results.length}`, inline: true },
          { name: "Prize Pool", value: "10,000 gbux", inline: true },
          { name: "Next Tournament", value: "Tomorrow 6-8 PM CST", inline: true },
        ],
        footer: { text: `Grudge Angeler \u2022 ${date} \u2022 See you tomorrow!`, icon_url: `${baseUrl}/assets/grudge_logo.png` },
        timestamp: new Date().toISOString(),
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Grudge Tournament",
          avatar_url: `${baseUrl}/assets/grudge_logo.png`,
          content: "\uD83C\uDFC6 **Daily Tournament has ENDED!** Here are the final standings:",
          embeds: [embed],
        }),
      });
    } catch (err) {
      console.error("Tournament end webhook error:", err);
    }
  }

  let lastTournamentState = false;
  let lastTournamentDate = "";
  setInterval(() => {
    const status = isTournamentActive();
    if (status.active && !lastTournamentState) {
      sendTournamentStartAnnouncement(status.date);
    }
    if (!status.active && lastTournamentState && lastTournamentDate) {
      sendTournamentEndAnnouncement(lastTournamentDate);
    }
    lastTournamentState = status.active;
    lastTournamentDate = status.date;
  }, 30000);

  registerImageRoutes(app);

  return httpServer;
}
