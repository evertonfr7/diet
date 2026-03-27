"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  onAdd: (ml: number) => void;
  onClose: () => void;
};

export default function AddWaterModal({ onAdd, onClose }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ml = parseInt(value, 10);
    if (!isNaN(ml) && ml > 0) {
      setLoading(true);
      onAdd(ml);
      onClose();
    }
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
          <h2 className="text-lg font-semibold text-gray-900">Adicionar água</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade (ml)
            </label>
            <input
              ref={inputRef}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex: 250"
              min={1}
              className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            {[100, 200, 250, 500].map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => setValue(ml.toString())}
                className="flex-1 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {ml}ml
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !value}
            className="w-full mt-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </button>
        </form>
      </div>
    </div>
  );
}
