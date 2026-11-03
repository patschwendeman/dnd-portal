import { AdventureDetail, Theme } from '../models/models'

// Image layers behind the tiles of the Admin. An image is only shown once it is loaded, so the
// old one stays until the new one can replace it; the one that is replaced stays as `leaving`
// until its fade-out is over.
export interface AdventureBackgroundState {
  // Loaded and visible
  shown: string | null
  // Loading, still invisible
  pending: string | null
  // Fading out
  leaving: string | null
}

export type AdventureBackgroundAction = { type: 'target', src: string | null }
  | { type: 'loaded', src: string }
  | { type: 'failed', src: string }
  | { type: 'settled', src: string }

export const initialAdventureBackground = (src: string | null): AdventureBackgroundState => ({
  shown: null,
  pending: src,
  leaving: null,
})

const hide = (state: AdventureBackgroundState): AdventureBackgroundState => ({
  shown: null,
  pending: null,
  leaving: state.shown ?? state.leaving,
})

export function adventureBackgroundReducer(
  state: AdventureBackgroundState,
  action: AdventureBackgroundAction,
): AdventureBackgroundState {
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
      // Without the new image the background turns plain instead of keeping the old image
      return action.src === state.pending ? hide(state) : state
    case 'settled':
      return action.src === state.leaving ? { ...state, leaving: null } : state
    default:
      return state
  }
}

// The images to render, each once, in a stable order, so a layer keeps its element (and its
// loaded image) while it changes from pending to shown to leaving
export const adventureBackgroundLayers = (state: AdventureBackgroundState): string[] => (
  [state.leaving, state.shown, state.pending]
    .filter((src, index, all): src is string => src !== null && all.indexOf(src) === index)
)

export const isBackgroundImageShown = (state: AdventureBackgroundState): boolean => (
  state.shown !== null
)

// Media path of the image of the adventure for the theme; null while the adventure loads or
// without an image for the theme. Depends on nothing else, so a scene change keeps the image.
export const adventureBackgroundSource = (
  adventure: AdventureDetail | undefined,
  theme: Theme,
): string | null => {
  const image = theme === 'tavern' ? adventure?.background_tavern : adventure?.background_dark
  return image?.source ?? null
}
