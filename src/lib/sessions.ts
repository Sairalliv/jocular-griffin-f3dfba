import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../../db/index.js'
import { sessions } from '../../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { getWebRequest } from '@tanstack/react-start/server'

function getCloudflareEnv() {
  const req = getWebRequest() as any
  return req?.cloudflare?.env as { DB: D1Database }
}

export const getSessions = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z.object({ userName: z.string(), weekStart: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = getDb(getCloudflareEnv())
    return await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userName, data.userName), eq(sessions.weekStart, data.weekStart)))
      .orderBy(sessions.day, sessions.startHour)
  })

const NewSessionSchema = z.object({
  userName: z.string().min(1),
  weekStart: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(['study', 'exercise', 'social', 'rest', 'work', 'hobby', 'meal']),
  day: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  durationHours: z.number().int().min(1).max(12),
})

export const addSession = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => NewSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb(getCloudflareEnv())
    const result = await db
      .insert(sessions)
      .values({
        userName: data.userName,
        weekStart: data.weekStart,
        title: data.title,
        category: data.category,
        day: data.day,
        startHour: data.startHour,
        durationHours: data.durationHours,
      })
      .returning()
    return result[0]
  })

export const deleteSession = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: z.number() }).parse(data))
  .handler(async ({ data }) => {
    const db = getDb(getCloudflareEnv())
    await db.delete(sessions).where(eq(sessions.id, data.id))
    return { ok: true }
  })
