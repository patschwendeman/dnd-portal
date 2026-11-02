import { describe, it, expect } from 'vitest'

import mostImportantError from '../../src/utils/adminError'

const NO_ERRORS = { connection: false, load: false, save: false }

describe('mostImportantError', () => {
  it('returns null without an error', () => {
    expect(mostImportantError(NO_ERRORS)).toBeNull()
  })

  it.each(['connection', 'load', 'save'] as const)('returns the only error %s', (error) => {
    expect(mostImportantError({ ...NO_ERRORS, [error]: true })).toBe(error)
  })

  it('prefers the connection over a load and a save error', () => {
    expect(mostImportantError({ connection: true, load: true, save: true })).toBe('connection')
    expect(mostImportantError({ connection: true, load: false, save: true })).toBe('connection')
  })

  it('prefers a load error over a save error', () => {
    expect(mostImportantError({ connection: false, load: true, save: true })).toBe('load')
  })
})
