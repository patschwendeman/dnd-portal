import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest'

import { apiClient } from '../../src/api/apiClient'
import { patchData } from '../../src/api/apiMethods'
import { SaveError } from '../../src/api/saveData'
import {
  playSound,
  saveActiveAdventure,
  saveActiveScene,
  saveAudio,
  saveGlobalLevel,
  saveTheme,
} from '../../src/service/adminScreen'

vi.mock('../../src/api/apiClient', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}))

const patch = vi.mocked(apiClient.patch)
const post = vi.mocked(apiClient.post)

const networkError = () => new AxiosError('Network Error', AxiosError.ERR_NETWORK)
const timeoutError = () => new AxiosError('timeout of 5000ms exceeded', AxiosError.ECONNABORTED)
const httpError = (status: number) => new AxiosError(
  `Request failed with status code ${status}`,
  AxiosError.ERR_BAD_RESPONSE,
  undefined,
  undefined,
  {
    status, statusText: '', data: {}, headers: {}, config: {} as InternalAxiosRequestConfig,
  } as AxiosResponse,
)

const failure = (promise: Promise<unknown>) => promise.then(() => undefined, (err: Error) => err)

beforeEach(() => {
  patch.mockReset()
  post.mockReset()
})

describe('patchData', () => {
  it('sends the body to the path and resolves with the response data', async () => {
    patch.mockResolvedValue({ data: { id: 1 } })
    await expect(patchData('adventures/1', { a: 1 })).resolves.toEqual({ id: 1 })
    expect(patch).toHaveBeenCalledWith('adventures/1', { a: 1 })
  })

  it('rejects on a network error', async () => {
    patch.mockRejectedValue(networkError())
    await expect(patchData('adventures/1', {})).rejects.toBeInstanceOf(Error)
  })
})

describe('saveActiveScene', () => {
  it('patches the active scene of the adventure', async () => {
    // Request and response follow the API contract, whose fields are snake_case
    const body = { active_scene_id: 5 }
    patch.mockResolvedValue({ data: { id: 2, ...body } })
    await expect(saveActiveScene(2, 5)).resolves.toEqual({ id: 2, ...body })
    expect(patch).toHaveBeenCalledWith('adventures/2', body)
  })

  it('reports an unreachable backend as SaveError', async () => {
    patch.mockRejectedValue(networkError())
    const error = await failure(saveActiveScene(1, 5))
    expect(error).toBeInstanceOf(SaveError)
    expect(error?.message)
      .toMatch(/^Saving active scene of adventure 1 failed: backend not reachable$/)
  })

  it('reports a timeout', async () => {
    patch.mockRejectedValue(timeoutError())
    const error = await failure(saveActiveScene(1, 5))
    expect(error?.message).toMatch(/timeout/i)
  })

  it.each([422, 404, 500])('reports HTTP %i with its status', async (status) => {
    patch.mockRejectedValue(httpError(status))
    const error = await failure(saveActiveScene(1, 5))
    expect(error).toBeInstanceOf(SaveError)
    expect(error?.message).toMatch(new RegExp(`HTTP ${status}`))
  })

  it('keeps the original error', async () => {
    const original = httpError(500)
    patch.mockRejectedValue(original)
    const error = await failure(saveActiveScene(1, 5))
    expect((error as SaveError).original).toBe(original)
  })
})

describe('saveGlobalLevel', () => {
  it('patches the level of the adventure', async () => {
    const body = { global_level: 3 }
    patch.mockResolvedValue({ data: { id: 2, ...body } })
    await expect(saveGlobalLevel(2, 3)).resolves.toEqual({ id: 2, ...body })
    expect(patch).toHaveBeenCalledWith('adventures/2', body)
  })

  it('reports a failure as SaveError', async () => {
    patch.mockRejectedValue(httpError(422))
    const error = await failure(saveGlobalLevel(1, 21))
    expect(error).toBeInstanceOf(SaveError)
    expect(error?.message).toMatch(/^Saving level of adventure 1 failed: .*HTTP 422/)
  })
})

describe('game table writes', () => {
  it('patches the active adventure of the game table', async () => {
    patch.mockResolvedValue({ data: { active_adventure_id: 2 } })
    await saveActiveAdventure(2)
    expect(patch).toHaveBeenCalledWith('table', { active_adventure_id: 2 })
  })

  it('patches the theme of the game table', async () => {
    patch.mockResolvedValue({ data: { theme: 'tavern' } })
    await saveTheme('tavern')
    expect(patch).toHaveBeenCalledWith('table', { theme: 'tavern' })
  })

  it('reports a failure as SaveError', async () => {
    patch.mockRejectedValue(networkError())
    const error = await failure(saveTheme('dark'))
    expect(error).toBeInstanceOf(SaveError)
    expect(error?.message).toMatch(/^Saving theme failed: backend not reachable$/)
  })
})

describe('audio commands', () => {
  it('patches play/pause and volume of the music', async () => {
    patch.mockResolvedValue({ data: { playing: true } })
    await saveAudio({ playing: true })
    expect(patch).toHaveBeenCalledWith('table/audio', { playing: true })

    await saveAudio({ volume: 35 })
    expect(patch).toHaveBeenCalledWith('table/audio', { volume: 35 })
  })

  it('posts sound effects', async () => {
    post.mockResolvedValue({ data: '' })
    await expect(playSound('heal')).resolves.toBeUndefined()
    expect(post).toHaveBeenCalledWith('table/sounds', { name: 'heal' })
  })

  it('reports failures as SaveError', async () => {
    patch.mockRejectedValue(networkError())
    post.mockRejectedValue(httpError(422))

    const music = await failure(saveAudio({ playing: true }))
    expect(music).toBeInstanceOf(SaveError)
    expect(music?.message).toMatch(/^Saving music failed: backend not reachable$/)
    expect((await failure(playSound('lock')))?.message)
      .toMatch(/^Saving sound lock failed: HTTP 422$/)
  })
})
