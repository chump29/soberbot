CREATE TABLE `substances` (
	`date` text(10) NOT NULL,
	`id` integer PRIMARY KEY,
	`name` text(30) NOT NULL,
	`user_id` text(19) NOT NULL,
	CONSTRAINT `fk_substances_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
	CONSTRAINT `idx_user_id_name` UNIQUE(`user_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY,
	`user_id` text(19) NOT NULL UNIQUE,
	`user_name` text(32) NOT NULL
);
