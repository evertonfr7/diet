"use client";

import { useEffect, useRef } from "react";

export default function PwaSetup() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
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

  return null;
}
