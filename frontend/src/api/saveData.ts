import { patchData } from './apiMethods'
import { describeFailure } from './loadData'

export class SaveError extends Error {
  readonly original: unknown

  constructor(message: string, original?: unknown) {
    super(message)
    this.name = 'SaveError'
    this.original = original
  }
}

export const saveData = async (what: string, path: string, body: object) => {
  try {
    return await patchData(path, body)
  } catch (error) {
    throw new SaveError(`Saving ${what} failed: ${describeFailure(error)}`, error)
  }
}
