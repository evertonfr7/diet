import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { Receiver } from '@upstash/qstash'
import { getRedis, getDayKey, getTodayDate, DAY_TTL, PUSH_SUBSCRIPTION_KEY, SYNC_SCHEDULE_ID_KEY } from '@/lib/redis'
import { db } from '@/lib/db'
import type { DayData } from '@/lib/types'

type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

async function sendSyncPush(success: boolean, noMeals: boolean) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subject) return

  const redis = getRedis()
  const subscription = await redis.get<StoredSubscription>(PUSH_SUBSCRIPTION_KEY)
  if (!subscription) return

  webpush.setVapidDetails(subject, pub, priv)

  const payload = noMeals
    ? null
    : success
      ? JSON.stringify({ type: 'SYNC_RESULT', success: true, title: '✅ Diário sincronizado!', body: 'Dados do dia salvos com sucesso.' })
      : JSON.stringify({ type: 'SYNC_RESULT', success: false, title: '⚠️ Falha ao sincronizar', body: 'Abra o app e sincronize manualmente.' })

  if (!payload) return

  await webpush.sendNotification(subscription, payload).catch(async (error) => {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 404 || statusCode === 410) {
      await redis.del(PUSH_SUBSCRIPTION_KEY)
    }
  })
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

  try {
    const date = getTodayDate()
    const redis = getRedis()
    const dayData = await redis.get<DayData>(getDayKey(date))

    if (!dayData || dayData.refeicoes.length === 0) {
      await sendSyncPush(false, true)
      return NextResponse.json({ ok: true, skipped: 'no-meals' })
    }

    let proteina = 0
    let gorduras = 0
    let carboidratos = 0

    for (const meal of dayData.refeicoes) {
      for (const item of meal.itens) {
        proteina += item.proteina
        gorduras += item.gorduras
        carboidratos += item.carboidratos
      }
    }

    const summary = await db.dailySummary.upsert({
      where: { date },
      update: {},
      create: { date },
    })

    const agua = dayData.agua ?? 0

    const existing = await db.syncRecord.findFirst({
      where: { dailySummaryId: summary.id },
    })

    existing
      ? await db.syncRecord.update({
          where: { id: existing.id },
          data: { proteina, gorduras, carboidratos, agua },
        })
      : await db.syncRecord.create({
          data: { dailySummaryId: summary.id, proteina, gorduras, carboidratos, agua },
        })

    await redis.set(getDayKey(date), { refeicoes: [], agua: 0 }, { ex: DAY_TTL })
    await redis.del(SYNC_SCHEDULE_ID_KEY)

    await sendSyncPush(true, false)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[sync/background] error:', error)
    await sendSyncPush(false, false).catch(() => { })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
