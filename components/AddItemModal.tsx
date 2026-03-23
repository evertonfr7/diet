"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import type { Food } from "@/lib/types";

type Props = {
  mealId: string;
  mealName: string;
  foods: Food[];
  onAdd: (
    mealId: string,
    alimentoId: number,
    quantidade: number,
  ) => Promise<void>;
  onClose: () => void;
};

export default function AddItemModal({
  mealId,
  mealName,
  foods,
  onAdd,
  onClose,
}: Props) {
  const [alimentoId, setAlimentoId] = useState<number | "">("");
  const [quantidade, setQuantidade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Função para normalizar texto (remover acentos e case-insensitive)
  function normalize(str: string) {
    return str
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  }

  const filteredFoods = useMemo(() => {
    if (!search.trim()) return foods;
    const s = normalize(search);
    return foods.filter((f) => normalize(f.nome).includes(s));
  }, [foods, search]);

  const selectedFood = foods.find((f) => f.id === alimentoId);
  const unidade = selectedFood?.unidade ?? "g";
  const qty = parseFloat(quantidade) || 0;
  const preview =
    selectedFood && qty > 0
      ? {
          proteina: (selectedFood.proteina * qty) / 100,
          gorduras: (selectedFood.gorduras * qty) / 100,
          carboidratos: (selectedFood.carboidratos * qty) / 100,
        }
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alimentoId || !quantidade) return;
    if (qty <= 0) {
      setError("Informe uma quantidade válida.");
      return;
    }
    setLoading(true);
    setError("");
    await onAdd(mealId, alimentoId as number, qty);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Adicionar alimento a &quot;{mealName}&quot;
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {foods.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Nenhum alimento cadastrado. Cadastre um alimento primeiro.
            </p>
          ) : (
            <>
              {/* Campo de busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar alimento
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alimento
                </label>
                <select
                  value={alimentoId}
                  onChange={(e) =>
                    setAlimentoId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                >
                  <option value="">Selecione...</option>
                  {filteredFoods.length === 0 ? (
                    <option disabled value="">
                      Nenhum alimento encontrado
                    </option>
                  ) : (
                    filteredFoods.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} (P:{f.proteina}g · G:{f.gorduras}g · C:
                        {f.carboidratos}g / 100{f.unidade ?? "g"})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade ({unidade})
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(unidade === "ml"
                    ? [100, 150, 200, 250, 330, 500]
                    : [30, 50, 100, 150, 200, 300]
                  ).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setQuantidade(String(v))}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        quantidade === String(v)
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                      }`}
                    >
                      {v}
                      {unidade}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="ex: 150"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </div>

              {preview && (
                <div className="bg-gray-50 rounded-lg px-4 py-2 text-xs text-gray-500 flex gap-4">
                  <span>P {Math.round(preview.proteina)}g</span>
                  <span>G {Math.round(preview.gorduras)}g</span>
                  <span>C {Math.round(preview.carboidratos)}g</span>
                  <span className="text-gray-400">
                    {Math.round(
                      preview.proteina * 4 +
                        preview.carboidratos * 4 +
                        preview.gorduras * 9,
                    )}{" "}
                    kcal
                  </span>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading || !alimentoId || !quantidade}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Adicionando..." : "Adicionar"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
