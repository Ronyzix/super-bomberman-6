ALTER TABLE `coop_scores` MODIFY COLUMN `playerIds` json;--> statement-breakpoint
ALTER TABLE `coop_scores` MODIFY COLUMN `playerNames` json;--> statement-breakpoint
ALTER TABLE `player_progress` MODIFY COLUMN `unlockedLevels` json;--> statement-breakpoint
ALTER TABLE `player_progress` MODIFY COLUMN `achievements` json;