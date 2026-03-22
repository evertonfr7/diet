import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const FoodSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  proteina: z.number().min(0),
  gorduras: z.number().min(0),
  carboidratos: z.number().min(0),
  unidade: z.enum(['g', 'ml']).default('g'),
})

export async function GET() {
  const foods = await db.food.findMany({ orderBy: { nome: 'asc' } })
  return NextResponse.json(foods)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = FoodSchema.parse(body)
    const food = await db.food.create({ data })
    return NextResponse.json(food, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
