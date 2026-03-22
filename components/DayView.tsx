"use client";

import { useEffect, useState, useCallback } from "react";
import type { DayData, Food, MacroTotals } from "@/lib/types";
import MacroSummary from "./MacroSummary";
import MealSection from "./MealSection";
import AddMealForm from "./AddMealForm";
import AddItemModal from "./AddItemModal";
import FoodForm from "./FoodForm";

function calcTotals(dayData: DayData): MacroTotals {
  let proteina = 0,
    gorduras = 0,
    carboidratos = 0;
  for (const meal of dayData.refeicoes) {
    for (const item of meal.itens) {
      proteina += item.proteina;
      gorduras += item.gorduras;
      carboidratos += item.carboidratos;
    }
  }
  return {
    proteina,
    gorduras,
    carboidratos,
    calorias: proteina * 4 + carboidratos * 4 + gorduras * 9,
  };
}

type SyncMessage = { type: "success" | "error"; text: string };

export default function DayView() {
  const [dayData, setDayData] = useState<DayData>({ refeicoes: [] });
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<SyncMessage | null>(null);
  const [mutationError, setMutationError] = useState("");
  const [addItemModal, setAddItemModal] = useState<{
    mealId: string;
    mealName: string;
  } | null>(null);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchAll = useCallback(async () => {
    try {
      const [dayRes, foodsRes] = await Promise.all([
        fetch("/api/day"),
        fetch("/api/foods"),
      ]);
      const [day, foodsList] = await Promise.all([
        dayRes.json(),
        foodsRes.json(),
      ]);
      setDayData(day);
      setFoods(foodsList);
    } catch {
      setLoadError(
        "Erro ao carregar dados. Verifique as variáveis de ambiente.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleAddMeal(nome: string) {
    setMutationError("");
    const res = await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addMeal", nome }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMutationError(data.error ?? "Erro ao adicionar refeição.");
      return;
    }
    const meal = await res.json();
    setDayData((d) => ({ ...d, refeicoes: [...d.refeicoes, meal] }));
  }

  async function handleAddItem(
    mealId: string,
    alimentoId: number,
    quantidade: number,
  ) {
    setMutationError("");
    const res = await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addItem",
        mealId,
        alimentoId,
        quantidade,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMutationError(data.error ?? "Erro ao adicionar alimento.");
      return;
    }
    const item = await res.json();
    setDayData((d) => ({
      ...d,
      refeicoes: d.refeicoes.map((m) =>
        m.id === mealId ? { ...m, itens: [...m.itens, item] } : m,
      ),
    }));
  }

  async function handleRemoveItem(mealId: string, itemId: string) {
    setMutationError("");
    const res = await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeItem", mealId, itemId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMutationError(data.error ?? "Erro ao remover alimento.");
      return;
    }
    setDayData((d) => ({
      ...d,
      refeicoes: d.refeicoes.map((m) =>
        m.id === mealId
          ? { ...m, itens: m.itens.filter((i) => i.id !== itemId) }
          : m,
      ),
    }));
  }

  async function handleRemoveMeal(mealId: string) {
    setMutationError("");
    const res = await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeMeal", mealId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMutationError(data.error ?? "Erro ao remover refeição.");
      return;
    }
    setDayData((d) => ({
      ...d,
      refeicoes: d.refeicoes.filter((m) => m.id !== mealId),
    }));
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMessage({
          type: "error",
          text: data.error ?? "Erro ao sincronizar.",
        });
      } else {
        setSyncMessage({
          type: "success",
          text: "Dia sincronizado com sucesso! Refeições resetadas.",
        });
        setDayData({ refeicoes: [] });
      }
    } catch {
      setSyncMessage({
        type: "error",
        text: "Erro ao sincronizar. Tente novamente.",
      });
    } finally {
      setSyncing(false);
    }
  }

  const totals = calcTotals(dayData);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-gray-400">Carregando...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoje</h1>
          <p className="text-sm text-gray-500 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FoodForm onSuccess={(food) => setFoods((f) => [...f, food])} />
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {syncing ? "Sincronizando..." : "↕ Sincronizar dia"}
          </button>
        </div>
      </div>

      {/* Sync message */}
      {syncMessage && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            syncMessage.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {syncMessage.text}
        </div>
      )}

      {/* Mutation error */}
      {mutationError && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 flex items-center justify-between">
          <span>{mutationError}</span>
          <button
            onClick={() => setMutationError("")}
            className="text-red-400 hover:text-red-600 ml-3"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Macro Summary */}
      <MacroSummary totals={totals} />

      {/* Meals */}
      <div className="space-y-3">
        {dayData.refeicoes.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <p>Nenhuma refeição registrada hoje.</p>
            <p className="text-sm mt-1">
              Adicione uma refeição abaixo para começar.
            </p>
          </div>
        )}
        {dayData.refeicoes.map((meal) => (
          <MealSection
            key={meal.id}
            meal={meal}
            onAddItem={(mealId) =>
              setAddItemModal({ mealId, mealName: meal.nome })
            }
            onRemoveItem={handleRemoveItem}
            onRemoveMeal={handleRemoveMeal}
          />
        ))}
        <AddMealForm onAdd={handleAddMeal} />
      </div>

      {/* Add Item Modal */}
      {addItemModal && (
        <AddItemModal
          mealId={addItemModal.mealId}
          mealName={addItemModal.mealName}
          foods={foods}
          onAdd={handleAddItem}
          onClose={() => setAddItemModal(null)}
        />
      )}
    </div>
  );
}
