"use client";

import { useState, useEffect, useRef } from "react";
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

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<MacroTargets>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [waterGoalMessage, setWaterGoalMessage] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | ""
  >("");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifInterval, setNotifInterval] = useState(30);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const resubscribeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("water-goal");
    if (stored) setWaterGoal(Number(stored));
    if ("Notification" in window) setNotifPermission(Notification.permission);
    setNotifEnabled(localStorage.getItem("water-notif-enabled") === "true");
    setNotifInterval(
      Number(localStorage.getItem("water-notif-interval") || 30),
    );
    setPushSupported("PushManager" in window);
    setPushSubscribed(localStorage.getItem("push-subscribed") === "true");
  }, []);

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

  function handleWaterGoalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(1, Number(e.target.value));
    setWaterGoal(val);
    localStorage.setItem("water-goal", String(val));
    setWaterGoalMessage("Meta de água salva!");
    setTimeout(() => setWaterGoalMessage(null), 2000);
  }

  async function subscribePush(intervalMin: number) {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          intervalMinutes: intervalMin,
        }),
      });
      if (res.ok) {
        setPushSubscribed(true);
        localStorage.setItem("push-subscribed", "true");
      }
    } catch (err) {
      console.error("[push] subscription failed:", err);
    }
  }

  async function unsubscribePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch("/api/push/subscribe", { method: "DELETE" });
      setPushSubscribed(false);
      localStorage.removeItem("push-subscribed");
    } catch (err) {
      console.error("[push] unsubscription failed:", err);
    }
  }

  async function requestNotifPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      setNotifEnabled(true);
      localStorage.setItem("water-notif-enabled", "true");
      window.dispatchEvent(new Event("water-notif-changed"));
      if (pushSupported) {
        await subscribePush(notifInterval);
      }
    }
  }

  async function toggleNotif(enabled: boolean) {
    setNotifEnabled(enabled);
    localStorage.setItem("water-notif-enabled", String(enabled));
    window.dispatchEvent(new Event("water-notif-changed"));
    if (pushSupported) {
      if (enabled) {
        await subscribePush(notifInterval);
      } else {
        await unsubscribePush();
      }
    }
  }

  function handleNotifIntervalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(1, Number(e.target.value));
    setNotifInterval(val);
    localStorage.setItem("water-notif-interval", String(val));
    window.dispatchEvent(new Event("water-notif-changed"));
    if (pushSubscribed) {
      if (resubscribeTimer.current) clearTimeout(resubscribeTimer.current);
      resubscribeTimer.current = setTimeout(() => subscribePush(val), 1000);
    }
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

      {/* Meta de Água */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
          Meta de Água
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta diária <span className="text-xs text-gray-400 ml-1">(ml)</span>
          </label>
          <input
            type="number"
            min="100"
            step="100"
            value={waterGoal}
            onChange={handleWaterGoalChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-shadow"
          />
          {waterGoalMessage && (
            <p className="text-xs text-green-600 mt-2">{waterGoalMessage}</p>
          )}
        </div>
      </div>

      {/* Notificações de Água */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
          Notificações de Água
        </h2>
        <div className="space-y-4">
          {notifPermission === "" || notifPermission === "default" ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-gray-600">
                Ative para receber lembretes periódicos de hidratação.
              </p>
              <button
                onClick={requestNotifPermission}
                className="text-sm bg-cyan-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-cyan-700 transition-colors whitespace-nowrap"
              >
                Ativar notificações
              </button>
            </div>
          ) : notifPermission === "denied" ? (
            <p className="text-sm text-red-500">
              Notificações bloqueadas no navegador. Acesse as configurações do
              site para desbloquear.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Lembretes ativos
                </label>
                <button
                  type="button"
                  onClick={() => toggleNotif(!notifEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifEnabled ? "bg-cyan-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notifEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {notifEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intervalo entre lembretes{" "}
                    <span className="text-xs text-gray-400 ml-1">
                      (minutos)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={notifInterval}
                    onChange={handleNotifIntervalChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-shadow"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    {pushSubscribed
                      ? `Lembrete a cada ${notifInterval} min, mesmo com o app fechado. ✅`
                      : `Lembrete a cada ${notifInterval} min enquanto o app estiver aberto.`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
