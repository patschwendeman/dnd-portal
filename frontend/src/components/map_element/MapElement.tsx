import React from 'react'
import { FunctionComponent, ReactElement } from "react"
import './MapElement.css'

interface MapElementPropsProps {
    src: string

}

const MapElement: FunctionComponent<MapElementPropsProps> = ({ src }): ReactElement => {

    return(
        <div className='map_container'>
            <img src={ src } alt="" /> 
            
        </div>
        
    )

}
export { MapElement }