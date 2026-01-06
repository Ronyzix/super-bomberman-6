import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  playerProgress, 
  campaignScores, 
  infiniteScores, 
  coopScores,
  gameRooms,
  roomPlayers,
  gameReplays,
  replayLikes,
  playerStats,
  achievements,
  playerAchievements,
  InsertPlayerProgress,
  InsertCampaignScore,
  InsertInfiniteScore,
  InsertCoopScore,
  InsertGameRoom,
  InsertRoomPlayer,
  InsertGameReplay,
  InsertPlayerStats,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PLAYER PROGRESS ============

export async function getPlayerProgress(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(playerProgress).where(eq(playerProgress.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateProgress(userId: number, data: Partial<InsertPlayerProgress>) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getPlayerProgress(userId);
  
  if (existing) {
    await db.update(playerProgress)
      .set(data)
      .where(eq(playerProgress.userId, userId));
    return { ...existing, ...data };
  } else {
    await db.insert(playerProgress).values({ userId, ...data });
    return { userId, ...data };
  }
}

export async function unlockLevel(userId: number, levelId: number) {
  const db = await getDb();
  if (!db) return null;

  const progress = await getPlayerProgress(userId);
  const currentLevels = progress?.unlockedLevels || [1];
  
  if (!currentLevels.includes(levelId)) {
    const newLevels = [...currentLevels, levelId];
    await createOrUpdateProgress(userId, { unlockedLevels: newLevels });
    return newLevels;
  }
  
  return currentLevels;
}

// ============ LEADERBOARDS ============

export async function getCampaignLeaderboard(levelId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  if (levelId) {
    return db.select()
      .from(campaignScores)
      .where(eq(campaignScores.levelId, levelId))
      .orderBy(desc(campaignScores.score))
      .limit(limit);
  }
  
  return db.select()
    .from(campaignScores)
    .orderBy(desc(campaignScores.score))
    .limit(limit);
}

export async function getInfiniteLeaderboard(difficulty?: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  if (difficulty) {
    return db.select()
      .from(infiniteScores)
      .where(eq(infiniteScores.difficulty, difficulty as any))
      .orderBy(desc(infiniteScores.score))
      .limit(limit);
  }
  
  return db.select()
    .from(infiniteScores)
    .orderBy(desc(infiniteScores.score))
    .limit(limit);
}

export async function getCoopLeaderboard(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(coopScores)
    .orderBy(desc(coopScores.score))
    .limit(limit);
}

export async function submitCampaignScore(data: InsertCampaignScore) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(campaignScores).values(data);
  return result;
}

export async function submitInfiniteScore(data: InsertInfiniteScore) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(infiniteScores).values(data);
  return result;
}

export async function submitCoopScore(data: InsertCoopScore) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(coopScores).values(data);
  return result;
}

// ============ GAME ROOMS ============

export async function getActiveRooms() {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(gameRooms)
    .where(eq(gameRooms.status, 'waiting'))
    .orderBy(desc(gameRooms.createdAt))
    .limit(50);
}

export async function createRoom(data: InsertGameRoom) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(gameRooms).values(data);
  return data;
}

export async function getRoom(roomId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateRoom(roomId: string, data: Partial<InsertGameRoom>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(gameRooms).set(data).where(eq(gameRooms.id, roomId));
  return { ...data, id: roomId };
}

export async function deleteRoom(roomId: string) {
  const db = await getDb();
  if (!db) return;

  await db.delete(roomPlayers).where(eq(roomPlayers.roomId, roomId));
  await db.delete(gameRooms).where(eq(gameRooms.id, roomId));
}

export async function getRoomPlayers(roomId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, roomId))
    .orderBy(roomPlayers.playerSlot);
}

export async function addPlayerToRoom(data: InsertRoomPlayer) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(roomPlayers).values(data);
  
  // Update room player count
  const room = await getRoom(data.roomId);
  if (room) {
    await updateRoom(data.roomId, { playerCount: (room.playerCount || 0) + 1 });
  }
  
  return data;
}

export async function removePlayerFromRoom(roomId: string, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, userId)));
  
  // Update room player count
  const room = await getRoom(roomId);
  if (room && room.playerCount && room.playerCount > 0) {
    await updateRoom(roomId, { playerCount: room.playerCount - 1 });
  }
}

export async function updatePlayerReady(roomId: string, userId: number, isReady: boolean) {
  const db = await getDb();
  if (!db) return;

  await db.update(roomPlayers)
    .set({ isReady })
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, userId)));
}

// ============ REPLAYS ============

export async function getPublicReplays(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(gameReplays)
    .where(eq(gameReplays.isPublic, true))
    .orderBy(desc(gameReplays.createdAt))
    .limit(limit);
}

export async function getFeaturedReplays(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(gameReplays)
    .where(and(eq(gameReplays.isPublic, true), eq(gameReplays.isFeatured, true)))
    .orderBy(desc(gameReplays.likes))
    .limit(limit);
}

export async function getUserReplays(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(gameReplays)
    .where(eq(gameReplays.userId, userId))
    .orderBy(desc(gameReplays.createdAt))
    .limit(limit);
}

export async function createReplay(data: InsertGameReplay) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(gameReplays).values(data);
  return result;
}

export async function getReplay(replayId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(gameReplays).where(eq(gameReplays.id, replayId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function incrementReplayViews(replayId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(gameReplays)
    .set({ views: sql`${gameReplays.views} + 1` })
    .where(eq(gameReplays.id, replayId));
}

export async function likeReplay(replayId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  // Check if already liked
  const existing = await db.select()
    .from(replayLikes)
    .where(and(eq(replayLikes.replayId, replayId), eq(replayLikes.userId, userId)))
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(replayLikes).values({ replayId, userId });
  await db.update(gameReplays)
    .set({ likes: sql`${gameReplays.likes} + 1` })
    .where(eq(gameReplays.id, replayId));

  return true;
}

// ============ PLAYER STATS ============

export async function getPlayerStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(playerStats).where(eq(playerStats.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePlayerStats(userId: number, stats: Partial<InsertPlayerStats>) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getPlayerStats(userId);
  
  if (existing) {
    await db.update(playerStats)
      .set({ ...stats, lastPlayedAt: new Date() })
      .where(eq(playerStats.userId, userId));
    return { ...existing, ...stats };
  } else {
    await db.insert(playerStats).values({ userId, ...stats });
    return { userId, ...stats };
  }
}

export async function incrementStats(userId: number, field: string, amount: number = 1) {
  const db = await getDb();
  if (!db) return;

  const existing = await getPlayerStats(userId);
  
  if (existing) {
    const currentValue = (existing as any)[field] || 0;
    await db.update(playerStats)
      .set({ [field]: currentValue + amount, lastPlayedAt: new Date() })
      .where(eq(playerStats.userId, userId));
  } else {
    await db.insert(playerStats).values({ userId, [field]: amount });
  }
}

// ============ ACHIEVEMENTS ============

export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(achievements);
}

export async function getPlayerAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(playerAchievements)
    .where(eq(playerAchievements.userId, userId));
}

export async function unlockAchievement(userId: number, achievementId: number) {
  const db = await getDb();
  if (!db) return false;

  // Check if already unlocked
  const existing = await db.select()
    .from(playerAchievements)
    .where(and(eq(playerAchievements.userId, userId), eq(playerAchievements.achievementId, achievementId)))
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(playerAchievements).values({ userId, achievementId });
  return true;
}
