import { NextResponse } from 'next/server'
import { getRedis, getDayKey, getTodayDate } from '@/lib/redis'
import { db } from '@/lib/db'
import type { DayData } from '@/lib/types'

export async function POST() {
  try {
    const date = getTodayDate()
    const redis = getRedis()
    const dayData = await redis.get<DayData>(getDayKey(date))

    if (!dayData || dayData.refeicoes.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma refeição registrada para sincronizar.' },
        { status: 400 },
      )
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

    const record = existing
      ? await db.syncRecord.update({
          where: { id: existing.id },
          data: { proteina, gorduras, carboidratos, agua, syncedAt: new Date() },
        })
      : await db.syncRecord.create({
          data: { dailySummaryId: summary.id, proteina, gorduras, carboidratos, agua },
        })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
