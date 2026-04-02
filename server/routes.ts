import type { Express, Request, Response, CookieOptions } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "@shared/schema";

const baseUrl = process.env.BASE_URL || "https://grudge-angeler.vercel.app";
const playUrl = process.env.PLAY_URL || "https://grudge-angeler.vercel.app/game";

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
  if (!webhookUrl) {
    console.log("[Discord Fish] No DISCORD_WEBHOOK_URL_FISH set, skipping webhook");
    return;
  }

  const color = RARITY_COLORS[data.rarity] ?? 0x607d8b;
  const stars = data.rarity === "ultra_rare" ? 5 : data.rarity === "legendary" ? 4 : data.rarity === "rare" ? 3 : data.rarity === "uncommon" ? 2 : 1;
  const starStr = Array(stars).fill("\u2B50").join("");
  const rarityLabel = RARITY_LABELS[data.rarity] || data.rarity.replace("_", " ").toUpperCase();

  const logoUrl = `${baseUrl}/assets/icons/grudge/grudge_logo.png`;
  const iconUrl = data.icon
    ? `${baseUrl}${data.icon}`
    : logoUrl;

  console.log(`[Discord Fish] Sending catch: ${data.fishName} by ${data.username}, icon: ${iconUrl}`);

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
    footer: { text: `Grudge Angeler \u2022 ${playUrl.replace(/^https?:\/\//, '')}`, icon_url: logoUrl },
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
        avatar_url: logoUrl,
        embeds: [embed],
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[Discord Fish] Webhook failed: ${resp.status} ${resp.statusText} - ${body}`);
    } else {
      console.log(`[Discord Fish] Successfully sent: ${data.fishName}`);
    }
  } catch (err) {
    console.error("[Discord Fish] Webhook error:", err);
  }
}

const GRUDGE_ID_URL = process.env.GRUDGE_AUTH_URL || 'https://id.grudge-studio.com';
const TOKEN_COOKIE = 'ga_grudge_token';

function getBaseUrl(req: Request) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || new URL(baseUrl).host;
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
      const timeFilter = (req.query.time as string) || "alltime";
      const entries = await storage.getLeaderboard(category, limit, timeFilter);
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

  // --- Auth: proxy through Grudge ID (id.grudge-studio.com) ---

  // Discord login — redirect to grudge-id's Discord OAuth start
  app.get("/api/auth/discord", (req: Request, res: Response) => {
    const base = getBaseUrl(req);
    const returnUrl = `${base}/game`;
    res.redirect(`${GRUDGE_ID_URL}/auth/discord/start?returnUrl=${encodeURIComponent(returnUrl)}`);
  });

  // Login with username/password via grudge-id
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const resp = await fetch(`${GRUDGE_ID_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await resp.json();
      if (data.token) {
        res.cookie(TOKEN_COOKIE, data.token, {
          httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
        });
      }
      res.status(resp.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'Auth service unavailable' });
    }
  });

  // Register via grudge-id
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const resp = await fetch(`${GRUDGE_ID_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await resp.json();
      if (data.token) {
        res.cookie(TOKEN_COOKIE, data.token, {
          httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
        });
      }
      res.status(resp.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'Auth service unavailable' });
    }
  });

  // Guest login via grudge-id
  app.post("/api/auth/guest", async (req: Request, res: Response) => {
    try {
      const resp = await fetch(`${GRUDGE_ID_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await resp.json();
      if (data.token) {
        res.cookie(TOKEN_COOKIE, data.token, {
          httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
        });
      }
      res.status(resp.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'Auth service unavailable' });
    }
  });

  // Check current user — verify token with grudge-id
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const token = req.cookies?.[TOKEN_COOKIE]
      || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) {
      return res.json({ authenticated: false });
    }
    try {
      const resp = await fetch(`${GRUDGE_ID_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await resp.json();
      if (data.valid || data.success) {
        const u = data.user || data;
        return res.json({
          authenticated: true,
          user: {
            grudgeId: data.grudgeId || u.grudgeId || u.grudge_id,
            username: u.username || u.displayName,
            avatar: u.avatarUrl || null,
          },
        });
      }
      return res.json({ authenticated: false });
    } catch {
      return res.json({ authenticated: false });
    }
  });

  // Logout — clear cookie
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(TOKEN_COOKIE, { path: "/" });
    res.clearCookie("ga_session", { path: "/" });
    res.json({ ok: true });
  });

  // Sprite manifest is now generated at build time → /data/creature-sprites.json
  // This endpoint redirects to the static file for backward compatibility
  app.get("/api/creature-sprites", (_req: Request, res: Response) => {
    res.redirect("/data/creature-sprites.json");
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

      res.json({ entry, rank, totalParticipants: results.length });
    } catch (err) {
      console.error("Tournament submit error:", err);
      res.status(500).json({ message: "Failed to submit tournament score" });
    }
  });

  const tourneyWebhookUrl = () => process.env.DISCORD_WEBHOOK_URL_TOURNEY;

  async function sendTournamentAnnouncement(date: string, isReminder: boolean) {
    const webhookUrl = tourneyWebhookUrl();
    if (!webhookUrl) return;

    const logoUrl = `${baseUrl}/assets/icons/grudge/grudge_logo.png`;
    const bannerUrl = `${baseUrl}/assets/icons/grudge/promo-banner.png`;
    const playLink = playUrl;

    const title = isReminder
      ? "\u23F0 TOURNAMENT REMINDER \u2014 1 HOUR LEFT!"
      : "\uD83C\uDFC6 DAILY TOURNAMENT IS LIVE!";
    const desc = isReminder
      ? `**The tournament is halfway done!** Only **1 hour left** to climb the leaderboard and claim your share of **10,000 GBUX**!\n\n\u23F0 **Ends:** 8:00 PM CST\n\uD83C\uDFA3 **Format:** Best 20-minute catch cycle\n\uD83D\uDCB0 **Prize Pool:** 10,000 GBUX\n\n**[PLAY NOW](${playLink})**`
      : `**The fishing tournament has begun!** Cast your lines, reel in the biggest catches, and climb the leaderboard for a share of the **10,000 GBUX** prize pool!\n\n\u23F0 **Window:** 6:00 PM \u2013 8:00 PM CST\n\uD83C\uDFA3 **Format:** Best 20-minute catch cycle\n\uD83D\uDCB0 **Prize Pool:** 10,000 GBUX\n\n**[PLAY NOW](${playLink})**`;
    const contentMsg = isReminder
      ? `\u23F0 **1 HOUR LEFT in today's tournament!** Don't miss your chance at 10,000 GBUX!\n\n\uD83C\uDFA3 **Play now:** ${playLink}`
      : `@everyone \uD83C\uDFC6 **Daily Tournament is NOW LIVE!** Jump in and compete for 10,000 GBUX!\n\n\uD83C\uDFA3 **Play now:** ${playLink}\n\uD83D\uDD11 Just enter a username \u2014 no account needed!`;

    const embed: any = {
      title,
      description: desc,
      url: playLink,
      color: 0xe040fb,
      fields: [
        { name: "\uD83E\uDD47 1st Place", value: "3,500 gbux", inline: true },
        { name: "\uD83E\uDD48 2nd Place", value: "2,000 gbux", inline: true },
        { name: "\uD83E\uDD49 3rd Place", value: "1,500 gbux", inline: true },
        { name: "4th", value: "1,000", inline: true },
        { name: "5th", value: "800", inline: true },
        { name: "6th", value: "500", inline: true },
        { name: "\uD83D\uDCCA Scoring", value: "Catches x 10 + Weight x 5 + Largest x 20 + Rarity x 15", inline: false },
        { name: "\uD83D\uDD11 How to Join", value: `1. [Click here to play](${playLink})\n2. Enter a username to join\n3. Fish during the tournament window\n4. Be in this Discord to see results!`, inline: false },
      ],
      image: { url: bannerUrl },
      thumbnail: { url: logoUrl },
      footer: { text: `Grudge Angeler \u2022 ${date} \u2022 Username login \u2022 No account needed`, icon_url: logoUrl },
      timestamp: new Date().toISOString(),
    };

    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Grudge Tournament",
          avatar_url: logoUrl,
          content: contentMsg,
          embeds: [embed],
        }),
      });
      if (!resp.ok) {
        console.error(`[Tournament] Announcement webhook failed: ${resp.status}`);
      } else {
        console.log(`[Tournament] ${isReminder ? "Reminder" : "Start"} announcement sent for ${date}`);
      }
    } catch (err) {
      console.error("[Tournament] Announcement webhook error:", err);
    }
  }

  async function sendTournamentEndAnnouncement(date: string) {
    const webhookUrl = tourneyWebhookUrl();
    if (!webhookUrl) return;

    const logoUrl = `${baseUrl}/assets/icons/grudge/grudge_logo.png`;
    const playLink = playUrl;

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
        url: playLink,
        color: 0xffd700,
        thumbnail: { url: logoUrl },
        fields: [
          { name: "Total Participants", value: `${results.length}`, inline: true },
          { name: "Prize Pool", value: "10,000 gbux", inline: true },
          { name: "Next Tournament", value: "Tomorrow 6-8 PM CST", inline: true },
          { name: "\uD83C\uDFA3 Play Tomorrow", value: `[Click here to play](${playLink}) \u2014 just enter a username!`, inline: false },
        ],
        footer: { text: `Grudge Angeler \u2022 ${date} \u2022 See you tomorrow!`, icon_url: logoUrl },
        timestamp: new Date().toISOString(),
      };

      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Grudge Tournament",
          avatar_url: logoUrl,
          content: `\uD83C\uDFC6 **Daily Tournament has ENDED!** Here are the final standings:\n\n\uD83C\uDFA3 Play tomorrow: ${playLink}`,
          embeds: [embed],
        }),
      });
      if (!resp.ok) {
        console.error(`[Tournament] End webhook failed: ${resp.status}`);
      } else {
        console.log(`[Tournament] Results posted for ${date}`);
      }
    } catch (err) {
      console.error("[Tournament] End webhook error:", err);
    }
  }

  let lastTournamentState = false;
  let lastTournamentDate = "";
  let sentStartAnnouncement = "";
  let sentReminderAnnouncement = "";
  let sentEndAnnouncement = "";

  function getCSTHour(): number {
    const now = new Date();
    const cst = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    return cst.getHours();
  }

  function getCSTMinute(): number {
    const now = new Date();
    const cst = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    return cst.getMinutes();
  }

  setInterval(() => {
    const status = isTournamentActive();
    const cstHour = getCSTHour();
    const cstMinute = getCSTMinute();

    if (status.active) {
      if (cstHour === 18 && sentStartAnnouncement !== status.date) {
        sentStartAnnouncement = status.date;
        sendTournamentAnnouncement(status.date, false);
      }
      if (cstHour === 19 && sentReminderAnnouncement !== status.date) {
        sentReminderAnnouncement = status.date;
        sendTournamentAnnouncement(status.date, true);
      }
    }

    if (!status.active && lastTournamentState && lastTournamentDate) {
      if (cstHour === 20 && cstMinute >= 1 && sentEndAnnouncement !== lastTournamentDate) {
        sentEndAnnouncement = lastTournamentDate;
        sendTournamentEndAnnouncement(lastTournamentDate);
      }
    }

    lastTournamentState = status.active;
    if (status.active) lastTournamentDate = status.date;
  }, 30000);

  return httpServer;
}
