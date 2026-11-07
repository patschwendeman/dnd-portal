import {
  useCallback, useEffect, useReducer, useState,
} from 'react'

import { mediaUrl } from '../api/mediaUrl'
import { AdventureDetail } from '../models/models'

import {
  adventureBackgroundLayers,
  adventureBackgroundReducer,
  adventureBackgroundSource,
  initialAdventureBackground,
  isBackgroundImageShown,
} from './adventureBackground'

export const BACKGROUND_FADE_MS = 600

interface AdventureBackground {
  layers: string[]
  shown: string | null
  /** The held image: it appears without fading in */
  instant: string | null
  isImageShown: boolean
  onLoad: (src: string) => void
  onError: (src: string) => void
}

/**
 * State of the adventure image behind the tiles of the Admin and the cards of the Player; without
 * an image (or while the adventure loads) the background is plain.
 * `heldSource` (a media path) is shown instead of the image of `adventure` while it is set, e.g.
 * the image of the card the Admin was opened from, before the Admin loaded the adventure.
 */
export function useAdventureBackground(
  adventure: Pick<AdventureDetail, 'image'> | undefined,
  heldSource: string | null = null,
): AdventureBackground {
  const source = heldSource ?? adventureBackgroundSource(adventure)
  const src = source === null ? null : mediaUrl(source)
  const [state, dispatch] = useReducer(adventureBackgroundReducer, src, initialAdventureBackground)

  const [prevSrc, setPrevSrc] = useState(src)
  if (src !== prevSrc) {
    setPrevSrc(src)
    dispatch({ type: 'target', src })
  }

  // A timer instead of transitionend: without motion there is no transition that could end
  const { leaving } = state
  useEffect(() => {
    if (leaving === null) {
      return undefined
    }
    const timer = window.setTimeout(
      () => dispatch({ type: 'settled', src: leaving }),
      BACKGROUND_FADE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [leaving])

  const onLoad = useCallback((loaded: string) => dispatch({ type: 'loaded', src: loaded }), [])
  const onError = useCallback((failed: string) => dispatch({ type: 'failed', src: failed }), [])

  return {
    layers: adventureBackgroundLayers(state),
    shown: state.shown,
    instant: heldSource === null ? null : mediaUrl(heldSource),
    isImageShown: isBackgroundImageShown(state),
    onLoad,
    onError,
  }
}
