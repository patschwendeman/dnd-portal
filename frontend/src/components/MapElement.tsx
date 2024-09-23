import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

interface MapElementProps {
    activeMapId: number,
    src?: string,
    handleSceneSelection?(id: number, isMainMap: boolean): void, 
    keyProp?: number,
    isMainMap: boolean,
    isActiveMainMap: boolean
}

const MapContainer = styled.div<{ $isActive: boolean, $isMainMap: boolean }>`
    background-color:${(props) => props.theme.colors.secondary};
    padding-top: ${props => props.$isMainMap ? '56.25%' : '0'};
    position: relative;
    flex-grow: 1;
    border-radius: 5px;
    border-style: solid;
    border: 1px solid ${props => props.$isActive ? props.theme.colors.primary : props.theme.colors.border};
    box-shadow: ${props => props.$isActive ? '0 0 10px' + props.theme.colors.primary : 'none'};
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

const MapElement: FunctionComponent<MapElementProps> = ({ activeMapId, src, handleSceneSelection, keyProp, isMainMap, isActiveMainMap }): ReactElement => {
    const handleClick = () => {
        if (keyProp !== undefined && handleSceneSelection) {
            handleSceneSelection(keyProp, isMainMap)
        }
    }
    const isActive = keyProp === activeMapId && isMainMap === isActiveMainMap

    return (
        <MapContainer data-test-id={src} $isActive={isActive} onClick={handleClick} $isMainMap={isMainMap}>
            {src && <MapImage src={src} alt='' />}
        </MapContainer>
    )
}

export { MapElement }
