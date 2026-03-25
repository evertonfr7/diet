import { db } from "@/lib/db";
import MacroChart from "@/components/MacroChart";
import type { SyncRecord } from "@/lib/types";

export const revalidate = 300; // revalida a cada 5 minutos

type SyncRecordWithAgua = SyncRecord & {
  agua: number;
  dailySummary: { date: string };
};

export default async function ResumoPage() {
  const records = (await db.syncRecord.findMany({
    include: {
      dailySummary: {
        select: { date: true },
      },
    },
    orderBy: { syncedAt: "asc" },
  })) as SyncRecordWithAgua[];

  const chartData = records.map((r) => ({
    id: r.id,
    date: r.dailySummary.date,
    syncedAt: r.syncedAt,
    proteina: r.proteina,
    gorduras: r.gorduras,
    carboidratos: r.carboidratos,
    agua: r.agua ?? 0,
  }));

  const avg =
    records.length > 0
      ? records.reduce(
          (acc, r) => ({
            proteina: acc.proteina + r.proteina,
            gorduras: acc.gorduras + r.gorduras,
            carboidratos: acc.carboidratos + r.carboidratos,
            agua: acc.agua + (r.agua ?? 0),
          }),
          { proteina: 0, gorduras: 0, carboidratos: 0, agua: 0 },
        )
      : null;

  const avgProteina = avg ? avg.proteina / records.length : 0;
  const avgGorduras = avg ? avg.gorduras / records.length : 0;
  const avgCarboidratos = avg ? avg.carboidratos / records.length : 0;
  const avgAgua = avg ? avg.agua / records.length : 0;
  const avgKcal = avgProteina * 4 + avgCarboidratos * 4 + avgGorduras * 9;

  const protPct =
    avgKcal > 0 ? Math.round(((avgProteina * 4) / avgKcal) * 100) : 0;
  const gordPct =
    avgKcal > 0 ? Math.round(((avgGorduras * 9) / avgKcal) * 100) : 0;
  const carbPct =
    avgKcal > 0 ? Math.round(((avgCarboidratos * 4) / avgKcal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1A3A2A] tracking-tight">
          Intelig&ecirc;ncia{" "}
          <span className="text-green-600">Nutricional.</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hist&oacute;rico sincronizado de macronutrientes
        </p>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-400 text-lg">
            Nenhum dado sincronizado ainda.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Use o bot&atilde;o &quot;Sincronizar&quot; na p&aacute;gina inicial
            para registrar seus macros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#1A3A2A] rounded-2xl p-6 text-white lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300">
              Balan&ccedil;o M&eacute;dio
            </p>
            <p className="text-4xl font-bold mt-2">
              {Math.round(avgKcal).toLocaleString("pt-BR")}
            </p>
            <p className="text-green-300 text-sm mb-6">kcal / dia</p>

            <div className="space-y-3 mb-4">
              {[
                { label: "Proteína", pct: protPct, color: "bg-green-400" },
                { label: "Gorduras", pct: gordPct, color: "bg-amber-400" },
                { label: "Carboidratos", pct: carbPct, color: "bg-blue-400" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-green-200 mb-1">
                    <span>{label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-green-200 text-xs">
              <span>Água média:</span>
              <span className="font-bold text-white">
                {Math.round(avgAgua).toLocaleString("pt-BR")}
              </span>
              <span>ml / dia</span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <MacroChart data={chartData} />
          </div>
        </div>
      )}
    </div>
  );
}
