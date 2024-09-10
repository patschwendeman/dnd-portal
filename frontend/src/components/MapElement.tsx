import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

interface MapElementProps {
    activeMapId: number,
    src?: string,
    handleSceneSelection?(id: number): void, 
    keyProp?: number
}

const MapContainer = styled.div<{ $isActive: boolean }>`
    background-color: rgb(184, 184, 184);
    width: 100%;
    padding-top: 56.25%;
    position: relative;
    flex-grow: 1;
    border-radius: 5px;
    border: 1px solid ${props => props.$isActive ? 'blue' : '#242424'};
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

const MapElement: FunctionComponent<MapElementProps> = ({ activeMapId, src, handleSceneSelection, keyProp }): ReactElement => {
    const handleClick = () => {
        if (keyProp !== undefined && handleSceneSelection) {
            handleSceneSelection(keyProp)
        }
    }

    // Prüfe, ob der aktuelle MapElement aktiv ist
    const isActive = keyProp === activeMapId

    return (
        <MapContainer data-test-id={src} $isActive={isActive} onClick={handleClick}>
            {src && <MapImage src={src} alt='' />}
        </MapContainer>
    )
}

export { MapElement }
