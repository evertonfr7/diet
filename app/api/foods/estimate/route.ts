// Provedor de IA configurável via variáveis de ambiente:
//   AI_BASE_URL  — ex: https://api.groq.com/openai/v1
//   AI_API_KEY   — chave do provedor (Groq, OpenRouter, etc.)
//   AI_MODEL     — ex: llama-3.3-70b-versatile

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { getRedis } from '@/lib/redis'

const BodySchema = z.object({
  nome: z.string().min(2),
  unidade: z.enum(['g', 'ml']).default('g'),
})

const MacrosSchema = z.object({
  proteina: z.coerce.number().min(0),
  gorduras: z.coerce.number().min(0),
  carboidratos: z.coerce.number().min(0),
})

type Macros = z.infer<typeof MacrosSchema>

const ESTIMATE_TTL = 60 * 60 * 24 * 30 // 30 dias

function estimateCacheKey(nome: string, unidade: string) {
  return `diet:estimate:${nome.toLowerCase().trim()}:${unidade}`
}

/** Remove blocos ```json ... ``` que alguns modelos inserem mesmo quando não deviam. */
function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : raw.trim()
}

export async function POST(request: Request) {
  const { AI_BASE_URL, AI_API_KEY, AI_MODEL } = process.env
  if (!AI_BASE_URL || !AI_API_KEY || !AI_MODEL) {
    return NextResponse.json(
      { error: 'Variáveis de ambiente AI_BASE_URL, AI_API_KEY e AI_MODEL não configuradas.' },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { nome, unidade } = BodySchema.parse(body)

    // Tenta retornar do cache antes de chamar a IA
    const redis = getRedis()
    const cached = await redis.get<Macros>(estimateCacheKey(nome, unidade))
    if (cached) {
      return NextResponse.json(cached)
    }

    const ai = new OpenAI({ baseURL: AI_BASE_URL, apiKey: AI_API_KEY })

    const prompt =
      `Você é um nutricionista. Dado o alimento "${nome}", retorne APENAS um JSON com os macronutrientes médios por 100${unidade}. ` +
      `Responda estritamente no formato: {"proteina": number, "gorduras": number, "carboidratos": number}. ` +
      `Sem texto adicional, sem blocos de código, apenas o JSON.`

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    if (!raw) {
      console.error('[estimate] resposta vazia da IA')
      return NextResponse.json(
        { error: 'Não foi possível estimar. Preencha manualmente.' },
        { status: 422 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(extractJson(raw))
    } catch {
      console.error('[estimate] JSON inválido na resposta:', raw)
      return NextResponse.json(
        { error: 'Não foi possível estimar. Preencha manualmente.' },
        { status: 422 },
      )
    }

    let macros: Macros
    try {
      macros = MacrosSchema.parse(parsed)
    } catch (e) {
      console.error('[estimate] schema inválido:', parsed, e)
      return NextResponse.json(
        { error: 'Não foi possível estimar. Preencha manualmente.' },
        { status: 422 },
      )
    }

    // Salva no cache para evitar chamadas repetidas
    await redis.set(estimateCacheKey(nome, unidade), macros, { ex: ESTIMATE_TTL })

    return NextResponse.json(macros)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    const msg = error instanceof Error ? error.message : String(error)

    const isRateLimit =
      msg.includes('429') ||
      msg.toLowerCase().includes('rate limit') ||
      msg.toLowerCase().includes('too many requests') ||
      msg.toLowerCase().includes('quota')
    if (isRateLimit) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Tente em alguns segundos.' },
        { status: 429 },
      )
    }
    console.error('[estimate] erro inesperado:', error)
    return NextResponse.json(
      { error: 'Não foi possível estimar. Preencha manualmente.' },
      { status: 422 },
    )
  }
}
