import React, { FunctionComponent, ReactElement } from "react";
import styled from 'styled-components';


const MapContainer = styled.div`
    background-color: rgb(184, 184, 184);
    width: 100%;
    padding-top: 56.25%;
    position: relative;
    flex-grow: 1;
    border-radius: 5px;
    border : 1px solid #242424;

`;

const MapImage = styled.img`
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100%;
    object-fit: cover;
    border-radius: 5px;
`;

interface MapElementProps {
    src?: string;
    handleSceneSelection?(id: number): number
    keyProp: number | undefined;   
}

const MapElement: FunctionComponent<MapElementProps> = ({ src, handleSceneSelection, keyProp }): ReactElement => {
    const handleClick = () => {
        if (keyProp !== undefined && handleSceneSelection) {
            handleSceneSelection(keyProp);
        }
    };
    return (
        <MapContainer  onClick={handleClick}>
             {src && <MapImage src={src} alt="" />}
        </MapContainer>
    );
};

export { MapElement };
