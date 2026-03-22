"use client";

import { useState, useEffect } from "react";
import type { MacroTargets } from "@/lib/types";

const FIELDS: {
  key: keyof MacroTargets;
  label: string;
  unit: string;
  color: string;
}[] = [
  {
    key: "calorias",
    label: "Calorias",
    unit: "kcal",
    color: "focus:ring-green-500",
  },
  {
    key: "proteina",
    label: "Proteínas",
    unit: "g",
    color: "focus:ring-blue-500",
  },
  {
    key: "carboidratos",
    label: "Carboidratos",
    unit: "g",
    color: "focus:ring-amber-400",
  },
  {
    key: "gorduras",
    label: "Gorduras",
    unit: "g",
    color: "focus:ring-orange-400",
  },
];

const DEFAULT: MacroTargets = {
  calorias: 2400,
  proteina: 200,
  carboidratos: 300,
  gorduras: 100,
};

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<MacroTargets>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setForm(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(key: keyof MacroTargets) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: Number(e.target.value) }));
      setMessage(null);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const { key, label } of FIELDS) {
      if (!form[key] || form[key] <= 0) {
        setMessage({
          type: "error",
          text: `${label} deve ser maior que zero.`,
        });
        return;
      }
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error ?? "Erro ao salvar configurações.",
        });
      } else {
        setMessage({ type: "success", text: "Metas salvas com sucesso!" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-3xl font-bold text-[#1A3A2A] tracking-tight">
          Configurações
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Defina suas metas diárias de macronutrientes
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
          Metas diárias
        </h2>

        {loading ? (
          <div className="space-y-4">
            {FIELDS.map(({ key }) => (
              <div
                key={key}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map(({ key, label, unit, color }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                  <span className="text-xs text-gray-400 ml-1">({unit})</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form[key]}
                  onChange={handleChange(key)}
                  required
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${color} transition-shadow`}
                />
              </div>
            ))}

            {message && (
              <div
                className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1A3A2A] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors mt-2"
            >
              {saving ? "Salvando..." : "Salvar metas"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
