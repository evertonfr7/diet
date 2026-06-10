import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateSchema = z.object({
  nome: z.string().min(1),
})

export async function GET() {
  const templates = await db.mealTemplate.findMany({ orderBy: { ordem: 'asc' } })
  return NextResponse.json(templates)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = CreateSchema.parse(body)
    const count = await db.mealTemplate.count()
    const template = await db.mealTemplate.create({
      data: { nome: data.nome, ordem: count },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
