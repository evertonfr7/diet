"use client";

import type { Meal } from "@/lib/types";

type Props = {
  meal: Meal;
  onAddItem: (mealId: string) => void;
  onRemoveItem: (mealId: string, itemId: string) => void;
  onRemoveMeal: (mealId: string) => void;
};

export default function MealSection({
  meal,
  onAddItem,
  onRemoveItem,
  onRemoveMeal,
}: Props) {
  const mealProtein = meal.itens.reduce((s, i) => s + i.proteina, 0);
  const mealFat = meal.itens.reduce((s, i) => s + i.gorduras, 0);
  const mealCarbs = meal.itens.reduce((s, i) => s + i.carboidratos, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">{meal.nome}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">
            P {Math.round(mealProtein)}g · G {Math.round(mealFat)}g · C{" "}
            {Math.round(mealCarbs)}g
          </span>
          <button
            onClick={() => onAddItem(meal.id)}
            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-md font-medium transition-colors"
          >
            + Alimento
          </button>
          <button
            onClick={() => onRemoveMeal(meal.id)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors px-1"
            aria-label="Remover refeição"
          >
            ✕
          </button>
        </div>
      </div>

      {meal.itens.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400 italic">
          Nenhum alimento adicionado.
        </p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {meal.itens.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-gray-700">{item.nome}</span>
                <span className="text-gray-400 ml-1">({item.quantidade}g)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>P {Math.round(item.proteina)}g</span>
                <span>G {Math.round(item.gorduras)}g</span>
                <span>C {Math.round(item.carboidratos)}g</span>
                <span className="text-gray-400">
                  {Math.round(
                    item.proteina * 4 +
                      item.carboidratos * 4 +
                      item.gorduras * 9,
                  )}{" "}
                  kcal
                </span>
                <button
                  onClick={() => onRemoveItem(meal.id, item.id)}
                  className="text-red-400 hover:text-red-600 transition-colors ml-1"
                  aria-label="Remover alimento"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
