import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { Client } from '@upstash/qstash'
import { z } from 'zod'
import { getRedis, PUSH_SUBSCRIPTION_KEY, PUSH_SCHEDULE_ID_KEY } from '@/lib/redis'

const SubscribeBodySchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  intervalMinutes: z.number().int().min(1).max(1440),
})

function getVapid() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subject) {
    throw new Error('VAPID env vars not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.')
  }
  return { pub, priv, subject }
}

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

function toCron(minutes: number): string {
  if (minutes <= 59) return `*/${minutes} * * * *`
  const hours = Math.max(1, Math.round(minutes / 60))
  return `0 */${hours} * * *`
}

export async function POST(request: Request) {
  try {
    const vapid = getVapid()
    webpush.setVapidDetails(vapid.subject, vapid.pub, vapid.priv)

    const body = await request.json()
    const { subscription, intervalMinutes } = SubscribeBodySchema.parse(body)

    const redis = getRedis()
    const qstash = getQStashClient()

    // Cancel existing schedule if any
    const existingId = await redis.get<string>(PUSH_SCHEDULE_ID_KEY)
    if (existingId) {
      await qstash.schedules.delete(existingId).catch(() => { })
    }

    // Persist subscription
    await redis.set(PUSH_SUBSCRIPTION_KEY, subscription)

    // Create new QStash schedule
    const dest = `${getBaseUrl()}/api/push/send`
    const { scheduleId } = await qstash.schedules.create({
      destination: dest,
      cron: toCron(intervalMinutes),
      body: JSON.stringify({ type: 'WATER_REMINDER' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await redis.set(PUSH_SCHEDULE_ID_KEY, scheduleId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const redis = getRedis()
    const qstash = getQStashClient()

    const existingId = await redis.get<string>(PUSH_SCHEDULE_ID_KEY)
    if (existingId) {
      await qstash.schedules.delete(existingId).catch(() => { })
      await redis.del(PUSH_SCHEDULE_ID_KEY)
    }

    await redis.del(PUSH_SUBSCRIPTION_KEY)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
