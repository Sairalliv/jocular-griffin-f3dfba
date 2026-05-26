ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_name" text NOT NULL DEFAULT 'default';
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "week_start" text NOT NULL DEFAULT to_char(date_trunc('week', CURRENT_DATE), 'YYYY-MM-DD');
