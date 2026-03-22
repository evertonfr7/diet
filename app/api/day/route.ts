import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { getRedis, getDayKey, getTodayDate, DAY_TTL } from '@/lib/redis'
import { db } from '@/lib/db'
import type { DayData, Meal, MealItem } from '@/lib/types'

async function getDayData(date: string): Promise<DayData> {
  const redis = getRedis()
  const data = await redis.get<DayData>(getDayKey(date))
  return data ?? { refeicoes: [] }
}

async function saveDayData(date: string, data: DayData): Promise<void> {
  const redis = getRedis()
  await redis.set(getDayKey(date), data, { ex: DAY_TTL })
}

export async function GET() {
  const date = getTodayDate()
  const data = await getDayData(date)
  return NextResponse.json(data)
}

const AddMealSchema = z.object({
  action: z.literal('addMeal'),
  nome: z.string().min(1),
})

const AddItemSchema = z.object({
  action: z.literal('addItem'),
  mealId: z.string(),
  alimentoId: z.number().int().positive(),
  quantidade: z.number().positive(),
})

const RemoveItemSchema = z.object({
  action: z.literal('removeItem'),
  mealId: z.string(),
  itemId: z.string(),
})

const RemoveMealSchema = z.object({
  action: z.literal('removeMeal'),
  mealId: z.string(),
})

const BulkItemSchema = z.object({
  nome: z.string().min(1),
  quantidade: z.number().positive(),
  unidade: z.enum(['g', 'ml']),
  proteina: z.number().min(0),
  gorduras: z.number().min(0),
  carboidratos: z.number().min(0),
})

const AddItemsBulkSchema = z.object({
  action: z.literal('addItemsBulk'),
  mealId: z.string(),
  itens: z.array(BulkItemSchema).min(1),
})

const ActionSchema = z.discriminatedUnion('action', [
  AddMealSchema,
  AddItemSchema,
  RemoveItemSchema,
  RemoveMealSchema,
  AddItemsBulkSchema,
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const action = ActionSchema.parse(body)
    const date = getTodayDate()
    const dayData = await getDayData(date)

    switch (action.action) {
      case 'addMeal': {
        const meal: Meal = { id: randomUUID(), nome: action.nome, itens: [] }
        dayData.refeicoes.push(meal)
        await saveDayData(date, dayData)
        return NextResponse.json(meal, { status: 201 })
      }

      case 'addItem': {
        const meal = dayData.refeicoes.find((m) => m.id === action.mealId)
        if (!meal) {
          return NextResponse.json({ error: 'Refeição não encontrada' }, { status: 404 })
        }
        const food = await db.food.findUnique({ where: { id: action.alimentoId } })
        if (!food) {
          return NextResponse.json({ error: 'Alimento não encontrado' }, { status: 404 })
        }
        const ratio = action.quantidade / 100
        const item: MealItem = {
          id: randomUUID(),
          alimentoId: food.id,
          nome: food.nome,
          quantidade: action.quantidade,
          proteina: food.proteina * ratio,
          gorduras: food.gorduras * ratio,
          carboidratos: food.carboidratos * ratio,
          unidade: (food.unidade ?? 'g') as 'g' | 'ml',
        }
        meal.itens.push(item)
        await saveDayData(date, dayData)
        return NextResponse.json(item, { status: 201 })
      }

      case 'removeItem': {
        const meal = dayData.refeicoes.find((m) => m.id === action.mealId)
        if (!meal) {
          return NextResponse.json({ error: 'Refeição não encontrada' }, { status: 404 })
        }
        meal.itens = meal.itens.filter((i) => i.id !== action.itemId)
        await saveDayData(date, dayData)
        return NextResponse.json({ ok: true })
      }

      case 'removeMeal': {
        dayData.refeicoes = dayData.refeicoes.filter((m) => m.id !== action.mealId)
        await saveDayData(date, dayData)
        return NextResponse.json({ ok: true })
      }

      case 'addItemsBulk': {
        const meal = dayData.refeicoes.find((m) => m.id === action.mealId)
        if (!meal) {
          return NextResponse.json({ error: 'Refeição não encontrada' }, { status: 404 })
        }
        const newItems: MealItem[] = action.itens.map((i) => ({
          id: randomUUID(),
          alimentoId: 0,
          nome: i.nome,
          quantidade: i.quantidade,
          unidade: i.unidade,
          proteina: i.proteina,
          gorduras: i.gorduras,
          carboidratos: i.carboidratos,
        }))
        meal.itens.push(...newItems)
        await saveDayData(date, dayData)
        return NextResponse.json(newItems, { status: 201 })
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
