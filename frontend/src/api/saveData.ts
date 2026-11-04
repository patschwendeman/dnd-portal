import {
  deleteData, patchData, postData, putData,
} from './apiMethods'
import { describeFailure } from './loadData'

export class SaveError extends Error {
  readonly original: unknown

  constructor(message: string, original?: unknown) {
    super(message)
    this.name = 'SaveError'
    this.original = original
  }
}

const asSave = async <T>(what: string, request: () => Promise<T>): Promise<T> => {
  try {
    return await request()
  } catch (error) {
    throw new SaveError(`Saving ${what} failed: ${describeFailure(error)}`, error)
  }
}

export const saveData = async (what: string, path: string, body: object) => (
  asSave(what, () => patchData(path, body))
)

export const postCommand = async (what: string, path: string, body?: object) => (
  asSave(what, () => postData(path, body))
)

export const replaceData = async (what: string, path: string, body: object) => (
  asSave(what, () => putData(path, body))
)

export const deleteCommand = async (what: string, path: string) => (
  asSave(what, () => deleteData(path))
)
