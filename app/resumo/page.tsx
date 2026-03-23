import { db } from "@/lib/db";
import MacroChart from "@/components/MacroChart";

export default async function ResumoPage() {
  const summaries = await db.dailySummary.findMany({
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      proteina: true,
      gorduras: true,
      carboidratos: true,
    },
  });

  // Compute averages for Macro Balance card
  const avg =
    summaries.length > 0
      ? summaries.reduce(
          (acc, s) => ({
            proteina: acc.proteina + s.proteina,
            gorduras: acc.gorduras + s.gorduras,
            carboidratos: acc.carboidratos + s.carboidratos,
          }),
          { proteina: 0, gorduras: 0, carboidratos: 0 },
        )
      : null;

  const avgProteina = avg ? avg.proteina / summaries.length : 0;
  const avgGorduras = avg ? avg.gorduras / summaries.length : 0;
  const avgCarboidratos = avg ? avg.carboidratos / summaries.length : 0;
  const avgKcal = avgProteina * 4 + avgCarboidratos * 4 + avgGorduras * 9;

  const protPct =
    avgKcal > 0 ? Math.round(((avgProteina * 4) / avgKcal) * 100) : 0;
  const gordPct =
    avgKcal > 0 ? Math.round(((avgGorduras * 9) / avgKcal) * 100) : 0;
  const carbPct =
    avgKcal > 0 ? Math.round(((avgCarboidratos * 4) / avgKcal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A3A2A] tracking-tight">
          Intelig&ecirc;ncia{" "}
          <span className="text-green-600">Nutricional.</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hist&oacute;rico sincronizado de macronutrientes
        </p>
      </div>

      {summaries.length === 0 ? (
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
          {/* Dark green Macro Balance card */}
          <div className="bg-[#1A3A2A] rounded-2xl p-6 text-white lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300">
              Balan&ccedil;o M&eacute;dio
            </p>
            <p className="text-4xl font-bold mt-2">
              {Math.round(avgKcal).toLocaleString("pt-BR")}
            </p>
            <p className="text-green-300 text-sm mb-6">kcal / dia</p>

            <div className="space-y-3">
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
          </div>

          {/* Bar chart */}
          <div className="lg:col-span-2">
            <MacroChart data={summaries} />
          </div>
        </div>
      )}
    </div>
  );
}
