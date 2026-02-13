import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "@shared/schema";

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

  return httpServer;
}
