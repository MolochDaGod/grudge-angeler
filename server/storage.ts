import { type User, type InsertUser, type LeaderboardEntry, type InsertLeaderboardEntry, leaderboardEntries } from "@shared/schema";
import { db } from "./db";
import { desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLeaderboard(category: string, limit?: number): Promise<LeaderboardEntry[]>;
  submitLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    return { ...insertUser, id };
  }

  async getLeaderboard(category: string, limit = 50): Promise<LeaderboardEntry[]> {
    return await db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.category, category))
      .orderBy(desc(leaderboardEntries.value))
      .limit(limit);
  }

  async submitLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    if (entry.category === "biggest_catch" || entry.category === "session_catches") {
      const result = await db.execute(sql`
        INSERT INTO leaderboard_entries (id, player_name, category, fish_name, fish_rarity, value, score, created_at)
        VALUES (
          ${randomUUID()},
          ${entry.playerName},
          ${entry.category},
          ${entry.fishName ?? null},
          ${entry.fishRarity ?? null},
          ${entry.value},
          ${entry.score ?? 0},
          NOW()
        )
        ON CONFLICT (player_name, category) WHERE category IN ('biggest_catch', 'session_catches')
        DO UPDATE SET
          value = CASE WHEN EXCLUDED.value > leaderboard_entries.value THEN EXCLUDED.value ELSE leaderboard_entries.value END,
          score = CASE WHEN EXCLUDED.value > leaderboard_entries.value THEN EXCLUDED.score ELSE leaderboard_entries.score END,
          fish_name = CASE WHEN EXCLUDED.value > leaderboard_entries.value THEN EXCLUDED.fish_name ELSE leaderboard_entries.fish_name END,
          fish_rarity = CASE WHEN EXCLUDED.value > leaderboard_entries.value THEN EXCLUDED.fish_rarity ELSE leaderboard_entries.fish_rarity END,
          created_at = CASE WHEN EXCLUDED.value > leaderboard_entries.value THEN NOW() ELSE leaderboard_entries.created_at END
        RETURNING *
      `);
      const row = (result as any).rows?.[0] || (result as any)[0];
      if (row) {
        return {
          id: row.id,
          playerName: row.player_name,
          category: row.category,
          fishName: row.fish_name,
          fishRarity: row.fish_rarity,
          value: row.value,
          score: row.score,
          createdAt: row.created_at,
        } as LeaderboardEntry;
      }
    }

    const [result] = await db
      .insert(leaderboardEntries)
      .values(entry)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
