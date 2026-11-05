import { ReactElement, useEffect, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import useDocumentFullscreen from '../utils/useDocumentFullscreen'

import fullscreenIcon from '/assets/icons/fullscreen.svg'
import fullscreenExitIcon from '/assets/icons/fullscreenExit.svg'

const Backdrop = styled.button`
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 0;
    z-index: ${(props) => props.theme.layer.control};
    background-color: ${(props) => props.theme.colors.overlay};
    border: none;
    cursor: pointer;
    font: inherit;
`

const Content = styled.span<TileSurfaceProps>`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${(props) => props.theme.space[3]};
    padding: ${(props) => props.theme.space[5]};
    ${tileSurface}
    color: ${(props) => props.theme.colors.text.color};
    ${textStyle('lg')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};

    svg {
        display: block;
        width: ${(props) => props.theme.size.icon};
        height: ${(props) => props.theme.size.icon};
    }
`

// Only the mouse shows the overlay: wall and ground run on monitors of the game table computer, a
// touch would otherwise cover the screen without a way to hide it again
const isMouse = (event: PointerEvent): boolean => event.pointerType === 'mouse'

// Wall and ground have no controls; this is the only exception, because the full screen of a
// window can only be requested by an interaction in that window
function FullscreenHoverOverlay(): ReactElement | null {
  const theme = useTheme()
  const { isFullscreen, toggle } = useDocumentFullscreen()
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    // pointermove as well: after loading, the mouse may already be over the window without an enter
    const show = (event: PointerEvent) => {
      if (isMouse(event)) {
        setIsHovered(true)
      }
    }
    const hide = (event: PointerEvent) => {
      if (isMouse(event)) {
        setIsHovered(false)
      }
    }
    root.addEventListener('pointerenter', show)
    root.addEventListener('pointermove', show)
    root.addEventListener('pointerleave', hide)
    return () => {
      root.removeEventListener('pointerenter', show)
      root.removeEventListener('pointermove', show)
      root.removeEventListener('pointerleave', hide)
    }
  }, [])

  if (!isHovered) {
    return null
  }

  const label = isFullscreen ? 'Vollbild beenden' : 'Vollbild'

  return (
    <Backdrop
      type="button"
      aria-label={label}
      aria-pressed={isFullscreen}
      data-test-id="fullscreen-overlay"
      onClick={toggle}
    >
      <Content $isTranslucent>
        <ReactSVG
          wrapper="span"
          src={isFullscreen ? fullscreenExitIcon : fullscreenIcon}
          beforeInjection={(svg) => {
            svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
          }}
        />
        {label}
      </Content>
    </Backdrop>
  )
}

export default FullscreenHoverOverlay
