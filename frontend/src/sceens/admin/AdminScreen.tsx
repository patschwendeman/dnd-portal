import React from 'react'
import { FunctionComponent, ReactElement } from "react"
import { MapOverview } from "../../components/map_overview/MapOverview"
import './AdminScreen.css'

const AdminScreen: FunctionComponent = (): ReactElement => {

    return(
        <div className='admin-screen'>
            <div className='sidebar-right'>
                <div className='sidebar__map-container'>
                    <MapOverview gap="2px" src="/test.jpg" />
                </div>
                
            </div>
            <div className='bottombar'></div>

        </div>
        
    )

}
export { AdminScreen }