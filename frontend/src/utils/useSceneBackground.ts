import {
  useCallback, useEffect, useReducer, useState,
} from 'react'

import {
  initialSceneBackground,
  isSceneImageShown,
  sceneBackgroundLayers,
  sceneBackgroundReducer,
} from './sceneBackground'

export const SCENE_FADE_MS = 600

interface SceneBackground {
  layers: string[]
  shown: string | null
  isImageShown: boolean
  onLoad: (src: string) => void
  onError: (src: string) => void
}

// State of the image behind the tiles of the Admin; src null = plain background
export function useSceneBackground(src: string | null): SceneBackground {
  const [state, dispatch] = useReducer(sceneBackgroundReducer, src, initialSceneBackground)

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
      SCENE_FADE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [leaving])

  const onLoad = useCallback((loaded: string) => dispatch({ type: 'loaded', src: loaded }), [])
  const onError = useCallback((failed: string) => dispatch({ type: 'failed', src: failed }), [])

  return {
    layers: sceneBackgroundLayers(state),
    shown: state.shown,
    isImageShown: isSceneImageShown(state),
    onLoad,
    onError,
  }
}
