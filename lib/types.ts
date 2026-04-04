export const FALLBACK_TARGETS: MacroTargets = {
  calorias: 2000,
  proteina: 150,
  carboidratos: 250,
  gorduras: 70,
};

export const FALLBACK_WATER_GOAL = 2000;
export type Food = {
  id: number
  nome: string
  proteina: number
  gorduras: number
  carboidratos: number
  unidade: 'g' | 'ml'
}

export type MealItem = {
  id: string
  alimentoId: number
  nome: string
  quantidade: number
  proteina: number
  gorduras: number
  carboidratos: number
  unidade: 'g' | 'ml'
}

export type Meal = {
  id: string
  nome: string
  itens: MealItem[]
}

export type LooseMacro = {
  id: string
  label?: string
  proteina: number
  gorduras: number
  carboidratos: number
}

export type DayData = {
  refeicoes: Meal[]
  agua: number // ml totais do dia, padrão 0
  avulsos?: LooseMacro[]
}

export type DailySummary = {
  id: number
  date: string
}

export type SyncRecord = {
  id: number
  dailySummaryId: number
  proteina: number
  gorduras: number
  carboidratos: number
  agua: number // ml ingeridos no dia
  syncedAt: Date
  dailySummary: {
    date: string
  }
}

export type MacroTotals = {
  proteina: number
  gorduras: number
  carboidratos: number
  calorias: number
}

export type MacroTargets = {
  calorias: number
  proteina: number
  carboidratos: number
  gorduras: number
}

export type Settings = {
  id: number
  waterGoal: number
  waterNotifEnabled: boolean
  waterNotifInterval: number
  calorieTarget: number
  proteinTarget: number
  carbTarget: number
  fatTarget: number
}
