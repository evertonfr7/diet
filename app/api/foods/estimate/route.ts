import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
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

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_AI_API_KEY não configurada.' },
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

    const ai = new GoogleGenAI({ apiKey })
    const prompt =
      `Você é um nutricionista. Dado o alimento "${nome}", retorne os macronutrientes médios por 100${unidade} ` +
      `no formato: {"proteina": number, "gorduras": number, "carboidratos": number}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    })

    const text = (response.text ?? '').trim()
    if (!text) {
      console.error('[estimate] resposta vazia da IA')
      return NextResponse.json(
        { error: 'Não foi possível estimar. Preencha manualmente.' },
        { status: 422 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[estimate] JSON inválido na resposta:', text)
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

    console.log(error);


    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    const msg = error instanceof Error ? error.message : String(error)

    const isRateLimit =
      msg.includes('429') ||
      msg.toLowerCase().includes('rate') ||
      msg.toLowerCase().includes('resource_exhausted') ||
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
