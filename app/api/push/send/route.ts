import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { Receiver } from '@upstash/qstash'
import { getRedis, PUSH_SUBSCRIPTION_KEY, PUSH_SCHEDULE_ID_KEY } from '@/lib/redis'

type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

function getVapid() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subject) throw new Error('VAPID env vars not configured')
  return { pub, priv, subject }
}

export async function POST(request: Request) {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY

  if (!currentKey || !nextKey) {
    return NextResponse.json({ error: 'QStash signing keys not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('upstash-signature') ?? ''

  const receiver = new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey })
  try {
    await receiver.verify({ signature, body })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const vapid = getVapid()
  webpush.setVapidDetails(vapid.subject, vapid.pub, vapid.priv)

  const redis = getRedis()
  const subscription = await redis.get<StoredSubscription>(PUSH_SUBSCRIPTION_KEY)

  if (!subscription) {
    return NextResponse.json({ ok: true, skipped: 'no-subscription' })
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: '💧 Hora de beber água!',
        body: 'Mantenha-se hidratado para um melhor desempenho.',
      }),
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired — clean up
      await redis.del(PUSH_SUBSCRIPTION_KEY)
      const scheduleId = await redis.get<string>(PUSH_SCHEDULE_ID_KEY)
      if (scheduleId) {
        await redis.del(PUSH_SCHEDULE_ID_KEY)
      }
    }
    console.error('[push/send] error sending notification:', error)
    return NextResponse.json({ ok: false })
  }
}
