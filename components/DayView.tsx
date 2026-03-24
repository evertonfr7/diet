"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, X } from "lucide-react";
import type {
  DayData,
  Food,
  Meal,
  MacroTotals,
  MacroTargets,
} from "@/lib/types";
import MacroSummary from "./MacroSummary";
import MealSection from "./MealSection";
import AddMealForm from "./AddMealForm";
import AddItemModal from "./AddItemModal";
import FoodForm from "./FoodForm";
import ParseMealModal from "./ParseMealModal";
import { FALLBACK_WATER_GOAL } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="h-9 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-xl" />
          <div className="h-9 w-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`${i === 0 ? "col-span-2 lg:col-span-1" : ""} bg-white rounded-2xl shadow-sm p-5`}
          >
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded-full mt-3" />
          </div>
        ))}
      </div>
      <div className="h-4 w-32 bg-gray-100 rounded" />
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="h-5 w-36 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

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

const DEFAULT_TARGETS: MacroTargets = {
  calorias: 2400,
  proteina: 200,
  carboidratos: 300,
  gorduras: 100,
};

function mapSettingsToTargets(settings: {
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}): MacroTargets {
  return {
    calorias: settings.calorieTarget,
    proteina: settings.proteinTarget,
    carboidratos: settings.carbTarget,
    gorduras: settings.fatTarget,
  };
}

export default function DayView() {
  const [dayData, setDayData] = useState<DayData>({ refeicoes: [] });
  const [foods, setFoods] = useState<Food[]>([]);
  const [targets, setTargets] = useState<MacroTargets>(DEFAULT_TARGETS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<SyncMessage | null>(null);
  const [mutationError, setMutationError] = useState("");
  const [addItemModal, setAddItemModal] = useState<{
    mealId: string;
    mealName: string;
  } | null>(null);

  const [parseMealModal, setParseMealModal] = useState<{
    mealId: string;
    mealName: string;
  } | null>(null);

  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayKey = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const storedIntake = localStorage.getItem(`water-intake-${todayKey}`);
    if (storedIntake) setWaterIntake(Number(storedIntake));
  }, [todayKey]);

  // Removed duplicate useEffect for fetching settings

  function addWater(ml: number) {
    setWaterIntake((prev) => {
      const next = prev + ml;
      localStorage.setItem(`water-intake-${todayKey}`, String(next));
      return next;
    });
  }

  const fetchAll = useCallback(async () => {
    try {
      const [dayRes, foodsRes, settingsRes] = await Promise.all([
        fetch("/api/day"),
        fetch("/api/foods"),
        fetch("/api/settings"),
      ]);
      const [day, foodsList, settingsData] = await Promise.all([
        dayRes.json(),
        foodsRes.json(),
        settingsRes.json(),
      ]);
      setDayData(day);
      setFoods(foodsList);
      if (settingsData && !settingsData.error) {
        setTargets(mapSettingsToTargets(settingsData));
        setWaterGoal(settingsData.waterGoal ?? FALLBACK_WATER_GOAL);
      }
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

  async function handleSaveAsFood(meal: Meal) {
    const proteina = meal.itens.reduce((s, i) => s + i.proteina, 0);
    const gorduras = meal.itens.reduce((s, i) => s + i.gorduras, 0);
    const carboidratos = meal.itens.reduce((s, i) => s + i.carboidratos, 0);
    const res = await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: meal.nome,
        proteina: Math.round(proteina * 10) / 10,
        gorduras: Math.round(gorduras * 10) / 10,
        carboidratos: Math.round(carboidratos * 10) / 10,
        unidade: "g",
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMutationError(data.error ?? "Erro ao salvar refeição como alimento.");
      return;
    }
    const food: Food = await res.json();
    setFoods((f) => [...f, food]);
  }

  type ParsedItem = {
    nome: string;
    quantidade: number;
    unidade: "g" | "ml";
    proteina: number;
    gorduras: number;
    carboidratos: number;
  };

  async function handleAddBulk(mealId: string, itens: ParsedItem[]) {
    setMutationError("");
    const res = await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addItemsBulk", mealId, itens }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMutationError(data.error ?? "Erro ao adicionar itens.");
      return;
    }
    const newItems = await res.json();
    setDayData((d) => ({
      ...d,
      refeicoes: d.refeicoes.map((m) =>
        m.id === mealId ? { ...m, itens: [...m.itens, ...newItems] } : m,
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
        setWaterIntake(0);
        localStorage.removeItem(`water-intake-${todayKey}`);
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
    return <DashboardSkeleton />;
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        {loadError}
      </div>
    );
  }

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia." : hour < 18 ? "Boa tarde." : "Boa noite.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1A3A2A] tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw
                size={14}
                strokeWidth={2}
                className={syncing ? "animate-spin" : ""}
              />
              {syncing ? "Sincronizando..." : "Sincronizar"}
            </span>
          </button>
          <FoodForm onSuccess={(food) => setFoods((f) => [...f, food])} />
        </div>
      </div>

      {/* Sync message */}
      {syncMessage && (
        <div
          className={`px-4 py-3 rounded-2xl text-sm font-medium ${
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
        <div className="px-4 py-3 rounded-2xl text-sm font-medium bg-red-50 text-red-700 border border-red-200 flex items-center justify-between">
          <span>{mutationError}</span>
          <button
            onClick={() => setMutationError("")}
            className="text-red-400 hover:text-red-600 ml-3"
            aria-label="Fechar"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Macro Summary */}
      <MacroSummary
        totals={totals}
        targets={targets ?? DEFAULT_TARGETS}
        waterIntake={waterIntake}
        waterGoal={waterGoal}
        onAddWater={addWater}
      />

      {/* Protocol section */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Protocolo do Dia
        </h2>
      </div>

      {/* Meals */}
      <div className="space-y-3">
        {dayData.refeicoes.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
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
            onParseMeal={(mealId) =>
              setParseMealModal({ mealId, mealName: meal.nome })
            }
            onRemoveItem={handleRemoveItem}
            onRemoveMeal={handleRemoveMeal}
            onSaveAsFood={handleSaveAsFood}
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

      {parseMealModal && (
        <ParseMealModal
          mealId={parseMealModal.mealId}
          mealName={parseMealModal.mealName}
          onAdd={handleAddBulk}
          onClose={() => setParseMealModal(null)}
        />
      )}
    </div>
  );
}
