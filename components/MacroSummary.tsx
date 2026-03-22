"use client";

import type { MacroTotals, MacroTargets } from "@/lib/types";

type Props = {
  totals: MacroTotals;
  targets: MacroTargets;
  waterIntake: number;
  waterGoal: number;
  onAddWater: (ml: number) => void;
};

function ProgressBar({
  value,
  max,
  colorClass,
}: {
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatWater(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1).replace(".", ",")} L`;
  return `${ml} ml`;
}

export default function MacroSummary({
  totals,
  targets,
  waterIntake,
  waterGoal,
  onAddWater,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Calorias — destaque */}
      <div className="sm:col-span-2 lg:col-span-1 bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Gasto Energético
        </p>
        <div className="flex items-end gap-1.5 mt-1">
          <span className="text-4xl font-bold text-[#1A3A2A]">
            {Math.round(totals.calorias).toLocaleString("pt-BR")}
          </span>
          <span className="text-sm text-gray-400 mb-1">
            / {targets.calorias.toLocaleString("pt-BR")} kcal
          </span>
        </div>
        <ProgressBar
          value={totals.calorias}
          max={targets.calorias}
          colorClass="bg-green-500"
        />
      </div>

      {/* Proteína */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1">
          <span>🥩</span> Proteína
        </p>
        <div className="flex items-end gap-1 mt-1">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(totals.proteina)}g
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            of {targets.proteina}g
          </span>
        </div>
        <ProgressBar
          value={totals.proteina}
          max={targets.proteina}
          colorClass="bg-blue-500"
        />
      </div>

      {/* Carboidratos */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1">
          <span>🌾</span> Carboidratos
        </p>
        <div className="flex items-end gap-1 mt-1">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(totals.carboidratos)}g
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            of {targets.carboidratos}g
          </span>
        </div>
        <ProgressBar
          value={totals.carboidratos}
          max={targets.carboidratos}
          colorClass="bg-amber-400"
        />
      </div>

      {/* Gorduras */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1">
          <span>🫒</span> Gorduras
        </p>
        <div className="flex items-end gap-1 mt-1">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(totals.gorduras)}g
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            of {targets.gorduras}g
          </span>
        </div>
        <ProgressBar
          value={totals.gorduras}
          max={targets.gorduras}
          colorClass="bg-orange-400"
        />
      </div>

      {/* Água */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1">
          <span>💧</span> Água
        </p>
        <div className="flex items-end gap-1 mt-1">
          <span className="text-2xl font-bold text-gray-900">
            {formatWater(waterIntake)}
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            of {formatWater(waterGoal)}
          </span>
        </div>
        <ProgressBar
          value={waterIntake}
          max={waterGoal}
          colorClass="bg-cyan-400"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onAddWater(200)}
            className="flex-1 text-xs bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-medium py-1.5 rounded-lg transition-colors"
          >
            +200ml
          </button>
          <button
            onClick={() => onAddWater(350)}
            className="flex-1 text-xs bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-medium py-1.5 rounded-lg transition-colors"
          >
            +350ml
          </button>
        </div>
      </div>
    </div>
  );
}
