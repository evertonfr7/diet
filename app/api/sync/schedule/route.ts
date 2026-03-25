import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { getRedis, SYNC_SCHEDULE_ID_KEY } from '@/lib/redis'

const SYNC_CRON = process.env.SYNC_CRON ?? '59 23 * * *'

type StoredSchedule = { id: string; cron: string }

function getQStashClient() {
  const token = process.env.QSTASH_TOKEN
  if (!token) throw new Error('QSTASH_TOKEN not configured.')
  return new Client({ token })
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
  if (!url) throw new Error('Base URL not configured. Set NEXT_PUBLIC_BASE_URL or deploy to Vercel.')
  return url.startsWith('http') ? url : `https://${url}`
}

export async function POST() {
  try {
    const redis = getRedis()
    const qstash = getQStashClient()

    const stored = await redis.get<StoredSchedule>(SYNC_SCHEDULE_ID_KEY)

    // Same cron already scheduled — nothing to do
    if (stored?.cron === SYNC_CRON) {
      return NextResponse.json({ ok: true, scheduleId: stored.id, existing: true })
    }

    // Cron changed (or no schedule yet) — delete old and create new
    if (stored?.id) {
      await qstash.schedules.delete(stored.id).catch(() => {})
    }

    const dest = `${getBaseUrl()}/api/sync/background`
    const timezone = process.env.TZ_LOCAL ?? 'UTC'

    const { scheduleId } = await qstash.schedules.create({
      destination: dest,
      cron: SYNC_CRON,
      // @ts-expect-error — timezone is supported by QStash but not yet typed in the SDK
      timezone,
    })

    await redis.set(SYNC_SCHEDULE_ID_KEY, { id: scheduleId, cron: SYNC_CRON })

    return NextResponse.json({ ok: true, scheduleId })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const redis = getRedis()
    const qstash = getQStashClient()

    const stored = await redis.get<StoredSchedule>(SYNC_SCHEDULE_ID_KEY)
    if (stored?.id) {
      await qstash.schedules.delete(stored.id).catch(() => {})
      await redis.del(SYNC_SCHEDULE_ID_KEY)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
