import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema.js'
import { getRequestEvent } from '@tanstack/react-start/server'

export function getDb() {
  const event = getRequestEvent()
  const env = (event?.context as any)?.cloudflare?.env as { DB: D1Database }
  if (!env?.DB) throw new Error('D1 database binding "DB" not found in Cloudflare env')
  return drizzle(env.DB, { schema })
}

// Keep a named export for convenience
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return (getDb() as any)[prop]
  },
})
