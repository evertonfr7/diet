import { db } from '@/lib/db'
import MacroChart from '@/components/MacroChart'

export default async function ResumoPage() {
  const summaries = await db.dailySummary.findMany({
    orderBy: { date: 'asc' },
    select: { id: true, date: true, proteina: true, gorduras: true, carboidratos: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resumo de Macros</h1>
      {summaries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">Nenhum dado sincronizado ainda.</p>
          <p className="text-gray-400 text-sm mt-1">
            Use o botão &quot;Sincronizar dia&quot; na página inicial para registrar seus macros.
          </p>
        </div>
      ) : (
        <MacroChart data={summaries} />
      )}
    </div>
  )
}
