"use client";

import { useState } from "react";
import type { Meal } from "@/lib/types";

type Props = {
  meal: Meal;
  onAddItem: (mealId: string) => void;
  onParseMeal: (mealId: string) => void;
  onRemoveItem: (mealId: string, itemId: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onSaveAsFood: (meal: Meal) => Promise<void>;
};

export default function MealSection({
  meal,
  onAddItem,
  onParseMeal,
  onRemoveItem,
  onRemoveMeal,
  onSaveAsFood,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveAsFood(meal);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } finally {
      setSaving(false);
    }
  }
  const mealProtein = meal.itens.reduce((s, i) => s + i.proteina, 0);
  const mealFat = meal.itens.reduce((s, i) => s + i.gorduras, 0);
  const mealCarbs = meal.itens.reduce((s, i) => s + i.carboidratos, 0);
  const mealKcal = Math.round(mealProtein * 4 + mealCarbs * 4 + mealFat * 9);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Meal header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{meal.nome}</h3>
          {meal.itens.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {mealKcal} kcal · P {Math.round(mealProtein)}g · G{" "}
              {Math.round(mealFat)}g · C {Math.round(mealCarbs)}g
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddItem(meal.id)}
            className="text-xs border border-green-200 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-xl font-medium transition-colors"
          >
            + Alimento
          </button>
          <button
            onClick={() => onParseMeal(meal.id)}
            className="text-xs border border-purple-200 text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-xl font-medium transition-colors"
            title="Adicionar refeição por descrição em texto"
          >
            ✨ por texto
          </button>
          <button
            onClick={handleSave}
            disabled={saving || meal.itens.length === 0}
            className="text-xs border border-purple-200 text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-xl font-medium transition-colors disabled:opacity-40"
            title="Salvar refeição como alimento"
          >
            {savedOk ? "✓ Salvo" : saving ? "..." : "💾 Salvar"}
          </button>
          <button
            onClick={() => onRemoveMeal(meal.id)}
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
            aria-label="Remover refeição"
          >
            ✕
          </button>
        </div>
      </div>

      {meal.itens.length === 0 ? (
        <p className="px-5 pb-4 text-sm text-gray-400">
          Nenhum alimento adicionado ainda.
        </p>
      ) : (
        <ul className="border-t border-gray-50 divide-y divide-gray-50">
          {meal.itens.map((item) => {
            const itemKcal = Math.round(
              item.proteina * 4 + item.carboidratos * 4 + item.gorduras * 9,
            );
            return (
              <li
                key={item.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-gray-800">
                    {item.nome}
                  </span>
                  <span className="text-xs text-gray-400 ml-1.5">
                    {item.quantidade}
                    {item.unidade ?? "g"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs ml-3 flex-shrink-0">
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">
                    P {Math.round(item.proteina)}g
                  </span>
                  <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-medium">
                    G {Math.round(item.gorduras)}g
                  </span>
                  <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-medium">
                    C {Math.round(item.carboidratos)}g
                  </span>
                  <span className="text-gray-400 ml-0.5">{itemKcal} kcal</span>
                  <button
                    onClick={() => onRemoveItem(meal.id, item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                    aria-label="Remover alimento"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
