"use client";

import { Flame, Beef, Wheat, Droplets, GlassWater } from "lucide-react";
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
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
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
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Calorias — hero card */}
      <div className="col-span-2 lg:col-span-1 bg-[#1A3A2A] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-1.5">
          <Flame size={13} className="text-green-300" strokeWidth={2} />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-green-300">
            Calorias
          </p>
        </div>
        <div className="flex items-end gap-1.5 mt-1.5">
          <span className="text-4xl font-bold leading-none">
            {Math.round(totals.calorias).toLocaleString("pt-BR")}
          </span>
          <span className="text-sm text-green-300 mb-0.5">
            / {targets.calorias.toLocaleString("pt-BR")}
          </span>
        </div>
        <p className="text-[11px] text-green-400 mt-0.5">kcal</p>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-3">
          <div
            className="h-full rounded-full bg-green-400 transition-all"
            style={{
              width: `${targets.calorias > 0 ? Math.min(100, Math.round((totals.calorias / targets.calorias) * 100)) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Proteína */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-1.5">
          <Beef size={13} className="text-blue-400" strokeWidth={2} />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Proteína
          </p>
        </div>
        <div className="flex items-end gap-1 mt-1.5">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(totals.proteina)}g
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            / {targets.proteina}g
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
        <div className="flex items-center gap-1.5">
          <Wheat size={13} className="text-amber-400" strokeWidth={2} />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Carboidratos
          </p>
        </div>
        <div className="flex items-end gap-1 mt-1.5">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(totals.carboidratos)}g
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            / {targets.carboidratos}g
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
        <div className="flex items-center gap-1.5">
          <Droplets size={13} className="text-orange-400" strokeWidth={2} />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Gorduras
          </p>
        </div>
        <div className="flex items-end gap-1 mt-1.5">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(totals.gorduras)}g
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            / {targets.gorduras}g
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
        <div className="flex items-center gap-1.5">
          <GlassWater size={13} className="text-cyan-400" strokeWidth={2} />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Água
          </p>
        </div>
        <div className="flex items-end gap-1 mt-1.5">
          <span className="text-2xl font-bold text-gray-900">
            {formatWater(waterIntake)}
          </span>
          <span className="text-xs text-gray-400 mb-0.5">
            / {formatWater(waterGoal)}
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
            className="flex-1 text-xs bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-medium py-2 rounded-lg transition-colors"
          >
            +200ml
          </button>
          <button
            onClick={() => onAddWater(350)}
            className="flex-1 text-xs bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-medium py-2 rounded-lg transition-colors"
          >
            +350ml
          </button>
        </div>
      </div>
    </div>
  );
}
