import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getPlayerProgress: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    unlockedLevels: [1, 2, 3],
    currentLevel: 3,
    totalScore: 10000,
    totalPlayTime: 3600,
    totalKills: 50,
    totalDeaths: 5,
  }),
  createOrUpdateProgress: vi.fn().mockResolvedValue({
    userId: 1,
    unlockedLevels: [1, 2, 3, 4],
    currentLevel: 4,
  }),
  unlockLevel: vi.fn().mockResolvedValue([1, 2, 3, 4]),
  getCampaignLeaderboard: vi.fn().mockResolvedValue([
    { id: 1, playerName: "Player1", score: 100000, levelId: 1 },
    { id: 2, playerName: "Player2", score: 90000, levelId: 1 },
  ]),
  getInfiniteLeaderboard: vi.fn().mockResolvedValue([
    { id: 1, playerName: "Player1", score: 500000, wave: 50 },
    { id: 2, playerName: "Player2", score: 400000, wave: 40 },
  ]),
  getCoopLeaderboard: vi.fn().mockResolvedValue([
    { id: 1, teamName: "Team1", score: 200000 },
  ]),
  submitCampaignScore: vi.fn().mockResolvedValue({ insertId: 1 }),
  submitInfiniteScore: vi.fn().mockResolvedValue({ insertId: 1 }),
  getActiveRooms: vi.fn().mockResolvedValue([
    { id: "room1", name: "Test Room", hostName: "Host", playerCount: 2, maxPlayers: 4, status: "waiting" },
  ]),
  getRoom: vi.fn().mockResolvedValue({
    id: "room1",
    name: "Test Room",
    hostId: 1,
    hostName: "Host",
    playerCount: 2,
    maxPlayers: 4,
    status: "waiting",
    isPrivate: false,
  }),
  getRoomPlayers: vi.fn().mockResolvedValue([
    { userId: 1, playerName: "Host", playerSlot: 0, isHost: true, isReady: true },
    { userId: 2, playerName: "Player2", playerSlot: 1, isHost: false, isReady: false },
  ]),
  createRoom: vi.fn().mockResolvedValue({ id: "newroom" }),
  addPlayerToRoom: vi.fn().mockResolvedValue({}),
  updateRoom: vi.fn().mockResolvedValue({}),
  deleteRoom: vi.fn().mockResolvedValue(undefined),
  removePlayerFromRoom: vi.fn().mockResolvedValue(undefined),
  updatePlayerReady: vi.fn().mockResolvedValue(undefined),
  getPublicReplays: vi.fn().mockResolvedValue([
    { id: 1, playerName: "Player1", title: "Epic Game", views: 100, likes: 50 },
  ]),
  getFeaturedReplays: vi.fn().mockResolvedValue([]),
  getUserReplays: vi.fn().mockResolvedValue([]),
  getReplay: vi.fn().mockResolvedValue({
    id: 1,
    playerName: "Player1",
    title: "Epic Game",
    gameMode: "campaign",
    score: 100000,
    duration: 300,
    views: 100,
    likes: 50,
  }),
  incrementReplayViews: vi.fn().mockResolvedValue(undefined),
  createReplay: vi.fn().mockResolvedValue({ insertId: 1 }),
  likeReplay: vi.fn().mockResolvedValue(true),
  getPlayerStats: vi.fn().mockResolvedValue({
    userId: 1,
    gamesPlayed: 100,
    gamesWon: 50,
    totalKills: 500,
  }),
  updatePlayerStats: vi.fn().mockResolvedValue({}),
  getAllAchievements: vi.fn().mockResolvedValue([
    { id: 1, code: "first_win", name: "First Victory", points: 10 },
    { id: 2, code: "boss_slayer", name: "Boss Slayer", points: 50 },
  ]),
  getPlayerAchievements: vi.fn().mockResolvedValue([
    { userId: 1, achievementId: 1 },
  ]),
  unlockAchievement: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Progress Router", () => {
  it("gets player progress for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.progress.get();

    expect(result).toBeDefined();
    expect(result?.unlockedLevels).toContain(1);
    expect(result?.totalScore).toBe(10000);
  });

  it("updates player progress", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.progress.update({
      currentLevel: 4,
      totalScore: 15000,
    });

    expect(result).toBeDefined();
  });

  it("unlocks a new level", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.progress.unlockLevel({ levelId: 4 });

    expect(result).toContain(4);
  });
});

describe("Leaderboard Router", () => {
  it("gets campaign leaderboard (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.campaign({ limit: 10 });

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("playerName");
    expect(result[0]).toHaveProperty("score");
  });

  it("gets infinite leaderboard with difficulty filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.infinite({ 
      difficulty: "normal", 
      limit: 10 
    });

    expect(result).toBeInstanceOf(Array);
  });

  it("gets coop leaderboard", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.coop({ limit: 10 });

    expect(result).toBeInstanceOf(Array);
  });

  it("submits campaign score for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.submitCampaign({
      levelId: 1,
      score: 50000,
      timeMs: 120000,
      stars: 3,
    });

    expect(result).toBeDefined();
  });

  it("submits infinite score for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.submitInfinite({
      score: 100000,
      wave: 25,
      kills: 100,
      timeMs: 600000,
      difficulty: "hard",
    });

    expect(result).toBeDefined();
  });
});

describe("Rooms Router", () => {
  it("lists active rooms (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.rooms.list();

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("playerCount");
  });

  it("gets room details with players", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.rooms.get({ roomId: "room1" });

    expect(result.room).toBeDefined();
    expect(result.players).toBeInstanceOf(Array);
    expect(result.room.name).toBe("Test Room");
  });

  it("creates a new room for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.rooms.create({
      name: "My Game Room",
      maxPlayers: 4,
      gameMode: "coop",
    });

    expect(result).toHaveProperty("roomId");
  });

  it("sets player ready status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.rooms.setReady({
      roomId: "room1",
      isReady: true,
    });

    expect(result.success).toBe(true);
  });
});

describe("Replays Router", () => {
  it("lists public replays", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.replays.list({ limit: 10 });

    expect(result).toBeInstanceOf(Array);
  });

  it("gets replay details and increments views", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.replays.get({ replayId: 1 });

    expect(result).toBeDefined();
    expect(result.title).toBe("Epic Game");
    expect(result.views).toBe(100);
  });

  it("creates a replay for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.replays.create({
      title: "My Best Game",
      gameMode: "campaign",
      levelId: 5,
      score: 75000,
      duration: 180,
      isPublic: true,
    });

    expect(result).toBeDefined();
  });

  it("likes a replay for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.replays.like({ replayId: 1 });

    expect(result.success).toBe(true);
  });
});

describe("Stats Router", () => {
  it("gets player stats for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.get();

    expect(result).toBeDefined();
    expect(result?.gamesPlayed).toBe(100);
    expect(result?.totalKills).toBe(500);
  });

  it("updates player stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.update({
      gamesPlayed: 101,
      totalKills: 510,
    });

    expect(result).toBeDefined();
  });
});

describe("Achievements Router", () => {
  it("lists all achievements (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.achievements.list();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("code");
    expect(result[0]).toHaveProperty("name");
  });

  it("gets player achievements for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.achievements.myAchievements();

    expect(result).toBeInstanceOf(Array);
  });

  it("unlocks an achievement for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.achievements.unlock({ achievementId: 2 });

    expect(result.success).toBe(true);
  });
});
