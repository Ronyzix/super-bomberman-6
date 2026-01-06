import { COOKIE_NAME } from "@shared/const";
import { generateMapFallback, generateMapWithLLM } from "./procedural";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Player Progress
  progress: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getPlayerProgress(ctx.user.id);
    }),
    
    update: protectedProcedure
      .input(z.object({
        unlockedLevels: z.array(z.number()).optional(),
        currentLevel: z.number().optional(),
        totalScore: z.number().optional(),
        totalPlayTime: z.number().optional(),
        totalKills: z.number().optional(),
        totalDeaths: z.number().optional(),
        powerUpsCollected: z.number().optional(),
        bossesDefeated: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createOrUpdateProgress(ctx.user.id, input);
      }),
    
    unlockLevel: protectedProcedure
      .input(z.object({ levelId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.unlockLevel(ctx.user.id, input.levelId);
      }),
  }),

  // Leaderboards
  leaderboard: router({
    campaign: publicProcedure
      .input(z.object({
        levelId: z.number().optional(),
        limit: z.number().max(100).default(100),
      }))
      .query(async ({ input }) => {
        return db.getCampaignLeaderboard(input.levelId, input.limit);
      }),
    
    infinite: publicProcedure
      .input(z.object({
        difficulty: z.enum(['normal', 'hard', 'insane']).optional(),
        limit: z.number().max(100).default(100),
      }))
      .query(async ({ input }) => {
        return db.getInfiniteLeaderboard(input.difficulty, input.limit);
      }),
    
    coop: publicProcedure
      .input(z.object({
        limit: z.number().max(100).default(100),
      }))
      .query(async ({ input }) => {
        return db.getCoopLeaderboard(input.limit);
      }),
    
    submitCampaign: protectedProcedure
      .input(z.object({
        levelId: z.number(),
        score: z.number(),
        timeMs: z.number(),
        stars: z.number().min(0).max(3).default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.submitCampaignScore({
          userId: ctx.user.id,
          playerName: ctx.user.name || 'Anonymous',
          ...input,
        });
      }),
    
    submitInfinite: protectedProcedure
      .input(z.object({
        score: z.number(),
        wave: z.number(),
        kills: z.number().default(0),
        timeMs: z.number(),
        difficulty: z.enum(['normal', 'hard', 'insane']).default('normal'),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.submitInfiniteScore({
          userId: ctx.user.id,
          playerName: ctx.user.name || 'Anonymous',
          ...input,
        });
      }),
  }),

  // Game Rooms (Multiplayer)
  rooms: router({
    list: publicProcedure.query(async () => {
      return db.getActiveRooms();
    }),
    
    get: publicProcedure
      .input(z.object({ roomId: z.string() }))
      .query(async ({ input }) => {
        const room = await db.getRoom(input.roomId);
        if (!room) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' });
        }
        const players = await db.getRoomPlayers(input.roomId);
        return { room, players };
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        maxPlayers: z.number().min(2).max(4).default(4),
        gameMode: z.enum(['coop', 'versus']).default('coop'),
        isPrivate: z.boolean().default(false),
        password: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const roomId = nanoid(10);
        
        await db.createRoom({
          id: roomId,
          name: input.name,
          hostId: ctx.user.id,
          hostName: ctx.user.name || 'Anonymous',
          maxPlayers: input.maxPlayers,
          gameMode: input.gameMode,
          isPrivate: input.isPrivate,
          password: input.password,
        });
        
        // Add host as first player
        await db.addPlayerToRoom({
          roomId,
          userId: ctx.user.id,
          playerName: ctx.user.name || 'Anonymous',
          playerSlot: 0,
          isHost: true,
          isReady: true,
        });
        
        return { roomId };
      }),
    
    join: protectedProcedure
      .input(z.object({
        roomId: z.string(),
        password: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const room = await db.getRoom(input.roomId);
        
        if (!room) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' });
        }
        
        if (room.status !== 'waiting') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Game already started' });
        }
        
        if (room.playerCount && room.maxPlayers && room.playerCount >= room.maxPlayers) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Room is full' });
        }
        
        if (room.isPrivate && room.password !== input.password) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid password' });
        }
        
        const players = await db.getRoomPlayers(input.roomId);
        const usedSlots = players.map(p => p.playerSlot);
        const availableSlot = [0, 1, 2, 3].find(s => !usedSlots.includes(s)) || 0;
        
        await db.addPlayerToRoom({
          roomId: input.roomId,
          userId: ctx.user.id,
          playerName: ctx.user.name || 'Anonymous',
          playerSlot: availableSlot,
          isHost: false,
          isReady: false,
        });
        
        return { success: true, slot: availableSlot };
      }),
    
    leave: protectedProcedure
      .input(z.object({ roomId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const room = await db.getRoom(input.roomId);
        
        if (!room) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' });
        }
        
        // If host leaves, delete the room
        if (room.hostId === ctx.user.id) {
          await db.deleteRoom(input.roomId);
        } else {
          await db.removePlayerFromRoom(input.roomId, ctx.user.id);
        }
        
        return { success: true };
      }),
    
    setReady: protectedProcedure
      .input(z.object({
        roomId: z.string(),
        isReady: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePlayerReady(input.roomId, ctx.user.id, input.isReady);
        return { success: true };
      }),
    
    start: protectedProcedure
      .input(z.object({ roomId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const room = await db.getRoom(input.roomId);
        
        if (!room) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' });
        }
        
        if (room.hostId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only host can start the game' });
        }
        
        const players = await db.getRoomPlayers(input.roomId);
        const allReady = players.every(p => p.isReady || p.isHost);
        
        if (!allReady) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not all players are ready' });
        }
        
        await db.updateRoom(input.roomId, { status: 'playing' });
        
        return { success: true };
      }),
  }),

  // Replays
  replays: router({
    list: publicProcedure
      .input(z.object({
        featured: z.boolean().default(false),
        limit: z.number().max(50).default(50),
      }))
      .query(async ({ input }) => {
        if (input.featured) {
          return db.getFeaturedReplays(input.limit);
        }
        return db.getPublicReplays(input.limit);
      }),
    
    myReplays: protectedProcedure
      .input(z.object({
        limit: z.number().max(50).default(20),
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserReplays(ctx.user.id, input.limit);
      }),
    
    get: publicProcedure
      .input(z.object({ replayId: z.number() }))
      .query(async ({ input }) => {
        const replay = await db.getReplay(input.replayId);
        if (!replay) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Replay not found' });
        }
        await db.incrementReplayViews(input.replayId);
        return replay;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().max(200).optional(),
        gameMode: z.enum(['campaign', 'infinite', 'coop']),
        levelId: z.number().optional(),
        score: z.number().default(0),
        duration: z.number(),
        replayData: z.string().optional(),
        replayUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        isPublic: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createReplay({
          userId: ctx.user.id,
          playerName: ctx.user.name || 'Anonymous',
          ...input,
        });
      }),
    
    like: protectedProcedure
      .input(z.object({ replayId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.likeReplay(input.replayId, ctx.user.id);
        return { success };
      }),
  }),

  // Player Stats
  stats: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getPlayerStats(ctx.user.id);
    }),
    
    update: protectedProcedure
      .input(z.object({
        gamesPlayed: z.number().optional(),
        gamesWon: z.number().optional(),
        totalKills: z.number().optional(),
        totalDeaths: z.number().optional(),
        bombsPlaced: z.number().optional(),
        blocksDestroyed: z.number().optional(),
        powerUpsCollected: z.number().optional(),
        bossesDefeated: z.number().optional(),
        highestWaveInfinite: z.number().optional(),
        highestScoreCampaign: z.number().optional(),
        highestScoreInfinite: z.number().optional(),
        totalPlayTimeSeconds: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updatePlayerStats(ctx.user.id, input);
      }),
  }),

  // Procedural Generation
  procedural: router({
    generateMap: publicProcedure
      .input(z.object({
        wave: z.number().min(1).max(1000),
        difficulty: z.enum(['normal', 'hard', 'insane']).default('normal'),
        useLLM: z.boolean().default(false),
        playerCount: z.number().min(1).max(4).default(1),
      }))
      .mutation(async ({ input }) => {
        if (input.useLLM) {
          return await generateMapWithLLM(input.wave, input.difficulty, input.playerCount);
        }
        return generateMapFallback(input.wave, input.difficulty);
      }),
  }),

  // Achievements
  achievements: router({
    list: publicProcedure.query(async () => {
      return db.getAllAchievements();
    }),
    
    myAchievements: protectedProcedure.query(async ({ ctx }) => {
      return db.getPlayerAchievements(ctx.user.id);
    }),
    
    unlock: protectedProcedure
      .input(z.object({ achievementId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.unlockAchievement(ctx.user.id, input.achievementId);
        return { success };
      }),
  }),
});

export type AppRouter = typeof appRouter;
