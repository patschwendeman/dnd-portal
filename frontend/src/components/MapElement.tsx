import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

interface MapElementProps {
    activeMapId: number,
    src?: string,
    handleSceneSelection?(id: number): void, 
    keyProp?: number,
    isMainMap: boolean
}

const MapContainer = styled.div<{ $isActive: boolean, $isMainMap: boolean }>`
    background-color: rgb(184, 184, 184);
    padding-top: ${props => props.$isMainMap ? '56.25%' : '0'};
    position: relative;
    flex-grow: 1;
    border-radius: 5px;
    border: 1px solid ${props => props.$isActive ? 'rgba(255, 0, 0, 1)' : '#242424'};
    box-shadow: ${props => props.$isActive ? '0 0 10px rgba(255, 0, 0, 1)' : 'none'};
`

const MapImage = styled.img`
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100%;
    object-fit: cover;
    border-radius: 5px;
`

const MapElement: FunctionComponent<MapElementProps> = ({ activeMapId, src, handleSceneSelection, keyProp, isMainMap }): ReactElement => {
    const handleClick = () => {
        if (keyProp !== undefined && handleSceneSelection) {
            handleSceneSelection(keyProp)
        }
    }
    const isActive = keyProp === activeMapId

    return (
        <MapContainer data-test-id={src} $isActive={isActive} onClick={handleClick} $isMainMap={isMainMap}>
            {src && <MapImage src={src} alt='' />}
        </MapContainer>
    )
}

export { MapElement }
