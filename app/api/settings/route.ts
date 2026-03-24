import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getRedis } from '@/lib/redis'

const LEGACY_SETTINGS_KEY = 'diet:settings'

const SettingsSchema = z.object({
  waterGoal: z.number().positive().int(),
  waterNotifEnabled: z.boolean(),
  waterNotifInterval: z.number().positive().int(),
  calorieTarget: z.number().positive().int(),
  proteinTarget: z.number().positive().int(),
  carbTarget: z.number().positive().int(),
  fatTarget: z.number().positive().int(),
})

async function migrateFromRedis(): Promise<void> {
  try {
    const redis = getRedis()
    const stored = await redis.get<LegacyMacroTargets>(LEGACY_SETTINGS_KEY)
    if (stored) {
      await db.settings.upsert({
        where: { id: 1 },
        update: {
          calorieTarget: stored.calorias,
          proteinTarget: stored.proteina,
          carbTarget: stored.carboidratos,
          fatTarget: stored.gorduras,
        },
        create: {
          id: 1,
          calorieTarget: stored.calorias,
          proteinTarget: stored.proteina,
          carbTarget: stored.carboidratos,
          fatTarget: stored.gorduras,
        },
      })
    }
  } catch {
    // Ignore migration errors
  }
}

export async function GET() {
  try {
    let settings = await db.settings.findUnique({ where: { id: 1 } })
    
    if (!settings) {
      await migrateFromRedis()
      settings = await db.settings.findUnique({ where: { id: 1 } })
    }
    
    if (!settings) {
      settings = await db.settings.create({
        data: {
          id: 1,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const data = SettingsSchema.parse(body)

    const settings = await db.settings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    })

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type LegacyMacroTargets = {
  calorias: number
  proteina: number
  carboidratos: number
  gorduras: number
}
