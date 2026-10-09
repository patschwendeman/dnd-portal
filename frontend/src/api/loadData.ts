import { isAxiosError } from 'axios'

import { getData } from './apiMethods'

export class LoadError extends Error {
  readonly original: unknown

  constructor(message: string, original?: unknown) {
    super(message)
    this.name = 'LoadError'
    this.original = original
  }
}

const describeFailure = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (error.response) {
      return `HTTP ${error.response.status}`
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'timeout, backend not reachable'
    }
    return 'backend not reachable'
  }
  return error instanceof Error ? error.message : String(error)
}

export const loadData = async (
  what: string,
  path: string,
  params?: { [key: string]: boolean }
) => {
  let data
  try {
    data = await getData(path, params)
  } catch (error) {
    throw new LoadError(`Loading ${what} failed: ${describeFailure(error)}`, error)
  }
  if (!data) {
    throw new LoadError(`${what} not found`)
  }
  return data
}
