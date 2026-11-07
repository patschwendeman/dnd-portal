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
  isImageShown: boolean
  onLoad: (src: string) => void
  onError: (src: string) => void
}

/**
 * State of the adventure image behind the tiles of the Admin, the adventure selection and the
 * cards of the Player; without an image (or while the adventure loads) the background is plain
 */
export function useAdventureBackground(
  adventure: Pick<AdventureDetail, 'image'> | undefined,
): AdventureBackground {
  const source = adventureBackgroundSource(adventure)
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
    isImageShown: isBackgroundImageShown(state),
    onLoad,
    onError,
  }
}
