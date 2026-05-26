import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { sessions } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

export const getSessions = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.select().from(sessions).orderBy(sessions.day, sessions.startHour)
  },
)

const NewSessionSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['study', 'exercise', 'social', 'rest', 'work', 'hobby', 'meal']),
  day: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  durationHours: z.number().int().min(1).max(12),
})

export const addSession = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => NewSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const result = await db.insert(sessions).values({
      title: data.title,
      category: data.category,
      day: data.day,
      startHour: data.startHour,
      durationHours: data.durationHours,
    }).returning()
    return result[0]
  })

export const deleteSession = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: z.number() }).parse(data))
  .handler(async ({ data }) => {
    await db.delete(sessions).where(eq(sessions.id, data.id))
    return { ok: true }
  })
