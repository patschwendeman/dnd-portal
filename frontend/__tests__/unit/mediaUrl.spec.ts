import { describe, it, expect } from 'vitest'

import { buildMediaUrl } from '../../src/api/mediaUrl'

describe('buildMediaUrl', () => {
  it('should join a base URL with a trailing slash and a media path', () => {
    expect(buildMediaUrl('http://localhost:8000/', '/media/images/wall_screen/forest.jpg')).toBe(
      'http://localhost:8000/media/images/wall_screen/forest.jpg',
    )
  })

  it('should join a base URL without a trailing slash and a media path', () => {
    expect(buildMediaUrl('http://192.168.0.10:8000', '/media/music/side/forest/City_Gates.mp3'))
      .toBe(
        'http://192.168.0.10:8000/media/music/side/forest/City_Gates.mp3',
      )
  })

  it('should keep a path prefix of the base URL', () => {
    expect(buildMediaUrl('http://example.com/api/', '/media/images/ground_screen/main_1.jpg')).toBe(
      'http://example.com/api/media/images/ground_screen/main_1.jpg',
    )
  })

  it('should keep a relative base, so media load through the proxy of the frontend', () => {
    expect(buildMediaUrl('/api/', '/media/images/wall_screen/forest.jpg'))
      .toBe('/api/media/images/wall_screen/forest.jpg')
  })
})
