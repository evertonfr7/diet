import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { getRedis, SYNC_SCHEDULE_ID_KEY } from '@/lib/redis'

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

    // Idempotent: return if schedule already exists
    const existingId = await redis.get<string>(SYNC_SCHEDULE_ID_KEY)
    if (existingId) {
      return NextResponse.json({ ok: true, scheduleId: existingId, existing: true })
    }

    const qstash = getQStashClient()

    const dest = `${getBaseUrl()}/api/sync/background`
    const timezone = process.env.TZ_LOCAL ?? 'UTC'

    const { scheduleId } = await qstash.schedules.create({
      destination: dest,
      cron: '59 23 * * *',
      // @ts-expect-error — timezone is supported by QStash but not yet typed in the SDK
      timezone,
    })

    await redis.set(SYNC_SCHEDULE_ID_KEY, scheduleId)

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

    const existingId = await redis.get<string>(SYNC_SCHEDULE_ID_KEY)
    if (existingId) {
      await qstash.schedules.delete(existingId).catch(() => { })
      await redis.del(SYNC_SCHEDULE_ID_KEY)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
