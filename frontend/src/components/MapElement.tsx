import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

interface MapElementProps {
    activeMapId: number,
    src?: string,
    handleSceneSelection?(id: number, isMainMap: boolean): void, 
    keyProp?: number,
    isMainMap: boolean,
    isActiveMainMap: boolean,
    isAdminScreen: boolean
}

const MapContainer = styled.div<{ $isActive: boolean }>`
    background-color:${(props) => props.theme.colors.secondary};
    padding-top: 56.25%;
    position: relative;
    flex-grow: 1;
    border-radius: ${(props) => props.theme.radius.sm};
    border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
    outline: ${(props) => props.$isActive ? `${props.theme.borderWidth.thick} solid ${props.theme.colors.primary}` : 'none'};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
    box-shadow: none;
    cursor: pointer;
`

const MapImage = styled.img`
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100%;
    object-fit: cover;
    border-radius: ${(props) => props.theme.radius.sm};
`

const MapOverlay = styled.div<{ $isAdminScreen: boolean }>`
    position: absolute;
    display: ${props => props.$isAdminScreen ? 'none' : 'flex'};
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 99;
`

const NumberIcon = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 30px;
    height: 30px;
    border-radius: 100px;
    background-color: #5a5a5a;
    z-index: 99;
    align-items: center;
    justify-content: center;
    text-align: center;

    color: white;
    font-size: 20px;

`

const MapElement: FunctionComponent<MapElementProps> = ({ activeMapId, src, handleSceneSelection, keyProp, isMainMap, isActiveMainMap, isAdminScreen }): ReactElement => {
    const handleClick = () => {
        if (keyProp !== undefined && handleSceneSelection) {
            handleSceneSelection(keyProp, isMainMap)
        }
    }
    const isActive = keyProp === activeMapId && isMainMap === isActiveMainMap

    return (
        <MapContainer data-test-id={src} $isActive={isActive} onClick={handleClick}>
            <MapOverlay $isAdminScreen={isAdminScreen}>
                <NumberIcon>
                    {keyProp}
                </NumberIcon>
            </MapOverlay>           
            {src && <MapImage src={src} alt='' />}
            
        </MapContainer>
    )
}

export { MapElement }
