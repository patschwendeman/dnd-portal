import { createGlobalStyle, css, keyframes } from 'styled-components'

import { MOTION_EASING } from './GlobalStyle'

const HERO_TRANSITION_MS = 500
const PAGE_FADE_MS = 250
const CARD_EXIT_MS = 260
const CARD_ENTRANCE_MS = 300
const HEAD_ENTRANCE_DELAY_MS = 300
const FIRST_CARD_ENTRANCE_DELAY_MS = 350
const CARD_STAGGER_MS = 60
/** Cards after this many have no name of their own and go with the rest of the page */
export const NAMED_CARD_COUNT = 12
const CARD_OFFSET = '16px'

const sink = keyframes`
  to {
    opacity: 0;
    transform: translateY(${CARD_OFFSET});
  }
`

const rise = keyframes`
  from {
    opacity: 0;
    transform: translateY(${CARD_OFFSET});
  }
`

const cardRules = Array.from({ length: NAMED_CARD_COUNT }, (_, index) => css`
  [data-view-card="${index}"] {
    view-transition-name: adventure-card-${index};
  }

  ::view-transition-old(adventure-card-${index}) {
    animation: ${sink} ${CARD_EXIT_MS}ms ease-in both;
  }

  ::view-transition-new(adventure-card-${index}) {
    animation: ${rise} ${CARD_ENTRANCE_MS}ms ${MOTION_EASING}
      ${FIRST_CARD_ENTRANCE_DELAY_MS + index * CARD_STAGGER_MS}ms both;
  }
`)

/**
 * The page transition between the adventure selection and the Admin. The image of a card and the
 * background of the Admin share one name, so the browser grows (or shrinks) one into the other and
 * cross-fades from light to darkened; the head and the cards of the selection sink away (or rise).
 * Rendered by both pages, because the rules have to be there in the page that is captured new.
 */
const PageTransitionStyle = createGlobalStyle`
  [data-view-hero] {
    view-transition-name: adventure-hero;
  }

  [data-view-head] {
    view-transition-name: adventure-select-head;
  }

  ${cardRules}

  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: ${PAGE_FADE_MS}ms;
  }

  ::view-transition-old(root) {
    animation-timing-function: ease-in;
  }

  /* Above the cards it grows out of or shrinks into */
  ::view-transition-group(adventure-hero) {
    z-index: 1;
    overflow: hidden;
    animation-duration: ${HERO_TRANSITION_MS}ms;
    animation-timing-function: ${MOTION_EASING};
  }

  /* Card and background differ in shape: cut off instead of stretched */
  ::view-transition-old(adventure-hero),
  ::view-transition-new(adventure-hero) {
    height: 100%;
    object-fit: cover;
    animation-duration: ${HERO_TRANSITION_MS}ms;
    animation-timing-function: ${MOTION_EASING};
  }

  ::view-transition-old(adventure-select-head) {
    animation: ${sink} ${CARD_EXIT_MS}ms ease-in both;
  }

  ::view-transition-new(adventure-select-head) {
    animation: ${rise} ${CARD_ENTRANCE_MS}ms ${MOTION_EASING} ${HEAD_ENTRANCE_DELAY_MS}ms both;
  }
`

export default PageTransitionStyle
