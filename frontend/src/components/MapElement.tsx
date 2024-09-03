import React from 'react';
import { FunctionComponent, ReactElement } from "react";
import styled from 'styled-components';


interface MapElementPropsProps {
    src: string;
    handleSceneSelection(id: number): number
    keyProp: number;
    
}

const MapContainer = styled.div`
    background-color: rgb(184, 184, 184);
    width: 100%;
    padding-top: 56.25%;
    position: relative;
    flex-grow: 1;
    border-radius: 5px;
    border: solid 1px transparent;
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

const MapElement: FunctionComponent<MapElementPropsProps> = ({ src, handleSceneSelection, keyProp }): ReactElement => {
    return (
        <MapContainer onClick={() => handleSceneSelection(keyProp)}>
            <MapImage src={src} alt="" />
        </MapContainer>
    );
};

export { MapElement };
