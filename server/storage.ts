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
    const [result] = await db
      .insert(leaderboardEntries)
      .values(entry)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
