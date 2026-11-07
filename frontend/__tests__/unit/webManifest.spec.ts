import { existsSync, readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose: string
}

const publicFile = (path: string): URL => new URL(`../../public${path}`, import.meta.url)

const manifest = JSON.parse(readFileSync(publicFile('/manifest.webmanifest'), 'utf8'))
const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

const APP_COLOR = '#0e1117'

describe('web app manifest', () => {
  it('opens the character selection as "DnD Portal" without browser bar', () => {
    expect(manifest).toMatchObject({
      name: 'DnD Portal',
      short_name: 'DnD Portal',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: APP_COLOR,
      theme_color: APP_COLOR,
    })
    expect(manifest).not.toHaveProperty('orientation')
  })

  it('has PNG icons in 192 and 512 for any and 512 as maskable', () => {
    const icons = manifest.icons as ManifestIcon[]
    const entries = icons.map(({ sizes, type, purpose }) => `${sizes} ${type} ${purpose}`)
    expect(entries).toEqual([
      '192x192 image/png any',
      '512x512 image/png any',
      '512x512 image/png maskable',
    ])
  })

  it('points to icon files that exist under public/', () => {
    const icons = manifest.icons as ManifestIcon[]
    icons.forEach(({ src }) => {
      expect(existsSync(publicFile(src)), src).toBe(true)
    })
  })
})

describe('index.html', () => {
  it('links the manifest and an existing apple touch icon', () => {
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    const touchIcon = indexHtml.match(/<link rel="apple-touch-icon" href="([^"]+)"/)
    expect(touchIcon).not.toBeNull()
    expect(existsSync(publicFile(touchIcon![1])), touchIcon![1]).toBe(true)
  })

  it('has the iOS meta tags for the home screen', () => {
    expect(indexHtml).toContain('<meta name="theme-color" content="#0e1117" />')
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />')
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-title" content="DnD Portal" />')
    expect(indexHtml)
      .toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black" />')
  })
})
