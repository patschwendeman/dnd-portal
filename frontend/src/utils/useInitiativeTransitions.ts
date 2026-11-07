import { RefObject, useLayoutEffect, useRef } from 'react'

import { planTransitions } from './wallInitiative'

const MOVE_MS = 500
const FADE_MS = 300
const ENTER_DELAY_MS = 100
// Distance of the slide when a tile fades out (to the left or up) or comes in from the right
const SLIDE_PX = 48
const LEAVE_PX = 24
const EASING = 'cubic-bezier(.2, .7, .2, 1)'

interface Snapshot {
  rect: DOMRect
  clone: HTMLElement
}

const keyedChildren = (strip: HTMLElement): HTMLElement[] => (
  Array.from(strip.querySelectorAll<HTMLElement>(':scope > [data-key]'))
)

const prefersReducedMotion = (): boolean => (
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

// A copy of the tile at its old place that fades out; the original already stands elsewhere. The
// copy is hidden from assistive technology and from the selectors of the tests.
const fadeOutGhost = (layer: HTMLElement, snapshot: Snapshot, to: string): void => {
  const ghost = snapshot.clone
  ghost.setAttribute('aria-hidden', 'true')
  const marked = [ghost, ...Array.from(ghost.querySelectorAll('[data-test-id], [data-key]'))]
  marked.forEach((node) => {
    node.removeAttribute('data-test-id')
    node.removeAttribute('data-key')
  })
  Object.assign(ghost.style, {
    position: 'absolute',
    left: `${snapshot.rect.left}px`,
    top: `${snapshot.rect.top}px`,
    width: `${snapshot.rect.width}px`,
    height: `${snapshot.rect.height}px`,
    margin: '0',
  })
  layer.append(ghost)
  ghost.animate(
    [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: to }],
    { duration: FADE_MS, easing: EASING },
  ).finished.then(() => ghost.remove(), () => ghost.remove())
}

const slideIn = (element: HTMLElement): void => {
  element.animate(
    [{ opacity: 0, transform: `translateX(${SLIDE_PX}px)` }, { opacity: 1, transform: 'none' }],
    {
      duration: MOVE_MS, delay: ENTER_DELAY_MS, easing: EASING, fill: 'backwards',
    },
  )
}

const glide = (element: HTMLElement, from: DOMRect, to: DOMRect): void => {
  const dx = from.left - to.left
  const dy = from.top - to.top
  const sx = from.width / to.width
  const sy = from.height / to.height
  if (dx === 0 && dy === 0 && sx === 1 && sy === 1) {
    return
  }
  element.animate(
    [
      { transformOrigin: 'left top', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      { transformOrigin: 'left top', transform: 'none' },
    ],
    { duration: MOVE_MS, easing: EASING },
  )
}

/**
 * When the turn passes on, the tiles of the strip glide to their new place and size; whoever moves
 * to the end fades out at the old place and comes in from the right, whoever is gone fades out.
 * Other changes appear without animation, as does everything with reduced motion. The tiles are the
 * children of `strip` with a data-key; the fading copies go into `ghostLayer`, which React leaves
 * empty.
 */
const useInitiativeTransitions = (
  strip: RefObject<HTMLElement | null>,
  ghostLayer: RefObject<HTMLElement | null>,
  activeId: number | null,
): void => {
  const snapshots = useRef<Map<string, Snapshot>>(new Map())
  const previousActiveId = useRef(activeId)

  useLayoutEffect(() => {
    if (!strip.current || !ghostLayer.current) {
      return
    }
    const elements = keyedChildren(strip.current)
    elements.forEach((element) => {
      element.getAnimations().forEach((animation) => animation.cancel())
    })
    const current = new Map(elements.map((element) => [element.dataset.key ?? '', {
      rect: element.getBoundingClientRect(),
      clone: element.cloneNode(true) as HTMLElement,
    }]))

    const before = snapshots.current
    if (previousActiveId.current !== activeId && !prefersReducedMotion()) {
      const layer = ghostLayer.current
      const transitions = planTransitions([...before.keys()], [...current.keys()])
      transitions.left.forEach((key) => {
        fadeOutGhost(layer, before.get(key) as Snapshot, `translateY(-${LEAVE_PX}px)`)
      })
      elements.forEach((element) => {
        const key = element.dataset.key ?? ''
        const previous = before.get(key)
        if (transitions.moved.includes(key) && previous) {
          glide(element, previous.rect, (current.get(key) as Snapshot).rect)
          return
        }
        if (previous) {
          fadeOutGhost(layer, previous, `translateX(-${SLIDE_PX}px)`)
        }
        slideIn(element)
      })
    }
    previousActiveId.current = activeId
    snapshots.current = current
  })
}

export default useInitiativeTransitions
