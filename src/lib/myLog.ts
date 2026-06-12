import Log from '@/db/models/Log'

type LogType = 'error' | 'warn' | 'info'

export type LogInput = {
  type: LogType
  event: string
  message?: string
  context?: any
}

export default async function myLog(input: LogInput) {
  await Log.create(input)
}