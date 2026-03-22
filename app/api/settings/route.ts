import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRedis, SETTINGS_KEY } from '@/lib/redis'
import type { MacroTargets } from '@/lib/types'

const DEFAULT_TARGETS: MacroTargets = {
  calorias: 2400,
  proteina: 200,
  carboidratos: 300,
  gorduras: 100,
}

const TargetsSchema = z.object({
  calorias: z.number().positive(),
  proteina: z.number().positive(),
  carboidratos: z.number().positive(),
  gorduras: z.number().positive(),
})

export async function GET() {
  try {
    const redis = getRedis()
    const stored = await redis.get<MacroTargets>(SETTINGS_KEY)
    return NextResponse.json(stored ?? DEFAULT_TARGETS)
  } catch {
    return NextResponse.json(DEFAULT_TARGETS)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const targets = TargetsSchema.parse(body)
    const redis = getRedis()
    await redis.set(SETTINGS_KEY, targets)
    return NextResponse.json(targets)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
