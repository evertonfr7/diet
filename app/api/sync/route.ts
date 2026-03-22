import { NextResponse } from 'next/server'
import { getRedis, getDayKey, getTodayDate, DAY_TTL } from '@/lib/redis'
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
      update: { proteina, gorduras, carboidratos },
      create: { date, proteina, gorduras, carboidratos },
    })

    // Reseta as refeições do dia no Redis (mantém chave com array vazio)
    await redis.set(getDayKey(date), { refeicoes: [] }, { ex: DAY_TTL })

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
