import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const summaries = await db.dailySummary.findMany({
    orderBy: { date: 'asc' },
    select: { id: true, date: true, proteina: true, gorduras: true, carboidratos: true },
  })
  return NextResponse.json(summaries)
}
