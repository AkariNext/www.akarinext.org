ALTER TABLE "file" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "file" ALTER COLUMN "id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "file" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "file" ALTER COLUMN "author_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar;