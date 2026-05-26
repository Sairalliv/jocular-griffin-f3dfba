CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"day" integer NOT NULL,
	"start_hour" integer NOT NULL,
	"duration_hours" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
