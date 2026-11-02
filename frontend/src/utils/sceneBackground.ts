// Image layers behind the tiles of the Admin. An image is only shown once it is loaded, so the
// old one stays until the new one can replace it; the one that is replaced stays as `leaving`
// until its fade-out is over.
export interface SceneBackgroundState {
  // Loaded and visible
  shown: string | null
  // Loading, still invisible
  pending: string | null
  // Fading out
  leaving: string | null
}

export type SceneBackgroundAction = { type: 'target', src: string | null }
  | { type: 'loaded', src: string }
  | { type: 'failed', src: string }
  | { type: 'settled', src: string }

export const initialSceneBackground = (src: string | null): SceneBackgroundState => ({
  shown: null,
  pending: src,
  leaving: null,
})

const hide = (state: SceneBackgroundState): SceneBackgroundState => ({
  shown: null,
  pending: null,
  leaving: state.shown ?? state.leaving,
})

export function sceneBackgroundReducer(
  state: SceneBackgroundState,
  action: SceneBackgroundAction,
): SceneBackgroundState {
  switch (action.type) {
    case 'target':
      if (action.src === null) {
        return hide(state)
      }
      if (action.src === state.shown) {
        return { ...state, pending: null }
      }
      // Still loaded from before: no need to wait for it
      if (action.src === state.leaving) {
        return { shown: action.src, pending: null, leaving: state.shown }
      }
      return { ...state, pending: action.src }
    case 'loaded':
      if (action.src !== state.pending) {
        return state
      }
      return { shown: action.src, pending: null, leaving: state.shown ?? state.leaving }
    case 'failed':
      // Without the new image the background turns plain instead of keeping the old scene
      return action.src === state.pending ? hide(state) : state
    case 'settled':
      return action.src === state.leaving ? { ...state, leaving: null } : state
    default:
      return state
  }
}

// The images to render, each once, in a stable order, so a layer keeps its element (and its
// loaded image) while it changes from pending to shown to leaving
export const sceneBackgroundLayers = (state: SceneBackgroundState): string[] => (
  [state.leaving, state.shown, state.pending]
    .filter((src, index, all): src is string => src !== null && all.indexOf(src) === index)
)

export const isSceneImageShown = (state: SceneBackgroundState): boolean => state.shown !== null
