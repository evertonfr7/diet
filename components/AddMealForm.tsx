"use client";

import { useState } from "react";

type Props = {
  onAdd: (nome: string) => Promise<void>;
};

export default function AddMealForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    await onAdd(nome.trim());
    setNome("");
    setLoading(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border border-dashed border-green-300 rounded-2xl text-green-600 hover:bg-green-50 transition-colors text-sm font-medium"
      >
        + Adicionar Refeição
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm p-4 flex gap-2"
    >
      <input
        autoFocus
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da refeição (ex: Café da manhã)"
        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <button
        type="submit"
        disabled={loading || !nome.trim()}
        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "Adicionar"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setNome("");
        }}
        className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm"
      >
        Cancelar
      </button>
    </form>
  );
}
