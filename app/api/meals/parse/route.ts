import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const BodySchema = z.object({
  descricao: z.string().min(3),
})

const ParsedItemSchema = z.object({
  nome: z.string(),
  quantidade: z.coerce.number().positive(),
  unidade: z.enum(['g', 'ml']),
  proteina: z.coerce.number().min(0),
  gorduras: z.coerce.number().min(0),
  carboidratos: z.coerce.number().min(0),
})

const ParsedResponseSchema = z.object({
  itens: z.array(ParsedItemSchema).min(1),
})

export type ParsedItem = z.infer<typeof ParsedItemSchema>

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
    const { descricao } = BodySchema.parse(body)

    const ai = new OpenAI({
      baseURL: AI_BASE_URL,
      apiKey: AI_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.AI_HTTP_REFERER || 'http://localhost:3000',
        'X-Title': process.env.AI_X_TITLE || 'Diet App',
      },
    })

    const prompt =
      `Você é um nutricionista. O usuário descreveu uma refeição: "${descricao}". ` +
      `Identifique cada alimento, estime a quantidade em gramas ou mililitros e calcule os macronutrientes TOTAIS (não por 100g) para aquela quantidade específica. ` +
      `Responda APENAS com JSON no formato: {"itens": [{"nome": "string", "quantidade": number, "unidade": "g" ou "ml", "proteina": number, "gorduras": number, "carboidratos": number}]}. ` +
      `Omita itens sem quantidade mensurável (ex: sal, temperos em pitada). Sem texto adicional, sem blocos de código, apenas o JSON.`

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    if (!raw) {
      console.error('[meals/parse] resposta vazia da IA')
      return NextResponse.json(
        { error: 'Não foi possível interpretar a refeição. Tente novamente.' },
        { status: 422 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(extractJson(raw))
    } catch {
      console.error('[meals/parse] JSON inválido:', raw)
      return NextResponse.json(
        { error: 'Não foi possível interpretar a refeição. Tente novamente.' },
        { status: 422 },
      )
    }

    let result: z.infer<typeof ParsedResponseSchema>
    try {
      result = ParsedResponseSchema.parse(parsed)
    } catch (e) {
      console.error('[meals/parse] schema inválido:', parsed, e)
      return NextResponse.json(
        { error: 'Não foi possível interpretar a refeição. Tente novamente.' },
        { status: 422 },
      )
    }

    return NextResponse.json(result)
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
    console.error('[meals/parse] erro inesperado:', error)
    return NextResponse.json(
      { error: 'Não foi possível interpretar a refeição. Tente novamente.' },
      { status: 422 },
    )
  }
}
