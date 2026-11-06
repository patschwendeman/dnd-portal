import styled from 'styled-components'

import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'

// Dims the whole screen below the overlay panel, as below a dialog in the Admin
export const OverlayLayer = styled.div<{ $isVisible: boolean }>`
    display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
    position: fixed;
    inset: 0;
    align-items: flex-start;
    justify-content: center;
    padding-top: ${(props) => props.theme.space[7]};
    z-index: ${(props) => props.theme.layer.panel};
    background-color: ${(props) => props.theme.colors.overlay};
`

export const OverlayPanel = styled.div<TileSurfaceProps>`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    height: auto;
    padding: ${(props) => props.theme.space[6]};
    ${tileSurface}
`

export const PanelHeader = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: ${(props) => props.theme.space[5]};
`

export const PanelTitle = styled.h2`
    ${textStyle('xl')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
`
