import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userName: text('user_name').notNull().default('default'),
  weekStart: text('week_start').notNull(), // YYYY-MM-DD (Monday of the week)
  title: text('title').notNull(),
  category: text('category').notNull(), // study | exercise | social | rest | work | hobby | meal
  day: integer('day').notNull(), // 0 = Mon, 6 = Sun
  startHour: integer('start_hour').notNull(), // 0–23
  durationHours: integer('duration_hours').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
