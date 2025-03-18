import { FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'


interface GridOverlayProps {
    gritColor: string,
    gritSize: number
}

const Overlay = styled.div`
    z-index: 99;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`
const GridLine = styled.div<{ $i: number, $width: number, $height: number, $left: number, $top: number, $gritColor: string }>`
    position: absolute;
    left: ${props => props.$left}px;
    top: ${props => props.$top}px;
    width: ${props => props.$width}px;
    height: ${props => props.$height}px;
    background-color: ${props => props.$gritColor};
`

const GridOverlay: FunctionComponent<GridOverlayProps> = ({ gritColor, gritSize }): ReactElement => {
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

    const dpi = window.devicePixelRatio * gritSize
    const gridSize = dpi 

    console.log(window.innerHeight)

    const gridLines = []

    for (let i = 0; i < screenSize.width; i += gridSize) {
        gridLines.push(
            <GridLine
                key={`v-${i}`}
                $i={i}
                $width= {2}
                $height={screenSize.height}
                $left={i}
                $top={0}
                $gritColor={gritColor}
            ></GridLine>
        )
    }

    for (let i = 0; i < screenSize.height; i += gridSize) {
        gridLines.push(
            <GridLine
                key={`h-${i}`}
                $i={i}
                $width= {screenSize.width}
                $height= {2}
                $left={0}
                $top={i}
                $gritColor={gritColor}
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
