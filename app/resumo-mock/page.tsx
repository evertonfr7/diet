import MacroChart from "@/components/MacroChart";
import type { DailySummary } from "@/lib/types";

const MOCK_SUMMARIES: DailySummary[] = [
  { id: 1, date: "08/03", proteina: 142, gorduras: 68, carboidratos: 210 },
  { id: 2, date: "09/03", proteina: 178, gorduras: 55, carboidratos: 245 },
  { id: 3, date: "10/03", proteina: 165, gorduras: 72, carboidratos: 198 },
  { id: 4, date: "11/03", proteina: 190, gorduras: 60, carboidratos: 230 },
  { id: 5, date: "12/03", proteina: 155, gorduras: 80, carboidratos: 260 },
  { id: 6, date: "13/03", proteina: 135, gorduras: 50, carboidratos: 180 },
  { id: 7, date: "14/03", proteina: 172, gorduras: 65, carboidratos: 220 },
  { id: 8, date: "15/03", proteina: 185, gorduras: 70, carboidratos: 240 },
  { id: 9, date: "16/03", proteina: 160, gorduras: 58, carboidratos: 215 },
  { id: 10, date: "17/03", proteina: 195, gorduras: 62, carboidratos: 250 },
  { id: 11, date: "18/03", proteina: 148, gorduras: 75, carboidratos: 195 },
  { id: 12, date: "19/03", proteina: 170, gorduras: 55, carboidratos: 235 },
  { id: 13, date: "20/03", proteina: 182, gorduras: 68, carboidratos: 242 },
  { id: 14, date: "21/03", proteina: 175, gorduras: 63, carboidratos: 228 },
];

export default function ResumoMockPage() {
  const summaries = MOCK_SUMMARIES;

  const avg = summaries.reduce(
    (acc, s) => ({
      proteina: acc.proteina + s.proteina,
      gorduras: acc.gorduras + s.gorduras,
      carboidratos: acc.carboidratos + s.carboidratos,
    }),
    { proteina: 0, gorduras: 0, carboidratos: 0 },
  );

  const avgProteina = avg.proteina / summaries.length;
  const avgGorduras = avg.gorduras / summaries.length;
  const avgCarboidratos = avg.carboidratos / summaries.length;
  const avgKcal = avgProteina * 4 + avgCarboidratos * 4 + avgGorduras * 9;

  const protPct = Math.round(((avgProteina * 4) / avgKcal) * 100);
  const gordPct = Math.round(((avgGorduras * 9) / avgKcal) * 100);
  const carbPct = Math.round(((avgCarboidratos * 4) / avgKcal) * 100);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold text-[#1A3A2A] tracking-tight">
            Inteligência <span className="text-green-600">Nutricional.</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Histórico sincronizado de macronutrientes
          </p>
        </div>
        <span className="self-start text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
          dados mock
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dark green Macro Balance card */}
        <div className="bg-[#1A3A2A] rounded-2xl p-6 text-white lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-300">
            Balanço Médio
          </p>
          <p className="text-4xl font-bold mt-2">
            {Math.round(avgKcal).toLocaleString("pt-BR")}
          </p>
          <p className="text-green-300 text-sm mb-6">kcal / dia</p>

          <div className="space-y-3">
            {[
              { label: "Proteína", pct: protPct, color: "bg-blue-400" },
              { label: "Gorduras", pct: gordPct, color: "bg-amber-400" },
              { label: "Carboidratos", pct: carbPct, color: "bg-green-400" },
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
    </div>
  );
}
