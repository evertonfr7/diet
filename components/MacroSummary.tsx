"use client";

import type { MacroTotals } from "@/lib/types";

type Props = {
  totals: MacroTotals;
};

function MacroCard({
  label,
  value,
  unit,
  colorClass,
}: {
  label: string;
  value: number;
  unit: string;
  colorClass: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border ${colorClass} p-4 flex flex-col items-center gap-1`}
    >
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold text-gray-900">
        {Math.round(value)}
      </span>
      <span className="text-xs text-gray-400">{unit}</span>
    </div>
  );
}

export default function MacroSummary({ totals }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MacroCard
        label="Calorias"
        value={totals.calorias}
        unit="kcal"
        colorClass="border-orange-200"
      />
      <MacroCard
        label="Proteína"
        value={totals.proteina}
        unit="g"
        colorClass="border-green-200"
      />
      <MacroCard
        label="Gorduras"
        value={totals.gorduras}
        unit="g"
        colorClass="border-amber-200"
      />
      <MacroCard
        label="Carboidratos"
        value={totals.carboidratos}
        unit="g"
        colorClass="border-blue-200"
      />
    </div>
  );
}
