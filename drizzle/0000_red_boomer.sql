CREATE TABLE IF NOT EXISTS "file" (
	"id" uuid,
	"name" text,
	"url" text,
	"author_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"avatar_url" text
);
