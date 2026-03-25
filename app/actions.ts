"use server";

import { revalidatePath } from "next/cache";

export async function revalidateResumo() {
  revalidatePath("/resumo");
  return { success: true, message: "Cache da página /resumo atualizado com suceso" };
}
