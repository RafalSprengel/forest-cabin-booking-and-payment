'use server'

import myLog from '@/lib/myLog'

type LogType = 'error' | 'warn' | 'info'

export async function logEvent(
  type: LogType,
  event: string,
  err?: unknown
) {
  await myLog({
    type,
    event,
    message: err instanceof Error ? err.message : err ? String(err) : undefined,
  })
}