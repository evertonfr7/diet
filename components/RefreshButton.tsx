"use client";

import { useTransition } from "react";
import { revalidateResumo } from "@/app/actions";
import { RefreshCcw } from "lucide-react";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await revalidateResumo();
        });
      }}
      disabled={isPending}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors border border-brand-200 shadow-sm ${
        isPending ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <RefreshCcw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
      <span>{isPending ? "Atualizando..." : "Atualizar Cache"}</span>
    </button>
  );
}
