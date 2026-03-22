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

export type DayData = {
  refeicoes: Meal[]
}

export type DailySummary = {
  id: number
  date: string
  proteina: number
  gorduras: number
  carboidratos: number
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
