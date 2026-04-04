"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  onAdd: (data: { label?: string; proteina: number; gorduras: number; carboidratos: number }) => void;
  onClose: () => void;
};

export default function AddLooseMacrosModal({ onAdd, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [proteina, setProteina] = useState("");
  const [gorduras, setGorduras] = useState("");
  const [carboidratos, setCarboidratos] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const calorias =
    (parseFloat(proteina) || 0) * 4 +
    (parseFloat(carboidratos) || 0) * 4 +
    (parseFloat(gorduras) || 0) * 9;

  const isValid =
    (parseFloat(proteina) || 0) > 0 ||
    (parseFloat(gorduras) || 0) > 0 ||
    (parseFloat(carboidratos) || 0) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onAdd({
      label: label.trim() || undefined,
      proteina: parseFloat(proteina) || 0,
      gorduras: parseFloat(gorduras) || 0,
      carboidratos: parseFloat(carboidratos) || 0,
    });
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Macros avulsos</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Descrição (opcional)
            </label>
            <input
              ref={inputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Suplemento"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A2A]/30"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-blue-600 mb-1">
                Proteína (g)
              </label>
              <input
                type="number"
                value={proteina}
                onChange={(e) => setProteina(e.target.value)}
                placeholder="0"
                min={0}
                step={0.1}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-yellow-600 mb-1">
                Gordura (g)
              </label>
              <input
                type="number"
                value={gorduras}
                onChange={(e) => setGorduras(e.target.value)}
                placeholder="0"
                min={0}
                step={0.1}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-500 mb-1">
                Carb (g)
              </label>
              <input
                type="number"
                value={carboidratos}
                onChange={(e) => setCarboidratos(e.target.value)}
                placeholder="0"
                min={0}
                step={0.1}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {isValid && (
            <p className="text-xs text-gray-400 text-right">
              ≈ {Math.round(calorias)} kcal
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-3 bg-[#1A3A2A] hover:bg-[#1A3A2A]/90 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
