import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { apiClient } from '../../src/api/apiClient'
import { getData } from '../../src/api/apiMethods'
import { getAdminData, getSceneById } from '../../src/service/adminScreen'
import { getGroundScreenData } from '../../src/service/groundScreen'
import { getWallScreenData } from '../../src/service/WallScreen'

vi.mock('../../src/api/apiClient', () => ({
  apiClient: { get: vi.fn() },
}))

const get = vi.mocked(apiClient.get)

const networkError = () => new AxiosError('Network Error', AxiosError.ERR_NETWORK)
const timeoutError = () => new AxiosError('timeout of 5000ms exceeded', AxiosError.ECONNABORTED)
const httpError = (status: number) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    undefined,
    undefined,
    { status, statusText: '', data: {}, headers: {}, config: {} as InternalAxiosRequestConfig } as AxiosResponse
  )

beforeEach(() => {
  get.mockReset()
})

describe('getData', () => {
  it('rejects on a network error instead of resolving with undefined', async () => {
    get.mockRejectedValue(networkError())
    await expect(getData('scenes/details/1')).rejects.toBeInstanceOf(Error)
  })

  it('rejects on a timeout', async () => {
    get.mockRejectedValue(timeoutError())
    await expect(getData('scenes/details/1')).rejects.toBeInstanceOf(Error)
  })

  it('rejects on HTTP 500 with the status recognisable', async () => {
    get.mockRejectedValue(httpError(500))
    await expect(getData('scenes/details/1')).rejects.toMatchObject({ response: { status: 500 } })
  })

  it('resolves with the response data on success', async () => {
    get.mockResolvedValue({ data: { id: 1 } })
    await expect(getData('scenes/details/1')).resolves.toEqual({ id: 1 })
  })
})

describe('services', () => {
  const services: [string, () => Promise<unknown>][] = [
    ['getGroundScreenData', () => getGroundScreenData(1)],
    ['getSceneById', () => getSceneById(1)],
    ['getAdminData', () => getAdminData()],
    ['getWallScreenData', () => getWallScreenData(1)],
  ]

  it.each(services)('%s reports an unreachable backend, not "not found"', async (_, load) => {
    get.mockRejectedValue(networkError())
    const error = await load().then(() => undefined, (err: Error) => err)
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).not.toMatch(/not found/i)
    expect(error?.message).toMatch(/not reachable/i)
  })

  it.each(services)('%s reports a timeout', async (_, load) => {
    get.mockRejectedValue(timeoutError())
    const error = await load().then(() => undefined, (err: Error) => err)
    expect(error?.message).not.toMatch(/not found/i)
    expect(error?.message).toMatch(/timeout/i)
  })

  it.each(services)('%s reports the HTTP status', async (_, load) => {
    get.mockRejectedValue(httpError(500))
    const error = await load().then(() => undefined, (err: Error) => err)
    expect(error?.message).not.toMatch(/not found/i)
    expect(error?.message).toMatch(/HTTP 500/)
  })

  it.each(services)('%s reports an empty response as "not found"', async (_, load) => {
    get.mockResolvedValue({ data: undefined })
    await expect(load()).rejects.toThrow(/not found/i)
  })
})
