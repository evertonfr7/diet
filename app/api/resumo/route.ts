import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const records = await db.syncRecord.findMany({
    include: {
      dailySummary: {
        select: { date: true },
      },
    },
    orderBy: { syncedAt: 'asc' },
  })
  return NextResponse.json(records)
}
