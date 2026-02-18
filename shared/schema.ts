import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerName: text("player_name").notNull(),
  category: text("category").notNull(),
  fishName: text("fish_name"),
  fishRarity: text("fish_rarity"),
  value: real("value").notNull(),
  score: integer("score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

export const tournamentEntries = pgTable("tournament_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerName: text("player_name").notNull(),
  tournamentDate: text("tournament_date").notNull(),
  totalCaught: integer("total_caught").notNull().default(0),
  totalWeight: real("total_weight").notNull().default(0),
  largestCatch: real("largest_catch").notNull().default(0),
  largestFishName: text("largest_fish_name"),
  rarityScore: integer("rarity_score").notNull().default(0),
  compositeScore: real("composite_score").notNull().default(0),
  reward: integer("reward").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournamentEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertTournamentEntry = z.infer<typeof insertTournamentSchema>;
export type TournamentEntry = typeof tournamentEntries.$inferSelect;

export * from "./models/chat";
