import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Player game progress - tracks unlocked levels, achievements, etc.
 */
export const playerProgress = mysqlTable("player_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  unlockedLevels: json("unlockedLevels").$type<number[]>(),
  currentLevel: int("currentLevel").default(1),
  totalScore: bigint("totalScore", { mode: "number" }).default(0),
  totalPlayTime: int("totalPlayTime").default(0), // in seconds
  totalKills: int("totalKills").default(0),
  totalDeaths: int("totalDeaths").default(0),
  achievements: json("achievements").$type<string[]>(),
  powerUpsCollected: int("powerUpsCollected").default(0),
  bossesDefeated: int("bossesDefeated").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerProgress = typeof playerProgress.$inferSelect;
export type InsertPlayerProgress = typeof playerProgress.$inferInsert;

/**
 * High scores for campaign mode
 */
export const campaignScores = mysqlTable("campaign_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  levelId: int("levelId").notNull(),
  score: bigint("score", { mode: "number" }).notNull(),
  timeMs: int("timeMs").notNull(), // completion time in milliseconds
  stars: int("stars").default(0), // 0-3 stars based on performance
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignScore = typeof campaignScores.$inferSelect;
export type InsertCampaignScore = typeof campaignScores.$inferInsert;

/**
 * High scores for infinite mode
 */
export const infiniteScores = mysqlTable("infinite_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  score: bigint("score", { mode: "number" }).notNull(),
  wave: int("wave").notNull(),
  kills: int("kills").default(0),
  timeMs: int("timeMs").notNull(),
  difficulty: mysqlEnum("difficulty", ["normal", "hard", "insane"]).default("normal"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InfiniteScore = typeof infiniteScores.$inferSelect;
export type InsertInfiniteScore = typeof infiniteScores.$inferInsert;

/**
 * Co-op scores for multiplayer campaign
 */
export const coopScores = mysqlTable("coop_scores", {
  id: int("id").autoincrement().primaryKey(),
  teamName: varchar("teamName", { length: 100 }).notNull(),
  playerIds: json("playerIds").$type<number[]>(),
  playerNames: json("playerNames").$type<string[]>(),
  levelId: int("levelId").notNull(),
  score: bigint("score", { mode: "number" }).notNull(),
  timeMs: int("timeMs").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoopScore = typeof coopScores.$inferSelect;
export type InsertCoopScore = typeof coopScores.$inferInsert;

/**
 * Multiplayer game rooms
 */
export const gameRooms = mysqlTable("game_rooms", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: varchar("name", { length: 100 }).notNull(),
  hostId: int("hostId").notNull(),
  hostName: varchar("hostName", { length: 100 }).notNull(),
  playerCount: int("playerCount").default(1),
  maxPlayers: int("maxPlayers").default(4),
  status: mysqlEnum("status", ["waiting", "playing", "finished"]).default("waiting"),
  levelId: int("levelId").default(1),
  gameMode: mysqlEnum("gameMode", ["coop", "versus"]).default("coop"),
  isPrivate: boolean("isPrivate").default(false),
  password: varchar("password", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameRoom = typeof gameRooms.$inferInsert;

/**
 * Room players - tracks players in each room
 */
export const roomPlayers = mysqlTable("room_players", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 36 }).notNull(),
  userId: int("userId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  playerSlot: int("playerSlot").notNull(), // 0-3
  isReady: boolean("isReady").default(false),
  isHost: boolean("isHost").default(false),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type RoomPlayer = typeof roomPlayers.$inferSelect;
export type InsertRoomPlayer = typeof roomPlayers.$inferInsert;

/**
 * Game replays - stores recorded gameplay
 */
export const gameReplays = mysqlTable("game_replays", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }),
  gameMode: mysqlEnum("gameMode", ["campaign", "infinite", "coop"]).notNull(),
  levelId: int("levelId"),
  score: bigint("score", { mode: "number" }).default(0),
  duration: int("duration").notNull(), // in seconds
  replayData: text("replayData"), // JSON string of replay frames
  replayUrl: varchar("replayUrl", { length: 500 }), // S3 URL for large replays
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  views: int("views").default(0),
  likes: int("likes").default(0),
  isPublic: boolean("isPublic").default(true),
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameReplay = typeof gameReplays.$inferSelect;
export type InsertGameReplay = typeof gameReplays.$inferInsert;

/**
 * Replay likes - tracks who liked which replay
 */
export const replayLikes = mysqlTable("replay_likes", {
  id: int("id").autoincrement().primaryKey(),
  replayId: int("replayId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReplayLike = typeof replayLikes.$inferSelect;
export type InsertReplayLike = typeof replayLikes.$inferInsert;

/**
 * Player statistics - detailed stats tracking
 */
export const playerStats = mysqlTable("player_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  gamesPlayed: int("gamesPlayed").default(0),
  gamesWon: int("gamesWon").default(0),
  totalKills: int("totalKills").default(0),
  totalDeaths: int("totalDeaths").default(0),
  bombsPlaced: int("bombsPlaced").default(0),
  blocksDestroyed: int("blocksDestroyed").default(0),
  powerUpsCollected: int("powerUpsCollected").default(0),
  bossesDefeated: int("bossesDefeated").default(0),
  highestWaveInfinite: int("highestWaveInfinite").default(0),
  highestScoreCampaign: bigint("highestScoreCampaign", { mode: "number" }).default(0),
  highestScoreInfinite: bigint("highestScoreInfinite", { mode: "number" }).default(0),
  totalPlayTimeSeconds: int("totalPlayTimeSeconds").default(0),
  lastPlayedAt: timestamp("lastPlayedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertPlayerStats = typeof playerStats.$inferInsert;

/**
 * Achievements - available achievements in the game
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  points: int("points").default(10),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * Player achievements - tracks which achievements each player has unlocked
 */
export const playerAchievements = mysqlTable("player_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type PlayerAchievement = typeof playerAchievements.$inferSelect;
export type InsertPlayerAchievement = typeof playerAchievements.$inferInsert;
