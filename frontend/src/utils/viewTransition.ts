import { flushSync } from 'react-dom'

/** Longest wait for the shared image (or the target card) in the new page before it is captured */
export const HERO_WAIT_MS = 300
// The image is only looked for while rendering is held back, so a short interval costs nothing
const HERO_POLL_MS = 16

// Marks the element that carries the shared image of a page transition (at most one per page)
const HERO_SELECTOR = '[data-view-hero]'

/** Whether the page shows its shared image, the signal a page transition waits for */
export const isHeroShown = (): boolean => document.querySelector(HERO_SELECTOR) !== null

interface ViewTransitionHandle {
  finished: Promise<void>
}

// Not yet in the DOM types of TypeScript 5.5
type StartViewTransition = (update: () => Promise<void>) => ViewTransitionHandle

export interface TransitionEnvironment {
  /** Undefined in browsers without the View Transitions API */
  startViewTransition?: StartViewTransition
  reducedMotion: boolean
}

export const prefersReducedMotion = (): boolean => (
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

const browserEnvironment = (): TransitionEnvironment => {
  const doc = document as Document & { startViewTransition?: StartViewTransition }
  return {
    // Bound, because the API throws when called without the document as `this`
    startViewTransition: doc.startViewTransition?.bind(doc),
    reducedMotion: prefersReducedMotion(),
  }
}

/** False with "reduce motion" and in browsers without the View Transitions API */
export const canTransition = (env: TransitionEnvironment = browserEnvironment()): boolean => (
  !env.reducedMotion && env.startViewTransition !== undefined
)

/**
 * Resolves true as soon as `isReady` returns true, false once `limitMs` passed without it. Polls
 * with timers, because animation frames do not run while a view transition holds back rendering.
 */
export const waitUntil = (isReady: () => boolean, limitMs: number): Promise<boolean> => (
  new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      if (isReady()) {
        resolve(true)
      } else if (Date.now() - start >= limitMs) {
        resolve(false)
      } else {
        setTimeout(check, HERO_POLL_MS)
      }
    }
    check()
  })
)

let running: Promise<void> = Promise.resolve()

/**
 * The end of the page transition started last (already resolved without one), so the page it led
 * to can wait for it; a skipped or failed transition counts as ended.
 */
export const runningPageTransition = (): Promise<void> => running

/**
 * Runs `update` (a navigation) as a view transition: React renders the new page synchronously
 * inside it, then the transition waits up to HERO_WAIT_MS for `isReady` (e.g. the shared image is
 * loaded) before it captures the new page; without it the old page only fades. Without the API or
 * with "reduce motion" `update` runs at once without a transition. Returns the end of the
 * transition.
 */
export function startPageTransition(
  update: () => void,
  isReady: (() => boolean) | null = null,
  env: TransitionEnvironment = browserEnvironment(),
): Promise<void> {
  const start = env.startViewTransition
  if (env.reducedMotion || start === undefined) {
    running = Promise.resolve()
    update()
    return running
  }
  const transition = start(async () => {
    flushSync(update)
    if (isReady !== null) {
      await waitUntil(isReady, HERO_WAIT_MS)
    }
  })
  running = transition.finished.catch(() => undefined)
  return running
}
