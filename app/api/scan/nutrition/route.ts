import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { getRedis } from '@/lib/redis'

const ScanResultSchema = z.object({
  nome_produto: z.string().optional(),
  porcao: z.string().optional(),
  proteina: z.number().min(0).optional(),
  carboidratos: z.number().min(0).optional(),
  gorduras: z.number().min(0).optional(),
  valido: z.boolean(),
})

export type ScanResult = z.infer<typeof ScanResultSchema>

const SCAN_TTL = 60 * 60 * 24 * 30

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
    const formData = await request.formData()
    const image = formData.get('image')
    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { error: 'Imagem não fornecida.' },
        { status: 400 },
      )
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = image.type || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64}`

    const ai = new OpenAI({
      baseURL: AI_BASE_URL,
      apiKey: AI_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.AI_HTTP_REFERER || 'http://localhost:3000',
        'X-Title': process.env.AI_X_TITLE || 'Diet App',
      },
    })

    const prompt = `Você é um especialista em tabelas nutricionais brasileiras (ANVISA).
Analise a imagem de uma tabela nutricional e extraia os valores nutricionais.
Formato de resposta JSON:
{
  "nome_produto": "nome do produto se visível na imagem",
  "porcao": "tamanho da porção (ex: 100g, 1 unidade (30g))",
  "proteina": número em gramas,
  "carboidratos": número em gramas,
  "gorduras": número em gramas,
  "valido": boolean (true se conseguiu extrair valores, false se não conseguir ler)
}
Importante: Retorne os valores por PORÇÃO indicada na tabela, não por 100g.
Responda APENAS com JSON válido, sem texto adicional.`

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    if (!raw) {
      return NextResponse.json(
        { error: 'Não foi possível processar a imagem. Tente novamente.' },
        { status: 422 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(extractJson(raw))
    } catch {
      console.error('[scan/nutrition] JSON inválido:', raw)
      return NextResponse.json(
        { error: 'Não foi possível processar a imagem. Tente novamente.' },
        { status: 422 },
      )
    }

    const result = ScanResultSchema.safeParse(parsed)
    if (!result.success) {
      console.error('[scan/nutrition] schema inválido:', parsed)
      return NextResponse.json(
        { error: 'Dados extraídos incompletos. Tente uma foto mais clara.' },
        { status: 422 },
      )
    }

    if (!result.data.valido) {
      return NextResponse.json(
        { error: 'Não foi possível ler a tabela nutricional. Tente uma foto mais clara e bem iluminada.' },
        { status: 422 },
      )
    }

    const { proteina, carboidratos, gorduras, nome_produto, porcao } = result.data

    if (proteina === undefined && carboidratos === undefined && gorduras === undefined) {
      return NextResponse.json(
        { error: 'Não foram encontrados valores nutricionais na imagem.' },
        { status: 422 },
      )
    }

    const cacheKey = `diet:scan:${base64.slice(0, 32)}`
    const redis = getRedis()
    await redis.set(cacheKey, result.data, { ex: SCAN_TTL })

    return NextResponse.json({
      nome: nome_produto || '',
      porcao: porcao || '',
      proteina: proteina ?? 0,
      carboidratos: carboidratos ?? 0,
      gorduras: gorduras ?? 0,
    })
  } catch (error) {
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

    if (msg.includes('image') || msg.toLowerCase().includes('vision') || msg.toLowerCase().includes('unsupported')) {
      return NextResponse.json(
        { error: 'Este modelo não suporta análise de imagens. Use um modelo com suporte a visão (ex: gpt-4o, gpt-4o-mini).' },
        { status: 400 },
      )
    }

    console.error('[scan/nutrition] erro inesperado:', error)
    return NextResponse.json(
      { error: 'Não foi possível processar a imagem. Tente novamente.' },
      { status: 422 },
    )
  }
}
