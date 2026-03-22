"use client";

import { useState } from "react";

type ParsedItem = {
  nome: string;
  quantidade: number;
  unidade: "g" | "ml";
  proteina: number;
  gorduras: number;
  carboidratos: number;
};

type Props = {
  mealId: string;
  mealName: string;
  onAdd: (mealId: string, itens: ParsedItem[]) => Promise<void>;
  onClose: () => void;
};

export default function ParseMealModal({
  mealId,
  mealName,
  onAdd,
  onClose,
}: Props) {
  const [descricao, setDescricao] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itens, setItens] = useState<ParsedItem[] | null>(null);
  const [error, setError] = useState("");

  async function handleEstimate() {
    if (descricao.trim().length < 3) return;
    setEstimating(true);
    setError("");
    setItens(null);
    try {
      const res = await fetch("/api/meals/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: descricao.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ?? "Não foi possível interpretar. Tente novamente.",
        );
        return;
      }
      setItens(data.itens);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setEstimating(false);
    }
  }

  function handleRemoveItem(idx: number) {
    setItens((prev) => prev?.filter((_, i) => i !== idx) ?? null);
  }

  async function handleConfirm() {
    if (!itens || itens.length === 0) return;
    setSaving(true);
    try {
      await onAdd(mealId, itens);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const totalKcal = itens
    ? Math.round(
        itens.reduce(
          (s, i) => s + i.proteina * 4 + i.carboidratos * 4 + i.gorduras * 9,
          0,
        ),
      )
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">
              ✨ Refeição por texto
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{mealName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Descreva a refeição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                if (itens) setItens(null);
                setError("");
              }}
              placeholder="Ex: 2 ovos fritos, 2 fatias de bacon e um café sem açúcar"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Estimated items list */}
          {itens && itens.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Itens estimados
                </span>
                <span className="text-xs text-gray-400">
                  {totalKcal} kcal total
                </span>
              </div>
              <ul className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                {itens.map((item, idx) => {
                  const kcal = Math.round(
                    item.proteina * 4 +
                      item.carboidratos * 4 +
                      item.gorduras * 9,
                  );
                  return (
                    <li
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 bg-white"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.nome}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.quantidade}
                          {item.unidade} · {kcal} kcal
                        </p>
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
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                          aria-label="Remover item"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {itens && itens.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              Todos os itens foram removidos.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          {!itens ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEstimate}
                disabled={estimating || descricao.trim().length < 3}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {estimating ? "Estimando..." : "✨ Estimar com IA"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setItens(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ← Redigitar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || !itens || itens.length === 0}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving
                  ? "Adicionando..."
                  : `Adicionar ${itens.length} item${itens.length !== 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
