# Planejamento: Persistência de Água no Banco de Dados

## Contexto

Atualmente a ingestão de água é armazenada **apenas no `localStorage`** com a chave `water-intake-YYYY-MM-DD`. Isso significa:
- Dados perdidos ao limpar o browser
- Sem histórico (deletado no sync)
- Sem suporte a múltiplos dispositivos

**Objetivo:** Fazer a água seguir o mesmo fluxo dos macros:
`localStorage (UI otimista) → Redis (cache intraday) → PostgreSQL (persistência histórica via sync)`

---

## Arquitetura Atual dos Macros (referência)

```
User action → POST /api/day (addItem) → Redis (7-day TTL)
                                              ↓
                                    POST /api/sync (23:59)
                                              ↓
                                    SyncRecord no PostgreSQL
```

A água deve seguir o **mesmo fluxo**.

---

## Mudanças Necessárias

### 1. Prisma Schema — `prisma/schema.prisma`

Adicionar campo `agua` em `SyncRecord`:

```prisma
model SyncRecord {
  id             Int          @id @default(autoincrement())
  dailySummaryId Int
  proteina       Float
  gorduras       Float
  carboidratos   Float
  agua           Int          @default(0)   // ← NOVO: ml ingeridos no dia
  syncedAt       DateTime     @default(now())
  dailySummary   DailySummary @relation(fields: [dailySummaryId], references: [id])
}
```

Gerar e rodar migração:
```bash
npm run db:migrate
# nome sugerido: add_agua_to_sync_record
npm run db:generate
```

---

### 2. Redis — Estrutura do `DayData`

O tipo `DayData` em `lib/types.ts` representa o estado do dia no Redis. Adicionar campo `agua`:

**Arquivo:** `lib/types.ts`

```typescript
// Tipo existente (aproximado)
export type DayData = {
  refeicoes: Meal[]
  agua: number   // ← NOVO: ml totais do dia, padrão 0
}
```

Atualizar também `SyncRecord` type para incluir `agua`:

```typescript
export type SyncRecord = {
  id: number
  dailySummaryId: number
  proteina: number
  gorduras: number
  carboidratos: number
  agua: number          // ← NOVO
  syncedAt: Date
  dailySummary: { date: string }
}
```

---

### 3. API Route `/api/day` — `app/api/day/route.ts`

Adicionar duas novas ações ao discriminated union:

**`addWater`** — increments água pelo valor passado
**`setWater`** — define o valor absoluto (para sync com localStorage na primeira abertura)

```typescript
// Zod schema para as novas ações
const AddWaterSchema = z.object({
  action: z.literal("addWater"),
  ml: z.number().int().positive(),
})

const SetWaterSchema = z.object({
  action: z.literal("setWater"),
  ml: z.number().int().min(0),
})

// Handler addWater
case "addWater": {
  const dayData = await redis.get<DayData>(getDayKey(date)) ?? { refeicoes: [], agua: 0 }
  const updated = { ...dayData, agua: (dayData.agua ?? 0) + body.ml }
  await redis.set(getDayKey(date), updated, { ex: DAY_TTL })
  return NextResponse.json({ success: true, agua: updated.agua })
}

// Handler setWater
case "setWater": {
  const dayData = await redis.get<DayData>(getDayKey(date)) ?? { refeicoes: [], agua: 0 }
  const updated = { ...dayData, agua: body.ml }
  await redis.set(getDayKey(date), updated, { ex: DAY_TTL })
  return NextResponse.json({ success: true, agua: updated.agua })
}
```

**GET `/api/day`** — garantir que `agua` seja retornado (já será, pois lê o objeto completo do Redis).

---

### 4. API Route `/api/sync` — `app/api/sync/route.ts`

Incluir `agua` na criação do `SyncRecord`:

```typescript
// Antes
const record = await db.syncRecord.create({
  data: { dailySummaryId: summary.id, proteina, gorduras, carboidratos }
})

// Depois
const agua = dayData.agua ?? 0   // ← ler do Redis junto com macros

const record = await db.syncRecord.create({
  data: { dailySummaryId: summary.id, proteina, gorduras, carboidratos, agua }
})
```

---

### 5. Componente `DayView.tsx`

**Migração do localStorage → Redis:**

Substituir a lógica de leitura/escrita do `localStorage` por chamadas à API.

#### 5a. Na inicialização (`fetchAll`)

Ao carregar o dia, ler `agua` do Redis via `GET /api/day`:

```typescript
// Antes: lê do localStorage
const storedIntake = localStorage.getItem(`water-intake-${todayKey}`)
if (storedIntake) setWaterIntake(Number(storedIntake))

// Depois: agua vem junto com os dados do dia
const dayData = await fetch(`/api/day?date=${todayKey}`).then(r => r.json())
setWaterIntake(dayData.agua ?? 0)
```

#### 5b. Função `addWater`

```typescript
// Antes: escrevia só no localStorage
function addWater(ml: number) {
  setWaterIntake((prev) => {
    const next = prev + ml
    localStorage.setItem(`water-intake-${todayKey}`, String(next))
    return next
  })
}

// Depois: atualização otimista + POST à API
async function addWater(ml: number) {
  setWaterIntake((prev) => prev + ml)   // otimista
  await fetch("/api/day", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addWater", ml, date: todayKey }),
  })
  // Em caso de erro: pode reverter o estado ou ignorar
}
```

#### 5c. No reset após sync

```typescript
// Antes: removia do localStorage
setWaterIntake(0)
localStorage.removeItem(`water-intake-${todayKey}`)

// Depois: apenas reset de estado (Redis já foi limpo pelo /api/sync)
setWaterIntake(0)
```

#### 5d. Compatibilidade retroativa (opcional mas recomendado)

Na primeira carga do dia, se Redis retornar `agua: 0` e localStorage tiver valor, migrar:

```typescript
// Em fetchAll, após obter dayData da API
if (dayData.agua === 0) {
  const localWater = localStorage.getItem(`water-intake-${todayKey}`)
  if (localWater && Number(localWater) > 0) {
    const ml = Number(localWater)
    await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setWater", ml, date: todayKey }),
    })
    setWaterIntake(ml)
    localStorage.removeItem(`water-intake-${todayKey}`)
    return
  }
}
setWaterIntake(dayData.agua ?? 0)
```

---

### 6. Página de Histórico/Resumo — `app/resumo/page.tsx`

Se a página de histórico exibe `SyncRecord`, atualizar para exibir `agua` também.

Verificar se há cards/gráficos de macros e adicionar água ao lado.

---

## Fluxo Completo Após Implementação

```
Usuário adiciona água (MacroSummary)
        ↓
addWater(ml) em DayView.tsx
        ↓
Estado React atualizado (otimista)
        ↓
POST /api/day { action: "addWater", ml }
        ↓
Redis: dayData.agua += ml (TTL 7 dias)
        ↓
          [23:59 auto-sync]
        ↓
POST /api/sync
        ↓
Lê dayData.agua do Redis
        ↓
SyncRecord criado com agua no PostgreSQL
        ↓
Redis resetado (agua volta a 0)
        ↓
localStorage limpo (compatibilidade)
```

---

## Ordem de Implementação

1. **Schema** — adicionar `agua Int @default(0)` em `SyncRecord` e rodar migração
2. **`lib/types.ts`** — adicionar `agua` nos tipos `DayData` e `SyncRecord`
3. **`app/api/day/route.ts`** — adicionar ações `addWater` e `setWater`
4. **`app/api/sync/route.ts`** — incluir `agua` no `SyncRecord.create`
5. **`components/DayView.tsx`** — substituir localStorage por API calls
6. **`app/resumo/page.tsx`** — exibir água no histórico (se aplicável)

---

## Compatibilidade e Rollback

- O campo `agua` tem `@default(0)` no schema — registros antigos não quebram
- A migração de localStorage é não-destrutiva (tenta migrar, se falhar ignora)
- O `GET /api/day` já retorna `agua` automaticamente (sem mudança de interface)

---

## Arquivos Modificados (resumo)

| Arquivo | Tipo de mudança |
|---|---|
| `prisma/schema.prisma` | Adicionar `agua Int @default(0)` em `SyncRecord` |
| `lib/types.ts` | Adicionar `agua` em `DayData` e `SyncRecord` |
| `app/api/day/route.ts` | Adicionar ações `addWater` e `setWater` |
| `app/api/sync/route.ts` | Incluir `agua` no sync |
| `components/DayView.tsx` | Migrar localStorage → API calls |
| `app/resumo/page.tsx` | Exibir `agua` no histórico |
