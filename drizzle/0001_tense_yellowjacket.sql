CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`points` int DEFAULT 10,
	`rarity` enum('common','rare','epic','legendary') DEFAULT 'common',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `campaign_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`levelId` int NOT NULL,
	`score` bigint NOT NULL,
	`timeMs` int NOT NULL,
	`stars` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coop_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamName` varchar(100) NOT NULL,
	`playerIds` json NOT NULL,
	`playerNames` json NOT NULL,
	`levelId` int NOT NULL,
	`score` bigint NOT NULL,
	`timeMs` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coop_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_replays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`title` varchar(200),
	`gameMode` enum('campaign','infinite','coop') NOT NULL,
	`levelId` int,
	`score` bigint DEFAULT 0,
	`duration` int NOT NULL,
	`replayData` text,
	`replayUrl` varchar(500),
	`thumbnailUrl` varchar(500),
	`views` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`isPublic` boolean DEFAULT true,
	`isFeatured` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_replays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_rooms` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`hostId` int NOT NULL,
	`hostName` varchar(100) NOT NULL,
	`playerCount` int DEFAULT 1,
	`maxPlayers` int DEFAULT 4,
	`status` enum('waiting','playing','finished') DEFAULT 'waiting',
	`levelId` int DEFAULT 1,
	`gameMode` enum('coop','versus') DEFAULT 'coop',
	`isPrivate` boolean DEFAULT false,
	`password` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `infinite_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`score` bigint NOT NULL,
	`wave` int NOT NULL,
	`kills` int DEFAULT 0,
	`timeMs` int NOT NULL,
	`difficulty` enum('normal','hard','insane') DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `infinite_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`unlockedLevels` json DEFAULT ('[1]'),
	`currentLevel` int DEFAULT 1,
	`totalScore` bigint DEFAULT 0,
	`totalPlayTime` int DEFAULT 0,
	`totalKills` int DEFAULT 0,
	`totalDeaths` int DEFAULT 0,
	`achievements` json DEFAULT ('[]'),
	`powerUpsCollected` int DEFAULT 0,
	`bossesDefeated` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gamesPlayed` int DEFAULT 0,
	`gamesWon` int DEFAULT 0,
	`totalKills` int DEFAULT 0,
	`totalDeaths` int DEFAULT 0,
	`bombsPlaced` int DEFAULT 0,
	`blocksDestroyed` int DEFAULT 0,
	`powerUpsCollected` int DEFAULT 0,
	`bossesDefeated` int DEFAULT 0,
	`highestWaveInfinite` int DEFAULT 0,
	`highestScoreCampaign` bigint DEFAULT 0,
	`highestScoreInfinite` bigint DEFAULT 0,
	`totalPlayTimeSeconds` int DEFAULT 0,
	`lastPlayedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_stats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `replay_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`replayId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `replay_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`playerSlot` int NOT NULL,
	`isReady` boolean DEFAULT false,
	`isHost` boolean DEFAULT false,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_players_id` PRIMARY KEY(`id`)
);
