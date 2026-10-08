import { FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'


interface GridOverlayProps {
    gridColor: string,
    gridOption: number
}

const Overlay = styled.div`
    z-index: ${(props) => props.theme.layer.grid};
    position: fixed;
    inset: 0;
    pointer-events: none;
`
// Vertical lines span the full height, horizontal lines the full width of the overlay;
// the line thickness comes from the theme
const GridLine = styled.div<{ $orientation: 'vertical' | 'horizontal', $offset: number, $gridColor: string }>`
    position: absolute;
    left: ${props => props.$orientation === 'vertical' ? `${props.$offset}px` : '0'};
    top: ${props => props.$orientation === 'horizontal' ? `${props.$offset}px` : '0'};
    width: ${props => props.$orientation === 'vertical' ? props.theme.borderWidth.thick : '100%'};
    height: ${props => props.$orientation === 'horizontal' ? props.theme.borderWidth.thick : '100%'};
    background-color: ${props => props.$gridColor};
`

const GridOverlay: FunctionComponent<GridOverlayProps> = ({ gridColor, gridOption }): ReactElement => {
    const [screenSize, setScreenSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    })

    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                width: window.innerWidth ,
                height: window.innerHeight,
            })
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const dpi = window.devicePixelRatio * gridOption
    const gridSize = dpi 
    const gridLines = []

    for (let i = 0; i < screenSize.width; i += gridSize) {
        gridLines.push(
            <GridLine
                key={`v-${i}`}
                $orientation='vertical'
                $offset={i}
                $gridColor={gridColor}
            ></GridLine>
        )
    }

    for (let i = 0; i < screenSize.height; i += gridSize) {
        gridLines.push(
            <GridLine
                key={`h-${i}`}
                $orientation='horizontal'
                $offset={i}
                $gridColor={gridColor}
            ></GridLine>
        )
    }

    return (
        <Overlay>
            {gridLines}
        </Overlay>
    )
}

export { GridOverlay }
