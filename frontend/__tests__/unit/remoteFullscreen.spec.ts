import {
  describe, it, expect, vi,
} from 'vitest'

import { createRemoteFullscreen, FullscreenTarget } from '../../src/realtime/remoteFullscreen'

// A document whose requestFullscreen is resolved or refused by the test
const fakeTarget = () => {
  let fullscreen = false
  const requests: { resolve: () => void, reject: () => void }[] = []
  const target: FullscreenTarget = {
    isFullscreen: () => fullscreen,
    request: () => new Promise<void>((resolve, reject) => {
      requests.push({
        resolve: () => {
          fullscreen = true
          resolve()
        },
        reject: () => reject(new TypeError('Permissions check failed')),
      })
    }),
    exit: vi.fn(() => {
      fullscreen = false
      return Promise.resolve()
    }),
  }
  return { target, requests }
}

// Lets the then/finally handlers of the request run
const settle = () => new Promise((resolve) => {
  setTimeout(resolve, 0)
})

describe('createRemoteFullscreen', () => {
  it('switches to full screen when the browser allows it', async () => {
    const { target, requests } = fakeTarget()
    const onRejected = vi.fn()
    const remote = createRemoteFullscreen(target, onRejected)

    remote.handleRequest(true)
    requests[0].resolve()
    await settle()

    expect(target.isFullscreen()).toBe(true)
    expect(onRejected).not.toHaveBeenCalled()
  })

  it('reports a refusal and repeats the request with the next click', async () => {
    const { target, requests } = fakeTarget()
    const onRejected = vi.fn()
    const remote = createRemoteFullscreen(target, onRejected)

    remote.handleRequest(true)
    requests[0].reject()
    await settle()
    expect(onRejected).toHaveBeenCalledTimes(1)

    remote.handleUserActivation()
    expect(requests).toHaveLength(2)
    requests[1].resolve()
    await settle()
    expect(target.isFullscreen()).toBe(true)

    // Only one click repeats the request
    remote.handleUserActivation()
    expect(requests).toHaveLength(2)
  })

  it('ignores clicks without a refused request', () => {
    const { target, requests } = fakeTarget()
    const remote = createRemoteFullscreen(target, vi.fn())

    remote.handleUserActivation()

    expect(requests).toHaveLength(0)
  })

  it('switching off drops a refused request, so a later click does nothing', async () => {
    const { target, requests } = fakeTarget()
    const remote = createRemoteFullscreen(target, vi.fn())
    remote.handleRequest(true)
    requests[0].reject()
    await settle()

    remote.handleRequest(false)
    remote.handleUserActivation()

    expect(requests).toHaveLength(1)
    // Not in full screen: nothing to leave
    expect(target.exit).not.toHaveBeenCalled()
  })

  it('leaves full screen on request', async () => {
    const { target, requests } = fakeTarget()
    const remote = createRemoteFullscreen(target, vi.fn())
    remote.handleRequest(true)
    requests[0].resolve()
    await settle()

    remote.handleRequest(false)

    expect(target.exit).toHaveBeenCalledTimes(1)
    expect(target.isFullscreen()).toBe(false)
  })

  it('runs one request at a time and none while in full screen', async () => {
    const { target, requests } = fakeTarget()
    const remote = createRemoteFullscreen(target, vi.fn())

    // The delegated request of the Admin window and the same request over the server
    remote.handleRequest(true)
    remote.handleRequest(true)
    expect(requests).toHaveLength(1)

    requests[0].resolve()
    await settle()
    remote.handleRequest(true)
    expect(requests).toHaveLength(1)
  })
})
