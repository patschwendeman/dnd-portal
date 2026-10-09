import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { textStyle } from '../style/tokens'

interface MapElementProps {
    activeSceneId: number,
    src?: string,
    handleSceneSelection?(sceneId: number): void, 
    sceneId: number,
    number?: number,
    isAdminScreen: boolean
}

const MapContainer = styled.div<{ $isActive: boolean, $isAdminScreen: boolean }>`
    background-color:${(props) => props.theme.colors.secondary};
    padding-top: 56.25%;
    position: relative;
    flex-grow: 1;
    border-radius: ${(props) => props.$isAdminScreen ? props.theme.radius.sm : props.theme.radius.md};
    /* Edge as outline (like the mockup), so it does not add to the tile height; the active outline replaces it */
    outline: ${(props) => props.$isActive
        ? `${props.theme.borderWidth.thick} solid ${props.theme.colors.primary}`
        : `${props.theme.borderWidth.thin} solid ${props.theme.colors.border}`};
    outline-offset: ${(props) => props.$isActive ? props.theme.borderWidth.thick : '0'};
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
    border-radius: inherit;
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
    z-index: ${(props) => props.theme.layer.raised};
`

const NumberIcon = styled.div`
    position: absolute;
    top: ${(props) => props.theme.space[2]};
    left: ${(props) => props.theme.space[2]};
    min-width: ${(props) => props.theme.size.badge};
    height: ${(props) => props.theme.size.badge};
    padding: 0 ${(props) => props.theme.space[2]};
    display: grid;
    place-items: center;
    border-radius: ${(props) => props.theme.radius.pill};
    background-color: ${(props) => props.theme.colors.badge.background};
    z-index: ${(props) => props.theme.layer.raised};
    color: ${(props) => props.theme.colors.badge.text};
    ${textStyle('md')}
    font-weight: ${(props) => props.theme.fontWeight.bold};
    font-variant-numeric: tabular-nums;
`

const MapElement: FunctionComponent<MapElementProps> = ({ activeSceneId, src, handleSceneSelection, sceneId, number, isAdminScreen }): ReactElement => {
    const handleClick = () => {
        if (handleSceneSelection) {
            handleSceneSelection(sceneId)
        }
    }
    // Scene ids are unique across battle and non-battle scenes, so the id alone identifies the active tile
    const isActive = sceneId === activeSceneId

    return (
        <MapContainer data-test-id={src} $isActive={isActive} $isAdminScreen={isAdminScreen} onClick={handleClick}>
            <MapOverlay $isAdminScreen={isAdminScreen}>
                <NumberIcon>
                    {number}
                </NumberIcon>
            </MapOverlay>           
            {src && <MapImage src={src} alt='' />}
            
        </MapContainer>
    )
}

export { MapElement }
