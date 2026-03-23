"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function PwaSetup() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPrompt = useRef<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("pwa-install-dismissed") === "true") return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e;
      setShowBanner(true);
    }

    function handleAppInstalled() {
      setShowBanner(false);
      deferredPrompt.current = null;
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(display-mode: standalone)").matches) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function getTodayStr() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    async function runAutoSync() {
      const today = getTodayStr();
      if (localStorage.getItem("auto-sync-date") === today) return;

      let success = false;
      let noMeals = false;
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        if (res.ok) {
          success = true;
        } else if (res.status === 400) {
          noMeals = true;
        }
      } catch {
        // network error — success stays false
      }

      // Only mark as synced when there's nothing left to do (data saved or no meals to save).
      // On network/server error, leave the guard unset so a retry can still show the warning.
      if (success || noMeals) {
        localStorage.setItem("auto-sync-date", today);
      }

      const reg = await navigator.serviceWorker?.ready.catch(() => null);
      reg?.active?.postMessage({ type: "AUTO_SYNC_RESULT", success, noMeals });

      scheduleNext();
    }

    function scheduleNext() {
      const now = new Date();
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        0,
        0,
      );
      const msUntil = target.getTime() - now.getTime();
      if (msUntil <= 0) {
        // already past 23:59 today — schedule for 23:59 tomorrow
        target.setDate(target.getDate() + 1);
        timeoutId = setTimeout(runAutoSync, target.getTime() - Date.now());
      } else {
        timeoutId = setTimeout(runAutoSync, msUntil);
      }
    }

    // If already past 23:59 and haven't synced today, run immediately
    const now = new Date();
    const isPast2359 = now.getHours() === 23 && now.getMinutes() >= 59;
    const today = getTodayStr();
    if (isPast2359 && localStorage.getItem("auto-sync-date") !== today) {
      runAutoSync();
    } else {
      scheduleNext();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    function setup() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (typeof window === "undefined") return;
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      if (localStorage.getItem("water-notif-enabled") !== "true") return;
      // Skip setInterval fallback when push subscription is active
      if (localStorage.getItem("push-subscribed") === "true") return;

      const minutes = Number(
        localStorage.getItem("water-notif-interval") || 30,
      );
      const ms = Math.max(1, minutes) * 60 * 1000;

      timerRef.current = setInterval(async () => {
        const reg = await navigator.serviceWorker?.ready.catch(() => null);
        reg?.active?.postMessage({ type: "WATER_REMINDER" });
      }, ms);
    }

    setup();
    window.addEventListener("water-notif-changed", setup);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("water-notif-changed", setup);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setShowBanner(false);
      localStorage.setItem("pwa-install-dismissed", "true");
      deferredPrompt.current = null;
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  }

  return showBanner ? (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="bg-[#1A3A2A] text-white rounded-2xl shadow-xl px-4 py-4 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">🌿</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Instalar Clinical Diet</p>
          <p className="text-xs text-green-300 mt-0.5">
            Acesse mais rápido pela tela inicial
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-white text-[#1A3A2A] text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0 hover:bg-green-50 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-green-400 hover:text-white transition-colors flex-shrink-0 p-1"
          aria-label="Fechar"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  ) : null;
}
