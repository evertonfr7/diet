"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Meal } from "@/lib/types";

type Props = {
  meal: Meal;
  onConfirm: (nome: string, quantidade?: number) => Promise<void>;
  onClose: () => void;
};

export default function SaveMealAsFoodModal({ meal, onConfirm, onClose }: Props) {
  const totalProtein = meal.itens.reduce((s, i) => s + i.proteina, 0);
  const totalFat = meal.itens.reduce((s, i) => s + i.gorduras, 0);
  const totalCarbs = meal.itens.reduce((s, i) => s + i.carboidratos, 0);
  const totalKcal = Math.round(totalProtein * 4 + totalCarbs * 4 + totalFat * 9);

  const totalWeight = meal.itens.reduce((s, i) => s + i.quantidade, 0);

  const [nome, setNome] = useState(meal.nome);
  const [porcao, setPorcao] = useState(totalWeight > 0 ? String(Math.round(totalWeight)) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const qty = parseFloat(porcao);
  const showPer100 = qty > 0 && qty !== 100;
  const per100 = showPer100
    ? {
        carbs: (totalCarbs / qty) * 100,
        protein: (totalProtein / qty) * 100,
        fat: (totalFat / qty) * 100,
      }
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onConfirm(nome.trim(), qty > 0 ? qty : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar alimento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Salvar como alimento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              required
            />
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-medium text-gray-500 mb-2">Total da refeição</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-400">Carbs</p>
                <p className="text-sm font-semibold text-gray-800">{Math.round(totalCarbs)}g</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Prot</p>
                <p className="text-sm font-semibold text-gray-800">{Math.round(totalProtein)}g</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Gord</p>
                <p className="text-sm font-semibold text-gray-800">{Math.round(totalFat)}g</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Kcal</p>
                <p className="text-sm font-semibold text-gray-800">{totalKcal}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porção (g)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={porcao}
              onChange={(e) => setPorcao(e.target.value)}
              placeholder="ex: 350"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              {porcao
                ? "Macros serão normalizados para por 100g"
                : "Deixe em branco para salvar os macros totais como estão"}
            </p>
          </div>

          {per100 && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-brand-700 mb-2">Por 100g</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-brand-400">Carbs</p>
                  <p className="text-sm font-semibold text-brand-800">{per100.carbs.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-xs text-brand-400">Prot</p>
                  <p className="text-sm font-semibold text-brand-800">{per100.protein.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-xs text-brand-400">Gord</p>
                  <p className="text-sm font-semibold text-brand-800">{per100.fat.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-xs text-brand-400">Kcal</p>
                  <p className="text-sm font-semibold text-brand-800">
                    {Math.round(per100.protein * 4 + per100.carbs * 4 + per100.fat * 9)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nome.trim()}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
