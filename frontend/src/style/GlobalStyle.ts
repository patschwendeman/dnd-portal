import { createGlobalStyle, css, keyframes } from 'styled-components'

import { textStyle } from './tokens'
import { TileEntrance, TileOrigin } from '../utils/adminEntrance'

/** Applies to all four screens: each screen renders it itself (it runs in its own window). */
const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
  }

  body {
    font-family: ${(props) => props.theme.font.family.base};
    ${textStyle('md')}
  }
`

/**
 * Thin scrollbar whose thumb only shows while the mouse is over the scrolling area; apply it to the
 * element that scrolls
 */
export const hoverScrollbar = css`
  &::-webkit-scrollbar {
    width: ${(props) => props.theme.size.scrollbar};
  }
  &:hover::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.border};
  }
`

const TILE_BLUR = '12px'

export interface TileSurfaceProps {
  /**
   * Only while an image lies behind the tile (background image in Admin and Player, scene on Wall
   * and Ground): over the plain background the translucent surface would give another tone than the
   * one the contrast was measured for. Exception: the adventure selection is always translucent
   * over its plain background, so its cards keep the look they have in front of an image; the
   * contrast holds, as it was measured against the worst image (white or black)
   */
  $isTranslucent?: boolean
}

/**
 * Surface of the tiles in the Admin, the panels, overlays and tiles on Wall and Ground and the
 * cards of the Player. The inner light edge at the top is the only box-shadow of the style guide;
 * tiles cast no shadow. A tile with another surface sets its background-color after it and leaves
 * out $isTranslucent
 */
export const tileSurface = css<TileSurfaceProps>`
  background-color: ${(props) => (
    props.$isTranslucent ? props.theme.colors.secondaryTranslucent : props.theme.colors.secondary
  )};
  backdrop-filter: ${(props) => (props.$isTranslucent ? `blur(${TILE_BLUR})` : 'none')};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.lg};
  box-shadow: inset 0 ${(props) => props.theme.borderWidth.thin} 0
    ${(props) => props.theme.colors.border};
`

/** Curve of all entrances; fading out uses ease-in */
export const MOTION_EASING = 'cubic-bezier(.2, .7, .2, 1)'
const TILE_ENTRANCE_MS = 380
const TILE_STAGGER_MS = 65
const LAST_TILE_INDEX = 8
/** From the start of the build-up until the last tile stands */
export const TILE_BUILD_MS = LAST_TILE_INDEX * TILE_STAGGER_MS + TILE_ENTRANCE_MS
export const TILE_EXIT_MS = 200
const CONTENT_FADE_MS = 200

const TILE_OFFSETS: Record<TileOrigin, string> = {
  top: 'translateY(-12px)',
  bottom: 'translateY(12px)',
  left: 'translateX(-16px)',
  right: 'translateX(16px)',
}

const tileIn = keyframes`
  from {
    opacity: 0;
    transform: var(--tile-offset);
  }
`

const tileOut = keyframes`
  to {
    opacity: 0;
    transform: scale(.98);
  }
`

const contentIn = keyframes`
  from {
    opacity: 0;
  }
`

/** Marks a tile of the Admin for the build-up; the rules come from `tileEntrance` on the screen */
export const tileEntranceAttributes = (tile: TileEntrance) => ({
  'data-tile-index': tile.index,
  'data-tile-origin': tile.origin,
})

/** Marks an element whose children fade in when they appear during the build-up */
export const ENTRANCE_CONTENT_ATTRIBUTES = { 'data-entrance-content': true }

const tileDelays = Array.from({ length: LAST_TILE_INDEX + 1 }, (_, index) => (
  `[data-tile-index="${index}"] { animation-delay: ${index * TILE_STAGGER_MS}ms; }`
)).join('\n')

const tileOffsets = Object.entries(TILE_OFFSETS).map(([origin, offset]) => (
  `[data-tile-origin="${origin}"] { --tile-offset: ${offset}; }`
)).join('\n')

/**
 * Build-up and fade-out of the tiles of a screen, driven by its attribute `data-entrance` (see
 * EntrancePhase). Only opacity and transform move, on the tiles themselves: an animated parent
 * would cut the tiles off from the background they blur, and nothing waits for the animation.
 * While pending, the build-up is paused at its first frame, so starting it changes only the play
 * state and never restarts it. With `data-content-fade` the children of marked elements fade in
 * when they appear.
 */
export const tileEntrance = css`
  &[data-content-fade] [data-entrance-content] > * {
    animation: ${contentIn} ${CONTENT_FADE_MS}ms ${MOTION_EASING} both;
  }

  &[data-entrance="pending"],
  &[data-entrance="building"] {
    [data-tile-index] {
      animation: ${tileIn} ${TILE_ENTRANCE_MS}ms ${MOTION_EASING} both;
    }

    ${tileDelays}
    ${tileOffsets}
  }

  &[data-entrance="pending"] [data-tile-index] {
    animation-play-state: paused;
  }

  &[data-entrance="exiting"] [data-tile-index] {
    animation: ${tileOut} ${TILE_EXIT_MS}ms ease-in both;
  }
`

export default GlobalStyle
