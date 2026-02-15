import type { Express, Request, Response, CookieOptions } from "express";
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

  return httpServer;
}
