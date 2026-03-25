import { Redis } from '@upstash/redis'

// TTL de 7 dias para dados do dia no Redis
export const DAY_TTL = 60 * 60 * 24 * 7

let _redis: Redis | null = null

export function getRedis(): Redis {
  if (_redis) return _redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error(
      'Missing Upstash Redis env vars. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local',
    )
  }

  _redis = new Redis({ url, token })
  return _redis
}

export function getDayKey(date: string): string {
  return `diet:day:${date}`
}

/**
 * Retorna a data atual no formato YYYY-MM-DD usando o timezone configurado
 * via TZ_LOCAL (ex: America/Sao_Paulo). Sem variável, usa UTC.
 */
export function getTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TZ_LOCAL ?? 'UTC',
  }).format(new Date())
}

export const PUSH_SUBSCRIPTION_KEY = 'diet:push-subscription'
export const PUSH_SCHEDULE_ID_KEY = 'diet:push-schedule-id'
export const SYNC_SCHEDULE_ID_KEY = 'diet:sync-schedule-id'
