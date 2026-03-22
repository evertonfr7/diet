"use client";

import { useState } from "react";
import type { Food } from "@/lib/types";

type Props = {
  onSuccess: (food: Food) => void;
};

const MACRO_FIELDS = [
  {
    field: "proteina",
    label: "Proteína (g)",
    ringColor: "focus:ring-green-400",
  },
  {
    field: "gorduras",
    label: "Gorduras (g)",
    ringColor: "focus:ring-amber-400",
  },
  {
    field: "carboidratos",
    label: "Carboidratos (g)",
    ringColor: "focus:ring-blue-400",
  },
] as const;

export default function FoodForm({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    proteina: "",
    gorduras: "",
    carboidratos: "",
  });
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState("");

  const allZero =
    form.nome &&
    !parseFloat(form.proteina) &&
    !parseFloat(form.gorduras) &&
    !parseFloat(form.carboidratos);

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleEstimate() {
    if (form.nome.trim().length < 2) return;
    setEstimating(true);
    setError("");
    try {
      const res = await fetch("/api/foods/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.nome.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ?? "Não foi possível estimar. Preencha manualmente.",
        );
        return;
      }
      setForm((prev) => ({
        ...prev,
        proteina: String(data.proteina),
        gorduras: String(data.gorduras),
        carboidratos: String(data.carboidratos),
      }));
    } catch {
      setError("Não foi possível estimar. Preencha manualmente.");
    } finally {
      setEstimating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      nome: form.nome.trim(),
      proteina: parseFloat(form.proteina) || 0,
      gorduras: parseFloat(form.gorduras) || 0,
      carboidratos: parseFloat(form.carboidratos) || 0,
    };
    if (!payload.nome) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const food: Food = await res.json();
      onSuccess(food);
      setForm({ nome: "", proteina: "", gorduras: "", carboidratos: "" });
      setOpen(false);
    } catch {
      setError("Erro ao salvar alimento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
      >
        + Novo alimento
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cadastrar alimento</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
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
              value={form.nome}
              onChange={handleChange("nome")}
              placeholder="ex: Frango grelhado"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <p className="text-xs text-gray-400">Macros por 100g do alimento:</p>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleEstimate}
              disabled={estimating || form.nome.trim().length < 2}
              className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
            >
              {estimating ? "Estimando..." : "✨ Estimar com IA"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {MACRO_FIELDS.map(({ field, label, ringColor }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form[field]}
                  onChange={handleChange(field)}
                  placeholder="0"
                  className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
                />
              </div>
            ))}
          </div>

          {allZero && (
            <p className="text-xs text-amber-500">
              ⚠ Todos os macros estão zerados. Confirme se está correto.
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !form.nome.trim()}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando..." : "Salvar alimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
