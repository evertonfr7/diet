import { NextResponse } from 'next/server'
import { getRedis, SYNC_SCHEDULE_ID_KEY } from '@/lib/redis'

const SYNC_CRON = process.env.SYNC_CRON ?? '59 23 * * *'
const SYNC_TZ = process.env.TZ_LOCAL ?? 'UTC'

type StoredSchedule = { id: string; cron: string; tz: string }

function getQStashToken() {
  const token = process.env.QSTASH_TOKEN
  if (!token) throw new Error('QSTASH_TOKEN not configured.')
  return token
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
  if (!url) throw new Error('Base URL not configured. Set NEXT_PUBLIC_BASE_URL or deploy to Vercel.')
  return url.startsWith('http') ? url : `https://${url}`
}

async function qstashCreateSchedule(dest: string, cron: string, tz: string): Promise<string> {
  const token = getQStashToken()
  const res = await fetch(`https://qstash.upstash.io/v2/schedules/${encodeURIComponent(dest)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Upstash-Cron': cron,
      'Upstash-Schedule-Timezone': tz,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QStash error ${res.status}: ${text}`)
  }
  const data = await res.json() as { scheduleId: string }
  return data.scheduleId
}

async function qstashDeleteSchedule(scheduleId: string): Promise<void> {
  const token = getQStashToken()
  await fetch(`https://qstash.upstash.io/v2/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})
}

export async function POST() {
  try {
    const redis = getRedis()
    const stored = await redis.get<StoredSchedule>(SYNC_SCHEDULE_ID_KEY)

    // Same cron + timezone already scheduled — nothing to do
    if (stored?.cron === SYNC_CRON && stored?.tz === SYNC_TZ) {
      return NextResponse.json({ ok: true, scheduleId: stored.id, existing: true })
    }

    // Cron or timezone changed (or no schedule yet) — delete old and create new
    if (stored?.id) {
      await qstashDeleteSchedule(stored.id)
    }

    const dest = `${getBaseUrl()}/api/sync/background`
    const scheduleId = await qstashCreateSchedule(dest, SYNC_CRON, SYNC_TZ)

    await redis.set(SYNC_SCHEDULE_ID_KEY, { id: scheduleId, cron: SYNC_CRON, tz: SYNC_TZ })

    return NextResponse.json({ ok: true, scheduleId })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const redis = getRedis()
    const stored = await redis.get<StoredSchedule>(SYNC_SCHEDULE_ID_KEY)
    if (stored?.id) {
      await qstashDeleteSchedule(stored.id)
      await redis.del(SYNC_SCHEDULE_ID_KEY)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
