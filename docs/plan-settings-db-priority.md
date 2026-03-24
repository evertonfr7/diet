# Plano de Implementação: Priorizar Metas do Banco de Dados

## Contexto

O app de dieta tem metas (macro targets + waterGoal) chegando de múltiplas fontes concorrentes. O requisito é: **banco de dados é a fonte primária; fallbacks só se a leitura falhar**.

## Bugs identificados

### Bug crítico — `DayView.tsx` fetchAll (Phase 1)

`fetchAll` chama `setTargets(settingsData)` passando o objeto `Settings` bruto do banco, mas o state `targets` espera `MacroTargets` (campos em português: `calorias`, `proteina`, `carboidratos`, `gorduras`). O banco retorna `calorieTarget`, `proteinTarget`, etc. — campos diferentes. Resultado: `targets.calorias` fica `undefined` e `MacroSummary` usa seus próprios defaults internos. **O banco nunca chega na tela.**

Além disso, há dois `useEffect` chamando `/api/settings` separadamente na montagem: um dedicado a settings (linhas ~132-142) e outro dentro de `fetchAll`. Os dois correm em paralelo e podem se sobrescrever.

`waterGoal` também não é atualizado dentro do `fetchAll` — só no `useEffect` dedicado.

### Bug menor — `PwaSetup.tsx`

Lê `localStorage` primeiro para `water-notif-*` e só então sobrescreve com o banco. Ordem inversa ao requisito.

### Bug menor — `configuracoes/page.tsx`

Escreve `water-goal` no `localStorage` em cada keystroke (`handleWaterGoalChange`), mas `DayView` não lê mais dessa chave. Cria estado morto.

---

## Fases de implementação

### Phase 1 — `components/DayView.tsx` (CRÍTICO, fazer primeiro)

1. **Remover** o `useEffect` dedicado a settings (o que chama `/api/settings` sozinho e chama `mapSettingsToTargets`). Ele está em torno das linhas 132-142.

2. **Dentro de `fetchAll`**, substituir:
   ```ts
   setTargets(settingsData)
   ```
   por:
   ```ts
   setTargets(mapSettingsToTargets(settingsData))
   setWaterGoal(settingsData.waterGoal ?? 2000)
   ```
   A função `mapSettingsToTargets` já existe no arquivo — só estava sendo chamada no lugar errado.

3. **No bloco `catch` do fetch de settings dentro de `fetchAll`**, garantir que `DEFAULT_TARGETS` permaneça ativo (já é o valor inicial do `useState`, então basta não sobrescrever em caso de erro).

### Phase 2 — Consolidar fallbacks (`DayView.tsx` + `MacroSummary.tsx`)

Atualmente os valores de fallback existem em pelo menos 4 lugares com magic numbers diferentes. Consolidar em uma única constante:

1. Em `lib/types.ts` (ou no topo de `DayView.tsx`), declarar:
   ```ts
   export const FALLBACK_TARGETS: MacroTargets = {
     calorias: 2000,
     proteina: 150,
     carboidratos: 250,
     gorduras: 70,
   }
   export const FALLBACK_WATER_GOAL = 2000
   ```

2. Em `DayView.tsx`, trocar `DEFAULT_TARGETS` e o `useState(2000)` de waterGoal por essas constantes.

3. Em `MacroSummary.tsx`, trocar o `safeTargets` inline (com seus próprios magic numbers) por referência a `FALLBACK_TARGETS`.

### Phase 3 — `app/configuracoes/page.tsx`

Remover as escritas de `water-goal` no `localStorage`:
- Na função `handleWaterGoalChange` (onde faz `localStorage.setItem("water-goal", ...)`)
- No `useEffect` inicial de carga, onde faz `localStorage.setItem("water-goal", data.waterGoal)`

Essas escritas são código morto — `DayView` não lê `water-goal` do localStorage. As chaves `water-notif-enabled` e `water-notif-interval` podem continuar sendo escritas (são lidas por `PwaSetup.tsx` como fallback legítimo).

### Phase 4 — `components/PwaSetup.tsx`

Inverter a ordem de prioridade para `water-notif-*`:

**Atual (errado):**
```
1. Lê localStorage
2. Tenta buscar do banco → sobrescreve se conseguir
```

**Correto:**
```
1. Tenta GET /api/settings
2. Se sucesso → usa os valores do banco diretamente
3. Se falha (catch) → lê localStorage como fallback
```

---

## Prioridade final após o fix

Para macro targets e waterGoal:
```
1. Banco de dados via GET /api/settings → Prisma → PostgreSQL  [primário]
2. @default do schema Prisma                                    [na criação do registro]
3. FALLBACK_TARGETS / FALLBACK_WATER_GOAL                      [só se a API falhar]
```

Para configurações de notificação:
```
1. Banco de dados via GET /api/settings                        [primário]
2. localStorage (water-notif-enabled, water-notif-interval)   [só se a API falhar]
```

---

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `components/DayView.tsx` | Remover useEffect duplicado; corrigir setTargets dentro de fetchAll; adicionar setWaterGoal |
| `components/MacroSummary.tsx` | Referenciar FALLBACK_TARGETS em vez de magic numbers |
| `components/PwaSetup.tsx` | Inverter prioridade: DB primeiro, localStorage como fallback |
| `app/configuracoes/page.tsx` | Remover localStorage.setItem("water-goal") mortos |
| `lib/types.ts` | Adicionar FALLBACK_TARGETS e FALLBACK_WATER_GOAL exportados |

---

## O que NÃO precisa mudar

- `app/api/settings/route.ts` — já cria o singleton corretamente se não existir; já retorna os valores do banco
- `prisma/schema.prisma` — defaults já estão corretos e sensatos
- `lib/redis.ts` — cache de settings não está em questão aqui