import React from 'react'
import { FunctionComponent, ReactElement } from "react"
import { MapOverview } from "../../components/map_overview/MapOverview"
import './WallScreen.css'


const WallScreen: FunctionComponent = (): ReactElement => {

    return(
        <div className='wall-screen'>
            <img src="/test.jpg" alt="" /> 
            <div className='wall-screen__map-container'> 
                <MapOverview gap="10px" src="/test.jpg" />
            </div>
            
          
        </div>       
    )

}
export { WallScreen }